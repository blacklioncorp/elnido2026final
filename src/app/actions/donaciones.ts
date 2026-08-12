'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { getStripe } from '@/lib/stripe'
import { donacionesLimiter } from '@/lib/rate-limit'
import { sanitizeHtml } from '@/lib/utils'

const donacionSchema = z.object({
  tarjetaId: z.string().uuid('ID de tarjeta inválido'),
  donanteNombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  donanteEmail: z.email('Correo electrónico inválido'),
  donanteUsername: z
    .string()
    .min(3, 'El alias debe tener al menos 3 caracteres')
    .max(20, 'El alias no puede superar 20 caracteres')
    .regex(/^[a-zA-Z0-9]+$/, 'Solo letras y números, sin espacios'),
  monto: z
    .number()
    .positive('El monto debe ser mayor a cero')
    .max(50000, 'El monto máximo es $50,000 MXN'),
  mensaje: z.string().max(200, 'El mensaje no puede superar 200 caracteres').optional(),
  esRecurrente: z.boolean().optional().default(false),
})

export type DonacionInput = z.input<typeof donacionSchema>
export type DonacionResult = { url: string } | { error: string }

async function getBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

export async function createDonacionCheckout(input: DonacionInput): Promise<DonacionResult> {
  const h = await headers()
  const ip = h.get('x-forwarded-for') ?? 'unknown'
  const rateLimit = donacionesLimiter.check(ip)
  
  if (!rateLimit.success) {
    return { error: 'Demasiadas solicitudes. Espera un momento.' }
  }

  const parsed = donacionSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  const { tarjetaId, donanteNombre, donanteEmail, donanteUsername, monto, mensaje, esRecurrente } = parsed.data

  const stripe = getStripe()
  const base = await getBaseUrl()

  try {
    const session = await stripe.checkout.sessions.create({
      mode: esRecurrente ? 'subscription' : 'payment',
      customer_email: donanteEmail,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'mxn',
            unit_amount: Math.round(monto * 100),
            recurring: esRecurrente ? { interval: 'month' } : undefined,
            product_data: {
              name: `Donativo para especie en El Nido`,
              description: mensaje || 'Gracias por ser un Guardián del santuario',
            },
          },
        },
      ],
      success_url: `${base}/donativos/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/donativos`,
      metadata: {
        producto: 'donacion',
        origen: 'donativos',
        tarjeta_id: tarjetaId,
        donante_nombre: sanitizeHtml(donanteNombre),
        donante_email: donanteEmail,
        donante_username: donanteUsername ? sanitizeHtml(donanteUsername) : '',
        monto: String(monto),
        mensaje: mensaje ? sanitizeHtml(mensaje) : '',
        es_recurrente: esRecurrente ? 'true' : 'false',
      },
    })

    if (!session.url) return { error: 'Stripe no devolvió una URL de pago' }
    return { url: session.url }
  } catch (err) {
    const mensaje = err instanceof Error ? err.message : 'Error al crear la sesión de pago'
    return { error: mensaje }
  }
}

// ---------------------------------------------------------------
// Server Action: createDonacionGenericaCheckout
// Used by the updated /donar page (Opción B)
// ---------------------------------------------------------------
const donacionGenericaSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  email: z.email('Correo electrónico inválido'),
  monto: z
    .number()
    .positive('El monto debe ser mayor a cero')
    .max(50000, 'El monto máximo es $50,000 MXN'),
  esRecurrente: z.boolean().optional().default(false),
})

export type DonacionGenericaInput = z.input<typeof donacionGenericaSchema>

export async function createDonacionGenericaCheckout(
  input: DonacionGenericaInput,
): Promise<DonacionResult> {
  const h = await headers()
  const ip = h.get('x-forwarded-for') ?? 'unknown'
  const rateLimit = donacionesLimiter.check(ip)
  
  if (!rateLimit.success) {
    return { error: 'Demasiadas solicitudes. Espera un momento.' }
  }

  const parsed = donacionGenericaSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }
  const { nombre, email, monto, esRecurrente } = parsed.data

  const stripe = getStripe()
  const base = await getBaseUrl()

  try {
    const session = await stripe.checkout.sessions.create({
      mode: esRecurrente ? 'subscription' : 'payment',
      customer_email: email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: 'mxn',
            unit_amount: Math.round(monto * 100),
            recurring: esRecurrente ? { interval: 'month' } : undefined,
            product_data: {
              name: 'Donación al Santuario El Nido',
              description: '100% destinado a conservación de fauna mexicana',
            },
          },
        },
      ],
      success_url: `${base}/donar/gracias?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${base}/donar`,
      metadata: {
        producto: 'donacion',
        origen: 'donar',
        donante_nombre: sanitizeHtml(nombre),
        donante_email: email,
        monto: String(monto),
        mensaje: '',
        es_recurrente: esRecurrente ? 'true' : 'false',
      },
    })

    if (!session.url) return { error: 'Stripe no devolvió una URL de pago' }
    return { url: session.url }
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Error al crear la sesión de pago'
    return { error: msg }
  }
}

export async function createStripeProductForCard(tarjetaId: string, nombreEspecie: string) {
  const stripe = getStripe()
  const { createAdminSupabaseClient } = await import('@/lib/supabase-server')
  
  try {
    const product = await stripe.products.create({
      name: `Donativo Mensual: ${nombreEspecie}`,
      description: `Suscripción de donativo mensual para la conservación de ${nombreEspecie}`,
    })

    const admin = await createAdminSupabaseClient()
    await admin
      .from('tarjetas_donacion')
      .update({ stripe_product_id: product.id })
      .eq('id', tarjetaId)

    return { success: true }
  } catch (error) {
    console.error('Error al crear producto en Stripe:', error)
    return { error: 'Error al crear producto en Stripe' }
  }
}

