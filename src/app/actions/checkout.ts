'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { getStripe } from '@/lib/stripe'

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

  // 3. Descuento: validar el código contra la BD (autoritativo) y reservar regalo.
  let porcentaje = 0
  if (data.codigoDescuento) {
    const { data: campana } = await admin
      .from('campanas')
      .select('*')
      .eq('codigo_descuento', data.codigoDescuento)
      .eq('activa', true)
      .maybeSingle()
    if (campana?.porcentaje_descuento) {
      porcentaje = Number(campana.porcentaje_descuento)
      // Reserva atómica del regalo (best-effort; si se agotó, el descuento sigue).
      await admin.rpc('incrementar_regalo', { p_codigo: data.codigoDescuento })
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
        codigo_descuento: data.codigoDescuento ?? null,
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

  // 4c. Verificar cupo diario si la compra tiene fecha de visita.
  if (data.fechaVisita) {
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

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: data.clienteEmail,
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
      },
    })

    await admin
      .from('compras')
      .update({ stripe_session_id: session.id })
      .eq('id', compra.id)

    if (!session.url) return { error: 'Stripe no devolvió una URL de pago' }
    return { url: session.url }
  } catch (err) {
    const mensaje =
      err instanceof Error ? err.message : 'Error al crear la sesión de pago'
    return { error: mensaje }
  }
}
