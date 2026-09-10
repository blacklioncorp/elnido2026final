'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { getStripe } from '@/lib/stripe'
import { boletosLimiter } from '@/lib/rate-limit'
import { notificarErrorAdmin } from '@/lib/notifications'

const itemSchema = z.object({
  tipoProductoId: z.uuid(),
  nombre: z.string().min(1),
  precio: z.number().nonnegative(),
  cantidad: z.number().int().positive(),
  categoria: z.string().min(1),
})

const checkoutSchema = z.object({
  items: z.array(itemSchema).min(1, 'El carrito está vacío'),
  fechaVisita: z.string().nullable().optional(),
  clienteEmail: z.email('Correo inválido'),
  clienteNombre: z.string().min(1, 'El nombre es obligatorio'),
  clienteTelefono: z.string().nullable().optional(),
  aceptaWhatsapp: z.boolean().optional(),
  aceptaNewsletter: z.boolean().optional(),
  codigoDescuento: z.string().nullable().optional(),
  descuentoAplicado: z.number().min(0).max(100).optional(),
})

export type CheckoutInput = z.input<typeof checkoutSchema>
export type CheckoutResult = { url: string } | { error: string }

async function getBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

export async function createCheckoutSession(
  input: CheckoutInput,
): Promise<CheckoutResult> {
  // Rate limiting: máximo 5 compras de boletos por IP cada 60 segundos
  const h = await headers()
  const ip = h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? 'unknown'
  const rateLimit = boletosLimiter.check(ip)
  if (!rateLimit.success) {
    return { error: 'Demasiadas solicitudes. Espera un momento.' }
  }

  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  const data = parsed.data

  const admin = await createAdminSupabaseClient()

  // 1. Buscar o crear cliente por email (upsert sobre la restricción UNIQUE).
  const { data: cliente, error: clienteError } = await admin
    .from('clientes')
    .upsert(
      {
        email: data.clienteEmail,
        nombre: data.clienteNombre,
        telefono: data.clienteTelefono ?? null,
        acepta_whatsapp: data.aceptaWhatsapp ?? false,
        acepta_newsletter: data.aceptaNewsletter ?? false,
      },
      { onConflict: 'email' },
    )
    .select()
    .single()

  if (clienteError || !cliente) {
    return { error: 'No se pudo registrar el cliente' }
  }

  // 2. Precios autoritativos desde la base de datos (no confiar en el cliente).
  const ids = [...new Set(data.items.map((i) => i.tipoProductoId))]
  const { data: productos, error: productosError } = await admin
    .from('tipos_producto')
    .select('*')
    .in('id', ids)
    .eq('activo', true)

  if (productosError || !productos || productos.length === 0) {
    return { error: 'No se encontraron los productos seleccionados' }
  }
  const productoPorId = new Map(productos.map((p) => [p.id, p]))

  const lineas = data.items.map((item) => {
    const producto = productoPorId.get(item.tipoProductoId)
    if (!producto) throw new Error(`Producto no disponible: ${item.nombre}`)
    return { item, producto, precio: Number(producto.precio) }
  })

  const subtotal = lineas.reduce((s, l) => s + l.precio * l.item.cantidad, 0)

  // 3. Descuento: validar el código contra la BD (autoritativo) sin quemarlo antes del pago.
  let porcentaje = 0
  let codigoDescuentoId: string | null = null
  let codigoDescuentoAplicado: string | null = null

  if (data.codigoDescuento) {
    const codeClean = data.codigoDescuento.trim().toUpperCase()
    const { data: descRow } = await admin
      .from('codigos_descuento')
      .select('*')
      .ilike('codigo', codeClean)
      .maybeSingle()

    if (descRow) {
      const ahora = new Date()
      const isFechaValida =
        (!descRow.fecha_inicio || new Date(descRow.fecha_inicio) <= ahora) &&
        (!descRow.fecha_fin || new Date(descRow.fecha_fin) >= ahora)

      const categoriasCarrito = [...new Set(lineas.map((l) => l.producto.categoria))]
      const categoriasAplicables = descRow.categorias_aplicables || []
      const isCategoriaValida =
        categoriasAplicables.length === 0 ||
        categoriasAplicables.includes('todas') ||
        categoriasCarrito.some((cat) => categoriasAplicables.includes(cat))

      if (descRow.activo && !descRow.usado && isFechaValida && isCategoriaValida) {
        const totalCantidadItems = lineas.reduce((s, l) => s + l.item.cantidad, 0)
        if (descRow.max_items_por_compra && totalCantidadItems > descRow.max_items_por_compra) {
          return {
            error: `Este código solo aplica hasta ${descRow.max_items_por_compra} items por compra`,
          }
        }

        const descuentoEstimado = (subtotal * Number(descRow.porcentaje_descuento)) / 100
        if (descRow.max_descuento_monto && descuentoEstimado > Number(descRow.max_descuento_monto)) {
          return {
            error: `Este código tiene un descuento máximo de $${descRow.max_descuento_monto}`,
          }
        }

        porcentaje = Number(descRow.porcentaje_descuento)
        codigoDescuentoId = descRow.id
        codigoDescuentoAplicado = descRow.codigo
      }
    } else {
      // Fallback a campañas legacy
      const { data: campana } = await admin
        .from('campanas')
        .select('*')
        .eq('codigo_descuento', codeClean)
        .eq('activa', true)
        .maybeSingle()

      if (campana?.porcentaje_descuento) {
        porcentaje = Number(campana.porcentaje_descuento)
        codigoDescuentoAplicado = campana.codigo_descuento
        await admin.rpc('incrementar_regalo', { p_codigo: codeClean })
      }
    }
  }

  const total = subtotal - (subtotal * porcentaje) / 100
  const cantidadPersonas = lineas.reduce((s, l) => s + l.item.cantidad, 0)

  // Producto principal: la membresía si existe, para la lógica de activación.
  const principal =
    lineas.find((l) => l.producto.categoria === 'membresia')?.producto ??
    lineas[0].producto

  // 4. Crear la compra en estado pendiente.
  const { data: compra, error: compraError } = await admin
    .from('compras')
    .insert({
      cliente_id: cliente.id,
      tipo_producto_id: principal.id,
      total,
      estado: 'pendiente',
      fecha_visita: data.fechaVisita ?? null,
      cantidad_personas: cantidadPersonas,
      metadata: {
        codigo_descuento: codigoDescuentoAplicado ?? null,
        codigo_descuento_id: codigoDescuentoId ?? null,
        porcentaje_descuento: porcentaje,
      },
    })
    .select()
    .single()

  if (compraError || !compra) {
    return { error: 'No se pudo registrar la compra' }
  }

  // 4b. Registrar cada producto vendido por separado (precios autoritativos).
  const itemsParaInsertar = lineas.map((l) => ({
    compra_id: compra.id,
    tipo_producto_id: l.producto.id,
    nombre: l.producto.nombre,
    cantidad: l.item.cantidad,
    precio_unitario: l.precio,
    categoria: l.producto.categoria,
  }))

  const { error: itemsError } = await admin.from('compra_items').insert(itemsParaInsertar)

  if (itemsError) {
    console.error('Error insertando compra_items:', itemsError)
  }

  // 4c. Verificar que el día de venta esté habilitado y consultar cupo diario
  if (data.fechaVisita) {
    const [y, m, d] = data.fechaVisita.split('-').map(Number)
    const diaSemana = new Date(y, m - 1, d).getDay()
    const { data: diaVenta } = await admin
      .from('dias_venta')
      .select('habilitado')
      .eq('dia_semana', diaSemana)
      .maybeSingle()

    if (diaVenta && diaVenta.habilitado === false) {
      await admin.from('compras').delete().eq('id', compra.id)
      return { error: 'No hay venta de boletos disponible para el día de la semana seleccionado. Elige otra fecha.' }
    }

    const { data: cupoData } = await admin.rpc('consultar_disponibilidad', {
      fecha_consulta: data.fechaVisita,
    })

    if (cupoData && cupoData.length > 0) {
      const disponibles = cupoData[0].disponibles
      if (disponibles <= 0) {
        // Revert pending purchase
        await admin.from('compras').delete().eq('id', compra.id)
        return { error: 'Lo sentimos, este día está completamente reservado. Elige otra fecha.' }
      }
      if (disponibles < cantidadPersonas) {
        await admin.from('compras').delete().eq('id', compra.id)
        return {
          error: `Solo quedan ${disponibles} lugar${disponibles !== 1 ? 'es' : ''} disponible${disponibles !== 1 ? 's' : ''} para esta fecha. Ajusta la cantidad de personas.`,
        }
      }
    }
  }

  // 5. Sesión de Stripe Checkout con line items dinámicos.

  const stripe = getStripe()
  const base = await getBaseUrl()

  let discounts: { coupon: string }[] | undefined
  if (porcentaje > 0) {
    const coupon = await stripe.coupons.create({
      percent_off: porcentaje,
      duration: 'once',
      name: data.codigoDescuento ?? 'Descuento',
    })
    discounts = [{ coupon: coupon.id }]
  }

  // expires_at: 30 minutos desde ahora (Stripe requiere mínimo 30 min; +10s para evitar drift)
  const expiresAt = Math.floor(Date.now() / 1000) + 30 * 60 + 10

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: data.clienteEmail,
      expires_at: expiresAt,
      line_items: lineas.map((l) => ({
        quantity: l.item.cantidad,
        price_data: {
          currency: 'mxn',
          unit_amount: Math.round(l.precio * 100),
          product_data: {
            name: l.producto.nombre,
            description: l.producto.descripcion || undefined,
          },
        },
      })),
      discounts,
      success_url: `${base}/boletos/confirmacion?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/boletos`,
      metadata: { 
        compra_id: compra.id,
        producto: 'entrada',
        codigo_descuento: codigoDescuentoAplicado ?? '',
        codigo_descuento_id: codigoDescuentoId ?? '',
      },
    })

    await admin
      .from('compras')
      .update({ stripe_session_id: session.id })
      .eq('id', compra.id)

    if (!session.url) return { error: 'Stripe no devolvió una URL de pago' }
    return { url: session.url }
  } catch (err) {
    await notificarErrorAdmin(err, 'compra de boletos')
    const mensaje =
      err instanceof Error ? err.message : 'Error al crear la sesión de pago'
    return { error: mensaje }
  }
}
