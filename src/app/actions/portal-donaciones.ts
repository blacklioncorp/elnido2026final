'use server'

import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { getStripe } from '@/lib/stripe'
import { getMagicLinkTemplate } from '@/lib/email-templates/magic-link'
import { headers } from 'next/headers'
import { Resend } from 'resend'

// Types
export interface DonacionActiva {
  id: string
  monto: number
  estado_suscripcion: string
  stripe_subscription_id: string
  es_recurrente: boolean
  tarjeta_id?: string
  nombre_especie?: string
  nombre_animal?: string
}

async function getBaseUrl(): Promise<string> {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? 'https'
  return `${proto}://${host}`
}

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  return new Resend(key)
}

// 1. Solicitar Magic Link
export async function solicitarMagicLink(email: string): Promise<{ success?: string; error?: string }> {
  try {
    const supabase = await createAdminSupabaseClient()
    
    // Check if user has active recurring donations
    const { data: activeDonations, error: queryError } = await supabase
      .from('donaciones')
      .select('id')
      .eq('donante_email', email)
      .eq('es_recurrente', true)
      .in('estado_suscripcion', ['active', 'activa', 'pausada', 'paused'])

    if (queryError) {
      console.error('Error querying donations:', queryError)
      return { error: 'Error al buscar donaciones activas.' }
    }

    if (!activeDonations || activeDonations.length === 0) {
      return { error: 'No encontramos donaciones activas para este email.' }
    }

    // Generate token
    const token = crypto.randomUUID()
    
    // Expires in 30 minutes
    const expira_en = new Date()
    expira_en.setMinutes(expira_en.getMinutes() + 30)

    // Save token in DB
    const { error: insertError } = await supabase
      .from('tokens_cancelacion')
      .insert({
        token,
        email,
        expira_en: expira_en.toISOString(),
      })

    if (insertError) {
      console.error('Error inserting token:', insertError)
      return { error: 'Error al generar el enlace de acceso.' }
    }

    // Send email
    const resend = getResend()
    if (!resend) {
      console.warn('RESEND_API_KEY no configurada. El token es:', token)
      return { success: 'Enlace generado (Revisa la consola de desarrollo).' }
    }

    const base = await getBaseUrl()
    const magicLinkUrl = `${base}/mis-donaciones?token=${token}`
    const html = getMagicLinkTemplate(magicLinkUrl)

    const { data: resendData, error: resendError } = await resend.emails.send({
      from: process.env.RESEND_FROM ?? 'El Nido <onboarding@resend.dev>',
      to: email,
      subject: 'Gestiona tus donaciones en El Nido 🦜',
      html,
    })

    if (resendError) {
      console.error('Resend error:', resendError)
      return { error: 'No se pudo enviar el correo por una restricción de Resend. Revisa la consola.' }
    }

    return { success: 'Revisa tu correo. Enviamos tu enlace de acceso.' }
  } catch (error) {
    console.error('solicitarMagicLink error:', error)
    return { error: 'Error interno del servidor.' }
  }
}

// 2. Validar Token
export async function validarToken(token: string): Promise<{ email?: string; error?: string }> {
  try {
    const supabase = await createAdminSupabaseClient()
    
    const { data, error } = await supabase
      .from('tokens_cancelacion')
      .select('*')
      .eq('token', token)
      .single()

    if (error || !data) {
      return { error: 'Enlace inválido o inexistente.' }
    }

    if (data.usado) {
      return { error: 'Este enlace ya fue usado.' }
    }

    if (new Date(data.expira_en) < new Date()) {
      return { error: 'El enlace ha expirado.' }
    }

    // Marcar como usado (opcional: o puedes mantenerlo vivo hasta que expire)
    // Lo marcaremos como usado para mayor seguridad, pero en un portal de donaciones
    // a veces es mejor dejarlo vivir los 30 minutos.
    // El requerimiento no dice explícitamente "un solo uso", pero la DB tiene 'usado'.
    // Lo dejaremos activo pero validado. Solo lo invalidaremos si es necesario.
    // await supabase.from('tokens_cancelacion').update({ usado: true }).eq('token', token)

    return { email: data.email }
  } catch (error) {
    console.error('validarToken error:', error)
    return { error: 'Error al validar el enlace.' }
  }
}

