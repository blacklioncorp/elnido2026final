import { NextResponse } from 'next/server'
import type Stripe from 'stripe'
import { getStripe } from '@/lib/stripe'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { addDays, format } from 'date-fns'
import { generarQrDataUrl } from '@/lib/qr'
import { enviarEmailConfirmacion } from '@/lib/email'
import {
  enviarEmailConfirmacionDonacion,
  enviarEmailMetaCumplida,
  enviarEmailConfirmacionDonacionGenerica,
} from '@/lib/email-donaciones'

// Los webhooks necesitan el cuerpo sin procesar para verificar la firma.
export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')
  const secret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !secret) {
    return NextResponse.json(
      { error: 'Falta la firma o STRIPE_WEBHOOK_SECRET' },
      { status: 400 },
    )
  }

  let event: Stripe.Event
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret)
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'Firma inválida'
    return NextResponse.json({ error: mensaje }, { status: 400 })
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session
    const admin = await createAdminSupabaseClient()

    // ────────────────────────────────────────────────────────────
    // BRANCH A: Donación (genérica o por especie)
    // Detectado por metadata.producto === 'donacion'
    // ────────────────────────────────────────────────────────────
    if (session.metadata?.producto === 'donacion') {
      const origen = (session.metadata?.origen ?? 'donar') as 'donar' | 'donativos'
      const tarjetaId = session.metadata?.tarjeta_id ?? null
      const donanteNombre = session.metadata?.donante_nombre ?? 'Anónimo'
      const donanteEmail = session.metadata?.donante_email ?? ''
      const donanteUsername = session.metadata?.donante_username ?? null
      const monto = Number(session.metadata?.monto ?? 0)
      const mensajeDonante = session.metadata?.mensaje ?? null
      const esRecurrente = session.metadata?.es_recurrente === 'true'
      const subscriptionId = session.subscription as string | null

      // 1. Insertar donación en tabla unificada (idempotent via UNIQUE stripe_session_id)
      await admin.from('donaciones').insert({
        tarjeta_id: tarjetaId ?? null,
        donante_nombre: donanteNombre,
        donante_email: donanteEmail,
        donante_username: donanteUsername ?? null,
        monto,
        stripe_session_id: session.id,
        mensaje: mensajeDonante ?? null,
        origen,
        es_recurrente: esRecurrente,
        stripe_subscription_id: esRecurrente ? subscriptionId : null,
        estado_suscripcion: esRecurrente ? 'activa' : null,
      })

      // 2. Si es una donación por especie, actualizar monto_recaudado
      if (origen === 'donativos' && tarjetaId) {
        // Fetch current state
        const { data: tarjeta } = await admin
          .from('tarjetas_donacion')
          .select('monto_recaudado, meta_monto, meta_cumplida, nombre_especie, nombre_animal')
          .eq('id', tarjetaId)
          .maybeSingle()

        if (tarjeta) {
          const nuevoMonto = Number(tarjeta.monto_recaudado) + monto

          // Update the card amount (trigger verificar_meta_cumplida will auto-check goal)
          await admin
            .from('tarjetas_donacion')
            .update({ monto_recaudado: nuevoMonto })
            .eq('id', tarjetaId)

          // 3. If goal just reached, notify all donors
          if (!tarjeta.meta_cumplida && nuevoMonto >= tarjeta.meta_monto) {
            const { data: todos } = await admin
              .from('donaciones')
              .select('donante_email')
              .eq('tarjeta_id', tarjetaId)

            const emailsUnicos = [
              ...new Set(
                (todos ?? []).map((d) => d.donante_email).filter((e): e is string => !!e),
              ),
            ]

            await enviarEmailMetaCumplida({
              emails: emailsUnicos,
              nombreEspecie: tarjeta.nombre_especie,
              nombreAnimal: tarjeta.nombre_animal,
              metaMonto: tarjeta.meta_monto,
              totalDonantes: emailsUnicos.length,
            })
          }

          // 4. Individual confirmation email to this donor
          if (donanteEmail) {
            await enviarEmailConfirmacionDonacion({
              to: donanteEmail,
              donanteNombre,
              donanteUsername: donanteUsername ?? null,
              nombreEspecie: tarjeta.nombre_especie,
              nombreAnimal: tarjeta.nombre_animal,
              monto,
            })
          }
        }
      }

      // 5. Generic donation confirmation email (/donar)
      if (origen === 'donar' && donanteEmail) {
        await enviarEmailConfirmacionDonacionGenerica({
          to: donanteEmail,
          nombre: donanteNombre,
          monto,
        })
      }

      return NextResponse.json({ received: true })
    }

    // ────────────────────────────────────────────────────────────
    // BRANCH B: Boleto / Membresía (existing logic — untouched)
    // ────────────────────────────────────────────────────────────
    const compraId = session.metadata?.compra_id

    if (compraId) {
      // 1. Consultar compra_items para ver si hay membresía
      const { data: items } = await admin
        .from('compra_items')
        .select('*')
        .eq('compra_id', compraId)

      const membresia = items?.find((i) => i.categoria === 'membresia')

      const updates: any = {
        estado: 'completado',
      }

      if (membresia && membresia.tipo_producto_id) {
        const { data: tipoProducto } = await admin
          .from('tipos_producto')
          .select('metadata')
          .eq('id', membresia.tipo_producto_id)
          .single()
        
        const meta = (tipoProducto?.metadata || {}) as Record<string, unknown>
        const validezDias = (meta?.validez_dias as number) || 365
        const hoy = new Date()
        updates.membresia_inicio = format(hoy, 'yyyy-MM-dd')
        updates.membresia_fin = format(addDays(hoy, validezDias), 'yyyy-MM-dd')
        updates.saldo_actual = (meta?.saldo as number) || 0
        updates.descuento_eventos = (meta?.descuento_eventos as number) || 0
      }

      // 2. Generar QR de una vez
      const qrToken = `ELNIDO-${compraId}`
      updates.qr_code = qrToken

      // Actualizar la compra
      const { data: compra } = await admin
        .from('compras')
        .update(updates)
        .eq('id', compraId)
        .select()
        .single()

      // 3. Incrementar cupo diario de forma atómica via RPC
      if (compra?.fecha_visita && compra.cantidad_personas) {
        await admin.rpc('incrementar_cupo', {
          p_fecha: compra.fecha_visita,
          p_cantidad: compra.cantidad_personas,
        })
      }

      // 4. Enviar email
      if (compra && compra.cliente_id) {
        const { data: cliente } = await admin
          .from('clientes')
          .select('nombre, email')
          .eq('id', compra.cliente_id)
          .maybeSingle()

        if (cliente?.email) {
          const qrDataUrl = await generarQrDataUrl(qrToken)
          const producto = membresia
            ? membresia.nombre
            : (items?.[0]?.nombre ?? 'tu compra')

          await enviarEmailConfirmacion({
            to: cliente.email,
            nombre: cliente.nombre ?? 'guardián',
            producto,
            esMembresia: !!membresia,
            qrDataUrl,
          })
        }
      }
    }
  }

  // ────────────────────────────────────────────────────────────
  // BRANCH C: Suscripción cancelada
  // ────────────────────────────────────────────────────────────
  if (event.type === 'customer.subscription.deleted') {
    const subscription = event.data.object as Stripe.Subscription
    const admin = await createAdminSupabaseClient()
    
    await admin
      .from('donaciones')
      .update({ estado_suscripcion: 'cancelada' })
      .eq('stripe_subscription_id', subscription.id)
      
    return NextResponse.json({ received: true })
  }

  return NextResponse.json({ received: true })
}
