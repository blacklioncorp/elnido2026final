'use server'

import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function getTarjetasImpulsaVuelo() {
  const supabase = await createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('tarjetas_donacion')
    .select('*')
    .eq('seccion', 'impulsa_vuelo')
    .eq('activa', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching tarjetas_donacion impulsa_vuelo:', error)
    return null
  }
  return data
}

export async function getTarjetaById(id: string) {
  const supabase = await createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('tarjetas_donacion')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error(`Error fetching tarjeta_donacion con id ${id}:`, error)
    return null
  }
  return data
}

export async function getActualizaciones(tarjetaId: string) {
  const supabase = await createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('actualizaciones_liberacion')
    .select('*')
    .eq('tarjeta_id', tarjetaId)
    .order('fecha', { ascending: false })

  if (error) {
    console.error('Error fetching actualizaciones_liberacion:', error)
    return []
  }
  return data
}

export async function crearActualizacion(datos: any) {
  const supabase = await createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('actualizaciones_liberacion')
    .insert([datos])
    .select()

  if (error) {
    console.error('Error creating actualizacion_liberacion:', error)
    return { success: false, error: error.message }
  }
  return { success: true, data }
}

export async function actualizarActualizacion(id: string, datos: any) {
  const supabase = await createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('actualizaciones_liberacion')
    .update(datos)
    .eq('id', id)
    .select()

  if (error) {
    console.error('Error updating actualizacion_liberacion:', error)
    return { success: false, error: error.message }
  }
  return { success: true, data }
}

export async function eliminarActualizacion(id: string) {
  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase
    .from('actualizaciones_liberacion')
    .delete()
    .eq('id', id)

  if (error) {
    console.error('Error deleting actualizacion_liberacion:', error)
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function verificarPadrino(email: string, tarjetaId: string) {
  const supabase = await createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('donaciones')
    .select('id')
    .eq('donante_email', email)
    .eq('tarjeta_id', tarjetaId)
    .or('es_recurrente.is.false,es_recurrente.is.null,and(es_recurrente.is.true,estado_suscripcion.eq.activa)')
    .limit(1)

  if (error) {
    console.error('Error verificando padrino:', error)
    return false
  }
  
  return data && data.length > 0
}

export async function verificarPadrinoPorSession(sessionId: string, tarjetaId: string) {
  const supabase = await createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('donaciones')
    .select('id')
    .eq('stripe_session_id', sessionId)
    .eq('tarjeta_id', tarjetaId)
    .limit(1)

  if (error) {
    console.error('Error verificando padrino por session:', error)
    return false
  }
  
  return data && data.length > 0
}
