'use server'

import { createAdminSupabaseClient } from '@/lib/supabase-server'

export interface DashboardMetric {
  especiesRegistradas: number
  guardianesActivos: number
  apadrinamientos: number
  recaudadoTotal: number
}

export interface ActividadItem {
  id: string
  user: string
  action: string
  time: string
  amount: string
  tipo: 'boleto' | 'donativo' | 'pos'
}

export async function getDashboardData(): Promise<{
  metrics: DashboardMetric
  recentActivity: ActividadItem[]
}> {
  const supabase = await createAdminSupabaseClient()

  // 1. Especies registradas
  const { count: countFauna } = await supabase
    .from('fauna')
    .select('*', { count: 'exact', head: true })
    .eq('activo', true)

  const { count: countTarjetas } = await supabase
    .from('tarjetas_donacion')
    .select('*', { count: 'exact', head: true })
    .eq('activa', true)

  const especiesRegistradas = (countFauna && countFauna > 0) ? countFauna : (countTarjetas || 0)

  // 2. Guardianes activos (donantes con suscripción activa o recurrentes)
  const { data: donacionesRecurrentes } = await supabase
    .from('donaciones')
    .select('donante_email, estado_suscripcion, es_recurrente')

  let guardianesActivos = 0
  if (donacionesRecurrentes && donacionesRecurrentes.length > 0) {
    const activeEmails = new Set(
      donacionesRecurrentes
        .filter(d => (d.es_recurrente && d.estado_suscripcion !== 'cancelada') || d.estado_suscripcion === 'activa')
        .map(d => d.donante_email)
    )
    guardianesActivos = activeEmails.size
    // Si no hay suscripciones activas registradas, contar donantes únicos totales
    if (guardianesActivos === 0) {
      guardianesActivos = new Set(donacionesRecurrentes.map(d => d.donante_email)).size
    }
  }

  // 3. Apadrinamientos totales (donaciones por especie)
  const { count: apadrinamientosCount } = await supabase
    .from('donaciones')
    .select('*', { count: 'exact', head: true })
    .not('tarjeta_id', 'is', null)

  const { count: donacionesTotalCount } = await supabase
    .from('donaciones')
    .select('*', { count: 'exact', head: true })

  const apadrinamientos = (apadrinamientosCount && apadrinamientosCount > 0)
    ? apadrinamientosCount
    : (donacionesTotalCount || 0)

  // 4. Recaudado total consolidado (compras + donaciones + ventas POS)
  const { data: comprasData } = await supabase
    .from('compras')
    .select('total')
    .in('estado', ['completado', 'activado'])

  const totalCompras = (comprasData || []).reduce((acc, c) => acc + Number(c.total || 0), 0)

  const { data: donacionesData } = await supabase
    .from('donaciones')
    .select('monto')

  const totalDonaciones = (donacionesData || []).reduce((acc, d) => acc + Number(d.monto || 0), 0)

  const { data: ventasPosData } = await supabase
    .from('ventas_pos')
    .select('total')

  const totalPos = (ventasPosData || []).reduce((acc, v) => acc + Number(v.total || 0), 0)

  const recaudadoTotal = totalCompras + totalDonaciones + totalPos

  // 5. Actividad Reciente (hasta 50 registros combinados para paginación)
  const { data: ultimasCompras } = await supabase
    .from('compras')
    .select('id, total, created_at, clientes(nombre, email), compra_items(nombre, cantidad)')
    .in('estado', ['completado', 'activado'])
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: ultimasDonaciones } = await supabase
    .from('donaciones')
    .select('id, donante_nombre, donante_email, monto, origen, created_at, tarjetas_donacion(nombre_especie, nombre_animal)')
    .order('created_at', { ascending: false })
    .limit(50)

  const { data: ultimasVentasPos } = await supabase
    .from('ventas_pos')
    .select('id, total, created_at, metodo_pago, venta_detalles(descripcion, cantidad)')
    .order('created_at', { ascending: false })
    .limit(50)

  const actividadCombinada: Array<{
    id: string
    user: string
    action: string
    date: Date
    amount: number
    tipo: 'boleto' | 'donativo' | 'pos'
  }> = []

  if (ultimasCompras) {
    for (const c of ultimasCompras) {
      const clienteNombre = (c.clientes as any)?.nombre || 'Visitante General'
      const items = (c.compra_items as any[]) || []
      const primerItem = items[0]
      const extraItems = items.length > 1 ? ` +${items.length - 1}` : ''
      const actionText = primerItem
        ? `Compró ${primerItem.cantidad}x ${primerItem.nombre}${extraItems}`
        : 'Compra de boletos online'

      actividadCombinada.push({
        id: `compra-${c.id}`,
        user: clienteNombre,
        action: actionText,
        date: new Date(c.created_at),
        amount: Number(c.total || 0),
        tipo: 'boleto',
      })
    }
  }

  if (ultimasDonaciones) {
    for (const d of ultimasDonaciones) {
      const donanteNombre = d.donante_nombre || d.donante_email || 'Padrino Anónimo'
      const especieNombre = (d.tarjetas_donacion as any)?.nombre_especie
      const actionText = especieNombre
        ? `Apadrinó a ${especieNombre}`
        : d.origen === 'donar'
        ? 'Donación General para el Santuario'
        : 'Donación para conservación'

      actividadCombinada.push({
        id: `donacion-${d.id}`,
        user: donanteNombre,
        action: actionText,
        date: new Date(d.created_at),
        amount: Number(d.monto || 0),
        tipo: 'donativo',
      })
    }
  }

  if (ultimasVentasPos) {
    for (const v of ultimasVentasPos) {
      const detalles = (v.venta_detalles as any[]) || []
      const primerDet = detalles[0]
      const extraDets = detalles.length > 1 ? ` +${detalles.length - 1}` : ''
      const actionText = primerDet
        ? `Venta POS: ${primerDet.cantidad}x ${primerDet.descripcion}${extraDets}`
        : `Venta POS (${v.metodo_pago})`

      actividadCombinada.push({
        id: `pos-${v.id}`,
        user: 'Cliente en Taquilla/Tienda',
        action: actionText,
        date: new Date(v.created_at),
        amount: Number(v.total || 0),
        tipo: 'pos',
      })
    }
  }

  // Ordenar cronológicamente descendente
  actividadCombinada.sort((a, b) => b.date.getTime() - a.date.getTime())

  const formatTiempoRelativo = (date: Date): string => {
    const diffMs = Date.now() - date.getTime()
    const diffMin = Math.floor(diffMs / (1000 * 60))
    const diffHoras = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMin < 1) return 'Hace un momento'
    if (diffMin < 60) return `Hace ${diffMin} min`
    if (diffHoras < 24) return `Hace ${diffHoras} ${diffHoras === 1 ? 'hora' : 'horas'}`
    if (diffDias === 1) return 'Ayer'
    if (diffDias < 7) return `Hace ${diffDias} días`

    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
    })
  }

  const recentActivity: ActividadItem[] = actividadCombinada.map(item => ({
    id: item.id,
    user: item.user,
    action: item.action,
    time: formatTiempoRelativo(item.date),
    amount: `+$${item.amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    tipo: item.tipo,
  }))

  return {
    metrics: {
      especiesRegistradas,
      guardianesActivos,
      apadrinamientos,
      recaudadoTotal,
    },
    recentActivity,
  }
}