// 3. Get Donaciones Activas
export async function getDonacionesActivas(email: string): Promise<{ data?: DonacionActiva[]; error?: string }> {
  try {
    const supabase = await createAdminSupabaseClient()
    
    const { data, error } = await supabase
      .from('donaciones')
      .select(`
        id, monto, estado_suscripcion, stripe_subscription_id, es_recurrente,
        tarjeta_id,
        tarjetas_donacion (nombre_especie, nombre_animal)
      `)
      .eq('donante_email', email)
      .eq('es_recurrente', true)
      .in('estado_suscripcion', ['active', 'activa', 'pausada', 'paused'])
      .order('created_at', { ascending: false })

    if (error) {
      console.error('getDonacionesActivas error:', error)
      return { error: 'Error al obtener donaciones.' }
    }

    const formatData: DonacionActiva[] = data.map((d: any) => ({
      id: d.id,
      monto: d.monto,
      estado_suscripcion: d.estado_suscripcion,
      stripe_subscription_id: d.stripe_subscription_id,
      es_recurrente: d.es_recurrente,
      tarjeta_id: d.tarjeta_id,
      nombre_especie: d.tarjetas_donacion?.nombre_especie,
      nombre_animal: d.tarjetas_donacion?.nombre_animal,
    }))

    return { data: formatData }
  } catch (error) {
    console.error('getDonacionesActivas exception:', error)
    return { error: 'Error interno al buscar donaciones.' }
  }
}

// 4. Cancelar Donación
export async function cancelarDonacion(subscriptionId: string, email: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const stripe = getStripe()
    const supabase = await createAdminSupabaseClient()

    // Cancel in Stripe
    await stripe.subscriptions.cancel(subscriptionId)

    // Update in Supabase
    const { error } = await supabase
      .from('donaciones')
      .update({ estado_suscripcion: 'cancelada' })
      .eq('stripe_subscription_id', subscriptionId)
      .eq('donante_email', email)

    if (error) {
      console.error('cancelarDonacion DB error:', error)
    }

    return { success: true }
  } catch (error) {
    console.error('cancelarDonacion error:', error)
    return { error: 'Error al cancelar la donación en Stripe.' }
  }
}

// 5. Pausar Donación
export async function pausarDonacion(subscriptionId: string, email: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const stripe = getStripe()
    const supabase = await createAdminSupabaseClient()

    // Pause in Stripe (pause collection)
    await stripe.subscriptions.update(subscriptionId, {
      pause_collection: { behavior: 'void' },
    })

    // Update in Supabase
    const { error } = await supabase
      .from('donaciones')
      .update({ estado_suscripcion: 'pausada' })
      .eq('stripe_subscription_id', subscriptionId)
      .eq('donante_email', email)

    if (error) console.error('pausarDonacion DB error:', error)

    return { success: true }
  } catch (error) {
    console.error('pausarDonacion error:', error)
    return { error: 'Error al pausar la donación en Stripe.' }
  }
}

// 6. Reanudar Donación
export async function reanudarDonacion(subscriptionId: string, email: string): Promise<{ success?: boolean; error?: string }> {
  try {
    const stripe = getStripe()
    const supabase = await createAdminSupabaseClient()

    // Resume in Stripe
    await stripe.subscriptions.update(subscriptionId, {
      pause_collection: '',
    })

    // Update in Supabase
    const { error } = await supabase
      .from('donaciones')
      .update({ estado_suscripcion: 'activa' })
      .eq('stripe_subscription_id', subscriptionId)
      .eq('donante_email', email)

    if (error) console.error('reanudarDonacion DB error:', error)

    return { success: true }
  } catch (error) {
    console.error('reanudarDonacion error:', error)
    return { error: 'Error al reanudar la donación en Stripe.' }
  }
}

// 7. Cambiar Monto
export async function cambiarMonto(subscriptionId: string, nuevoMonto: number, email: string): Promise<{ success?: boolean; error?: string }> {
  if (nuevoMonto < 50) return { error: 'El monto mínimo es de $50 MXN' }
  try {
    const stripe = getStripe()
    const supabase = await createAdminSupabaseClient()

    // Get current subscription items
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    const itemId = subscription.items.data[0]?.id

    if (!itemId) return { error: 'No se encontró el item de la suscripción' }

    // Crear un nuevo producto en Stripe porque los productos generados 
    // automáticamente por Checkout no permiten agregarles nuevos precios.
    const newProduct = await stripe.products.create({
      name: 'Donación al Santuario El Nido',
      description: 'Donación recurrente (monto actualizado)',
    })

    // Create a new price
    const price = await stripe.prices.create({
      currency: 'mxn',
      unit_amount: Math.round(nuevoMonto * 100),
      recurring: { interval: 'month' },
      product: newProduct.id,
    })

    // Update subscription with new price
    await stripe.subscriptions.update(subscriptionId, {
      items: [{
        id: itemId,
        price: price.id,
      }],
      proration_behavior: 'none', // Don't charge/credit immediately
    })

    // Update in Supabase
    const { error } = await supabase
      .from('donaciones')
      .update({ monto: nuevoMonto })
      .eq('stripe_subscription_id', subscriptionId)
      .eq('donante_email', email)

    if (error) console.error('cambiarMonto DB error:', error)

    return { success: true }
  } catch (error) {
    console.error('cambiarMonto error:', error)
    return { error: 'Error al cambiar el monto de la donación.' }
  }
}
