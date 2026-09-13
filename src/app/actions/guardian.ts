'use server'

import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { getStripe } from '@/lib/stripe'
import type { Database } from '@/lib/database.types'

export type TarjetaDonacion = Database['public']['Tables']['tarjetas_donacion']['Row']
export type ActualizacionLiberacion = Database['public']['Tables']['actualizaciones_liberacion']['Row']

export interface ApadrinamientoItem {
  id: string
  tarjeta_id: string
  monto: number
  es_recurrente: boolean
  estado_suscripcion: 'activa' | 'pausada' | 'cancelada' | string
  stripe_subscription_id: string | null
  created_at: string
  tarjeta: TarjetaDonacion
}

export interface NoticiaItem {
  id: string
  tipo: 'blog' | 'bitacora'
  titulo: string
  descripcion: string
  imagen_url: string | null
  fecha: string
  link: string
  especie_nombre?: string
}

export interface EventoItem {
  id: string
  nombre: string
  descripcion: string | null
  precio: number
  fecha: string | null
  lugar: string | null
  imagen_url: string | null
}

export interface GuardianData {
  autenticado: boolean
  esAnonimoConToken: boolean
  usuario: {
    nombre: string
    email: string
    username?: string | null
  } | null
  kpis: {
    especiesApadrinadas: number
    totalAportado: number
    semanasActivo: number
    vidasImpactadas: number
  }
  apadrinamientos: ApadrinamientoItem[]
  impulsaVuelo: {
    tarjetas: TarjetaDonacion[]
    actualizaciones: Record<string, ActualizacionLiberacion[]>
  }
  noticias: NoticiaItem[]
  eventos: EventoItem[]
}

export async function getGuardianData(token?: string): Promise<GuardianData | null> {
  try {
    const adminSupabase = await createAdminSupabaseClient()
    const serverSupabase = await createServerSupabaseClient()

    // 1. Obtener usuario autenticado o verificar token
    let email: string | null = null
    let nombreUsuario: string = 'Guardián del Nido'
    let username: string | null = null
    let esAnonimoConToken = false

    const { data: { user } } = await serverSupabase.auth.getUser()

    if (user && user.email) {
      email = user.email
      nombreUsuario = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0]
      username = user.user_metadata?.username || null
    } else if (token && token.trim()) {
      const cleanToken = token.trim()
      
      // Buscar donación asociada al token (por stripe_session_id o donante_email)
      const { data: donacionToken } = await adminSupabase
        .from('donaciones')
        .select('donante_email, donante_nombre, donante_username')
        .or(`stripe_session_id.eq.${cleanToken},donante_email.eq.${cleanToken}`)
        .limit(1)
        .maybeSingle()

      if (donacionToken && donacionToken.donante_email) {
        email = donacionToken.donante_email
        nombreUsuario = donacionToken.donante_nombre || 'Guardián del Nido'
        username = donacionToken.donante_username || null
        esAnonimoConToken = true
      }
    }

    // Si no hay sesión ni token válido
    if (!email) {
      return null
    }

    // 2. Obtener todas las donaciones del donante
    const { data: donaciones, error: donacionesErr } = await adminSupabase
      .from('donaciones')
      .select('*, tarjeta:tarjetas_donacion(*)')
      .eq('donante_email', email)
      .order('created_at', { ascending: false })

    if (donacionesErr) {
      console.error('Error fetching donaciones:', donacionesErr)
    }

    const donacionesList = donaciones || []

    // 3. Filtrar apadrinamientos (recurrentes o con tarjeta activa)
    const apadrinamientosMap = new Map<string, ApadrinamientoItem>()

    for (const d of donacionesList) {
      if (!d.tarjeta_id || !d.tarjeta) continue
      
      // Si aún no tenemos esta tarjeta o encontramos una suscripción más reciente
      if (!apadrinamientosMap.has(d.tarjeta_id)) {
        apadrinamientosMap.set(d.tarjeta_id, {
          id: d.id,
          tarjeta_id: d.tarjeta_id,
          monto: Number(d.monto) || 0,
          es_recurrente: Boolean(d.es_recurrente),
          estado_suscripcion: d.estado_suscripcion || (d.es_recurrente ? 'activa' : 'activa'),
          stripe_subscription_id: d.stripe_subscription_id || null,
          created_at: d.created_at,
          tarjeta: d.tarjeta as TarjetaDonacion,
        })
      }
    }

    const apadrinamientos = Array.from(apadrinamientosMap.values())

    // 4. Calcular KPIs
    const apadrinamientosActivos = apadrinamientos.filter(a => a.estado_suscripcion !== 'cancelada')
    const especiesApadrinadas = apadrinamientosActivos.length
    const totalAportado = donacionesList.reduce((sum, d) => sum + (Number(d.monto) || 0), 0)

    let semanasActivo = 0
    if (donacionesList.length > 0) {
      const fechas = donacionesList.map(d => new Date(d.created_at).getTime())
      const primeraDonacion = Math.min(...fechas)
      const diffMs = Date.now() - primeraDonacion
      semanasActivo = Math.max(1, Math.floor(diffMs / (1000 * 60 * 60 * 24 * 7)))
    }

    // Vidas impactadas: conteo de especies apadrinadas * 1.5
    const vidasImpactadas = Math.ceil(especiesApadrinadas * 1.5)

    // 5. Impulsa el Vuelo (si apadrina especies con seccion = 'impulsa_vuelo')
    const tarjetasImpulsa = apadrinamientos
      .map(a => a.tarjeta)
      .filter((t): t is TarjetaDonacion => Boolean(t && (t as any).seccion === 'impulsa_vuelo'))

    const actualizacionesMap: Record<string, ActualizacionLiberacion[]> = {}

    if (tarjetasImpulsa.length > 0) {
      const tarjetaIds = tarjetasImpulsa.map(t => t.id)
      const { data: actData } = await adminSupabase
        .from('actualizaciones_liberacion')
        .select('*')
        .in('tarjeta_id', tarjetaIds)
        .order('fecha', { ascending: false })

      if (actData) {
        for (const act of actData) {
          if (!act.tarjeta_id) continue
          if (!actualizacionesMap[act.tarjeta_id]) {
            actualizacionesMap[act.tarjeta_id] = []
          }
          if (actualizacionesMap[act.tarjeta_id].length < 3) {
            actualizacionesMap[act.tarjeta_id].push(act)
          }
        }
      }
    }

    // 6. Noticias del Nido (Blog + Bitácoras de sus especies)
    const noticias: NoticiaItem[] = []

    // 6a. Entradas del blog
    const { data: blogPosts } = await adminSupabase
      .from('blog')
      .select('*')
      .eq('publicado', true)
      .order('created_at', { ascending: false })
      .limit(4)

    if (blogPosts) {
      for (const p of blogPosts) {
        noticias.push({
          id: `blog-${p.id}`,
          tipo: 'blog',
          titulo: p.titulo,
          descripcion: p.excerpt || p.contenido?.slice(0, 140) || '',
          imagen_url: p.imagen_url,
          fecha: p.created_at,
          link: `/blog/${p.slug}`,
        })
      }
    }

    // 6b. Bitácoras de sus especies
    for (const [tarjetaId, acts] of Object.entries(actualizacionesMap)) {
      const tarjeta = tarjetasImpulsa.find(t => t.id === tarjetaId)
      for (const act of acts) {
        noticias.push({
          id: `act-${act.id}`,
          tipo: 'bitacora',
          titulo: `Actualización: ${tarjeta?.nombre_animal || tarjeta?.nombre_especie || 'Especie'}`,
          descripcion: act.descripcion?.slice(0, 140) || act.titulo,
          imagen_url: act.imagen_url || tarjeta?.imagen_url || null,
          fecha: act.fecha || act.created_at,
          link: `/impulsa-el-vuelo/${tarjetaId}`,
          especie_nombre: tarjeta?.nombre_especie,
        })
      }
    }

    // Ordenar noticias por fecha descendente y limitar a 5
    noticias.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
    const topNoticias = noticias.slice(0, 5)

    // 7. Próximos Eventos
    const { data: eventosData } = await adminSupabase
      .from('tipos_producto')
      .select('*')
      .eq('categoria', 'evento')
      .eq('activo', true)
      .limit(3)

    const eventos: EventoItem[] = (eventosData || []).map(ev => {
      const meta = (ev.metadata || {}) as Record<string, any>
      return {
        id: ev.id,
        nombre: ev.nombre,
        descripcion: ev.descripcion,
        precio: Number(ev.precio) || 0,
        fecha: meta.fecha || null,
        lugar: meta.lugar || 'Santuario El Nido',
        imagen_url: meta.imagen_url || null,
      }
    })

    return {
      autenticado: true,
      esAnonimoConToken,
      usuario: {
        nombre: nombreUsuario,
        email,
        username,
      },
      kpis: {
        especiesApadrinadas,
        totalAportado,
        semanasActivo,
        vidasImpactadas,
      },
      apadrinamientos,
      impulsaVuelo: {
        tarjetas: tarjetasImpulsa,
        actualizaciones: actualizacionesMap,
      },
      noticias: topNoticias,
      eventos,
    }
  } catch (err) {
    console.error('Error in getGuardianData:', err)
    return null
  }
}

