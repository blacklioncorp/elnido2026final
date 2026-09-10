'use server'

import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { gestionarSuscripcionGuardian } from '@/app/actions/guardian'

export interface ApadrinamientoRow {
  id: string
  tarjeta_id: string | null
  donante_nombre: string
  donante_email: string
  donante_username: string | null
  monto: number
  stripe_session_id: string | null
  stripe_subscription_id: string | null
  estado_suscripcion: 'activa' | 'pausada' | 'cancelada' | string | null
  mensaje: string | null
  origen: string
  es_recurrente: boolean
  created_at: string
  tarjeta?: {
    id: string
    nombre_especie: string
    nombre_animal: string | null
    tipo: string
    imagen_url: string | null
    meta_monto: number | null
    monto_recaudado: number | null
  } | null
}

export interface ApadrinamientosKPIs {
  totalRecaudado: number
  guardianesActivos: number
  recurrentesCount: number
  unicosCount: number
  totalPadrinos: number
}

export interface EspecieOpcion {
  id: string
  nombre_especie: string
  nombre_animal: string | null
}

export async function getApadrinamientosData(): Promise<{
  apadrinamientos: ApadrinamientoRow[]
  kpis: ApadrinamientosKPIs
  especies: EspecieOpcion[]
}> {
  const supabase = await createAdminSupabaseClient()

  // 1. Obtener todas las donaciones con su tarjeta de donación asociada
  const { data: donacionesData, error } = await supabase
    .from('donaciones')
    .select('*, tarjetas_donacion(id, nombre_especie, nombre_animal, tipo, imagen_url, meta_monto, monto_recaudado)')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching donaciones:', error)
  }

  const apadrinamientos: ApadrinamientoRow[] = (donacionesData || []).map((d: any) => ({
    id: d.id,
    tarjeta_id: d.tarjeta_id,
    donante_nombre: d.donante_nombre,
    donante_email: d.donante_email,
    donante_username: d.donante_username,
    monto: Number(d.monto || 0),
    stripe_session_id: d.stripe_session_id,
    stripe_subscription_id: d.stripe_subscription_id,
    estado_suscripcion: d.estado_suscripcion || (d.es_recurrente ? 'activa' : null),
    mensaje: d.mensaje,
    origen: d.origen,
    es_recurrente: Boolean(d.es_recurrente),
    created_at: d.created_at,
    tarjeta: d.tarjetas_donacion || null,
  }))

  // 2. Calcular KPIs
  const totalRecaudado = apadrinamientos.reduce((acc, row) => acc + row.monto, 0)
  
  const recurrentes = apadrinamientos.filter(row => row.es_recurrente)
  const unicos = apadrinamientos.filter(row => !row.es_recurrente)
  
  const activeGuardianEmails = new Set(
    recurrentes
      .filter(row => row.estado_suscripcion !== 'cancelada')
      .map(row => row.donante_email)
  )
  const guardianesActivos = activeGuardianEmails.size || (recurrentes.length > 0 ? recurrentes.length : 0)

  const allPadrinoEmails = new Set(apadrinamientos.map(row => row.donante_email))
  const totalPadrinos = allPadrinoEmails.size

  // 3. Obtener catálogo de especies para filtro
  const { data: tarjetasData } = await supabase
    .from('tarjetas_donacion')
    .select('id, nombre_especie, nombre_animal')
    .order('nombre_especie', { ascending: true })

  const especies: EspecieOpcion[] = (tarjetasData || []).map(t => ({
    id: t.id,
    nombre_especie: t.nombre_especie,
    nombre_animal: t.nombre_animal,
  }))

  return {
    apadrinamientos,
    kpis: {
      totalRecaudado,
      guardianesActivos,
      recurrentesCount: recurrentes.length,
      unicosCount: unicos.length,
      totalPadrinos,
    },
    especies,
  }
}

export async function cambiarEstadoSuscripcionAdmin(
  donacionId: string,
  accion: 'pausar' | 'reanudar' | 'cancelar'
) {
  try {
    const res = await gestionarSuscripcionGuardian(donacionId, accion)
    if (!res.success) {
      return { success: false, error: res.error || 'No se pudo actualizar la suscripción' }
    }
    revalidatePath('/admin/apadrinamientos')
    revalidatePath('/admin')
    revalidatePath('/admin/reportes')
    return { success: true, message: `Suscripción ${accion === 'pausar' ? 'pausada' : accion === 'reanudar' ? 'reactivada' : 'cancelada'} con éxito` }
  } catch (err: any) {
    console.error('Error al cambiar suscripción desde admin:', err)
    return { success: false, error: err.message || 'No se pudo actualizar la suscripción' }
  }
}