export async function gestionarSuscripcionGuardian(
  donacionId: string, 
  accion: 'pausar' | 'reanudar' | 'cancelar'
): Promise<{ success: boolean; error?: string }> {
  try {
    const adminSupabase = await createAdminSupabaseClient()

    // 1. Obtener la donación
    const { data: donacion, error: dErr } = await adminSupabase
      .from('donaciones')
      .select('*')
      .eq('id', donacionId)
      .single()

    if (dErr || !donacion) {
      return { success: false, error: 'No se encontró el registro de apadrinamiento' }
    }

    const nuevoEstado = accion === 'pausar' ? 'pausada' : accion === 'reanudar' ? 'activa' : 'cancelada'

    // 2. Si tiene subscription en Stripe, actualizarla si es necesario
    if (donacion.stripe_subscription_id) {
      try {
        const stripe = getStripe()
        if (accion === 'cancelar') {
          await stripe.subscriptions.cancel(donacion.stripe_subscription_id)
        } else if (accion === 'pausar') {
          await stripe.subscriptions.update(donacion.stripe_subscription_id, {
            pause_collection: { behavior: 'void' }
          })
        } else if (accion === 'reanudar') {
          await stripe.subscriptions.update(donacion.stripe_subscription_id, {
            pause_collection: '' as any
          })
        }
      } catch (stripeErr: any) {
        console.warn('Stripe subscription update warning:', stripeErr?.message)
      }
    }

    // 3. Actualizar en base de datos
    const { error: updErr } = await adminSupabase
      .from('donaciones')
      .update({
        estado_suscripcion: nuevoEstado
      })
      .eq('id', donacionId)

    if (updErr) {
      return { success: false, error: updErr.message }
    }

    revalidatePath('/guardian')
    return { success: true }
  } catch (err: any) {
    console.error('Error in gestionarSuscripcionGuardian:', err)
    return { success: false, error: err.message || 'Error al procesar la solicitud' }
  }
}
