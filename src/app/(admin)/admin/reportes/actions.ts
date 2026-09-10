'use server'

import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { stringify } from 'csv-stringify/sync'

export interface FiltrosReporte {
  desde: string
  hasta: string
  cajaId: string
  categoria: string
  metodoPago: string
}

export async function getDatosReporte(filtros: FiltrosReporte) {
  const supabase = await createAdminSupabaseClient()
  
  // Base query para ventas POS
  let queryVentas = supabase
    .from('ventas_pos')
    .select('*, cajas(nombre), venta_detalles(producto_id, descripcion, cantidad, precio_unitario, subtotal, productos_pos(categoria))', { count: 'exact' })
    .gte('created_at', `${filtros.desde}T00:00:00Z`)
    .lte('created_at', `${filtros.hasta}T23:59:59Z`)
    
  if (filtros.cajaId === 'online') {
    queryVentas = queryVentas.eq('id', '00000000-0000-0000-0000-000000000000') // Forzar vacío
  } else if (filtros.cajaId !== 'todas') {
    queryVentas = queryVentas.eq('caja_id', filtros.cajaId)
  }
  if (filtros.metodoPago !== 'todos') {
    queryVentas = queryVentas.eq('metodo_pago', filtros.metodoPago)
  }
  
  const { data: ventasPosData } = await queryVentas.order('created_at', { ascending: false })
  
  // Transformar ventas POS a filas planas
  const filasReporte: any[] = []
  
  if (ventasPosData) {
    for (const venta of ventasPosData) {
      for (const det of (venta.venta_detalles as any[]) || []) {
        const cat = det.productos_pos?.categoria || 'sin_categoria'
        if (filtros.categoria !== 'todos' && cat !== filtros.categoria) continue;
        
        const subtotalPos = Number(det.subtotal ?? (det.cantidad * det.precio_unitario))
        filasReporte.push({
          id: `${venta.id}-${det.producto_id}`,
          fecha: new Date(venta.created_at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
          caja: venta.cajas?.nombre || 'Desconocida',
          producto: det.descripcion,
          categoria: cat,
          cantidad: det.cantidad,
          precio_unitario: Number(det.precio_unitario),
          subtotal: subtotalPos,
          descuento: 0,
          porcentaje_descuento: null,
          codigo_descuento: null,
          total: subtotalPos,
          metodo_pago: venta.metodo_pago,
          origen: 'POS'
        })
      }
    }
  }

  // Si no se está filtrando por una caja específica del POS, incluir las ventas en línea (boletera pública)
  // que no tienen caja_id.
  if (filtros.cajaId === 'todas' || filtros.cajaId === 'online') {
    let queryCompras = supabase
      .from('compras')
      .select('*, compra_items(*)')
      .in('estado', ['completado', 'activado'])
      .gte('created_at', `${filtros.desde}T00:00:00Z`)
      .lte('created_at', `${filtros.hasta}T23:59:59Z`)
      
    if (filtros.metodoPago !== 'todos' && filtros.metodoPago !== 'tarjeta') {
      // Asumimos que las compras online son con tarjeta
      queryCompras = queryCompras.eq('id', '00000000-0000-0000-0000-000000000000') // Forzar vacío
    }

    const { data: comprasData } = await queryCompras
    
    if (comprasData) {
      for (const compra of comprasData) {
        const meta = (compra.metadata || {}) as Record<string, any>
        const porcentajeDescuento = Number(meta.porcentaje_descuento || 0)
        const codigoDescuento = meta.codigo_descuento ? String(meta.codigo_descuento) : null

        const items = compra.compra_items || []
        const subtotalCompra = items.reduce(
          (s: number, i: any) => s + Number(i.precio_unitario || 0) * Number(i.cantidad || 0),
          0,
        )

        for (const item of items) {
          if (filtros.categoria !== 'todos' && item.categoria !== filtros.categoria) continue;
          
          const itemSubtotal = Number(item.cantidad) * Number(item.precio_unitario)
          let itemDescuento = 0
          let itemTotal = itemSubtotal

          if (porcentajeDescuento > 0) {
            itemDescuento = (itemSubtotal * porcentajeDescuento) / 100
            itemTotal = itemSubtotal - itemDescuento
          } else if (subtotalCompra > 0 && Number(compra.total) < subtotalCompra) {
            const factor = Number(compra.total) / subtotalCompra
            itemTotal = itemSubtotal * factor
            itemDescuento = itemSubtotal - itemTotal
          } else if (items.length === 1 && Number(compra.total) > 0) {
            itemTotal = Number(compra.total)
            itemDescuento = Math.max(0, itemSubtotal - itemTotal)
          }

          filasReporte.push({
            id: item.id,
            fecha: new Date(compra.created_at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
            caja: 'Boletera Online',
            producto: item.nombre,
            categoria: item.categoria,
            cantidad: item.cantidad,
            precio_unitario: Number(item.precio_unitario),
            subtotal: itemSubtotal,
            descuento: itemDescuento,
            porcentaje_descuento: porcentajeDescuento > 0 ? porcentajeDescuento : null,
            codigo_descuento: codigoDescuento,
            total: itemTotal,
            metodo_pago: 'tarjeta (stripe)',
            origen: 'Boletera'
          })
        }
      }
    }
  }

  // Si el filtro permite donaciones (o es 'todos'), incluir donaciones
  if (
    (filtros.cajaId === 'todas' || filtros.cajaId === 'online') &&
    filtros.metodoPago !== 'efectivo' &&
    filtros.metodoPago !== 'saldo_rfid' &&
    (filtros.categoria === 'todos' || filtros.categoria === 'donacion_generica' || filtros.categoria === 'donacion_especie')
  ) {
    const { data: donacionesData } = await supabase
      .from('donaciones')
      .select('*, tarjetas_donacion(nombre_especie)')
      .gte('created_at', `${filtros.desde}T00:00:00Z`)
      .lte('created_at', `${filtros.hasta}T23:59:59Z`)

    if (donacionesData) {
      for (const d of donacionesData) {
        const cat = d.origen === 'donativos' ? 'donacion_especie' : 'donacion_generica'
        if (filtros.categoria !== 'todos' && filtros.categoria !== cat) continue
        const especie = (d as { tarjetas_donacion?: { nombre_especie?: string } }).tarjetas_donacion?.nombre_especie
        const montoNum = Number(d.monto)
        filasReporte.push({
          id: d.id,
          fecha: new Date(d.created_at).toLocaleString('es-MX', { timeZone: 'America/Mexico_City' }),
          caja: 'Donativo Online',
          producto: especie ? `Donativo — ${especie}` : 'Donativo Genérico',
          categoria: cat,
          cantidad: 1,
          precio_unitario: montoNum,
          subtotal: montoNum,
          descuento: 0,
          porcentaje_descuento: null,
          codigo_descuento: null,
          total: montoNum,
          metodo_pago: 'tarjeta (stripe)',
          origen: d.origen,
        })
      }
    }
  }

  // Ordenar combinado por fecha
  filasReporte.sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())

  // --- KPIs ---
  // 1. Ventas del día (suma de todo hoy)
  const hoyStr = new Date().toISOString().slice(0, 10)
  const ventasHoy = filasReporte.filter(f => f.fecha.includes(new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })))
  const ventasDia = ventasHoy.reduce((acc, f) => acc + Number(f.total), 0)

  // 2. Miembros activos
  const { count: miembrosActivos } = await supabase
    .from('compras')
    .select('*', { count: 'exact', head: true })
    .gte('membresia_fin', hoyStr)
    .in('estado', ['completado', 'activado'])

  // 3. Saldo circulante
  const { data: saldos } = await supabase
    .from('compras')
    .select('saldo_actual')
    .gt('saldo_actual', 0)
    .in('estado', ['completado', 'activado'])
    
  const saldoCirculante = saldos?.reduce((acc, c) => acc + Number(c.saldo_actual), 0) || 0

  // 4. Productos más vendidos
  const productosCount: Record<string, number> = {}
  filasReporte.forEach(f => {
    productosCount[f.producto] = (productosCount[f.producto] || 0) + f.cantidad
  })
  const topProductos = Object.entries(productosCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(e => ({ nombre: e[0], cantidad: e[1] }))

  // 5. Total donaciones en el período
  const totalDonaciones = filasReporte
    .filter(f => f.categoria === 'donacion_generica' || f.categoria === 'donacion_especie')
    .reduce((acc, f) => acc + Number(f.total), 0)

  // --- BOLETERA KPIs ---
  // 6. Ventas de boletos hoy (cantidad)
  const boletosHoy = filasReporte
    .filter(f => f.categoria === 'entrada' && f.fecha.includes(new Date().toLocaleDateString('es-MX', { timeZone: 'America/Mexico_City' })))
    .reduce((acc, f) => acc + Number(f.cantidad), 0)

  // 7. Ingresos de boletera (total $ de categoría entrada)
  const ingresosBoletera = filasReporte
    .filter(f => f.categoria === 'entrada')
    .reduce((acc, f) => acc + Number(f.total), 0)

  // 8. Próximas visitas (personas esperadas desde hoy en adelante)
  const { data: comprasProximas } = await supabase
    .from('compras')
    .select('cantidad_personas')
    .in('estado', ['completado', 'activado'])
    .gte('fecha_visita', hoyStr)

  const proximasVisitas = comprasProximas?.reduce((acc, c) => acc + Number(c.cantidad_personas || 0), 0) || 0

  // --- SPECIES KPIs ---
  const { data: tarjetasData } = await supabase
    .from('tarjetas_donacion')
    .select('*')

  const { data: donacionesEspecies } = await supabase
    .from('donaciones')
    .select('tarjeta_id, donante_email, monto')
    .eq('origen', 'donativos')
    .gte('created_at', `${filtros.desde}T00:00:00Z`)
    .lte('created_at', `${filtros.hasta}T23:59:59Z`)

  const tarjetasMap = new Map()
  let totalVisitas = 0

  if (tarjetasData) {
    for (const t of tarjetasData) {
      tarjetasMap.set(t.id, {
        id: t.id,
        nombre: t.nombre_especie,
        meta: t.meta_monto || 0,
        recaudado_historico: t.monto_recaudado || 0,
        recaudado_periodo: 0,
        padrinos_periodo: 0,
        vistas: (t as any).vistas || 0
      })
      totalVisitas += ((t as any).vistas || 0)
    }
  }

  const uniqueDonors = new Set()
  let sumDonativosEspecies = 0

  if (donacionesEspecies) {
    for (const d of donacionesEspecies) {
      if (d.tarjeta_id && tarjetasMap.has(d.tarjeta_id)) {
        const t = tarjetasMap.get(d.tarjeta_id)
        t.recaudado_periodo += Number(d.monto)
        t.padrinos_periodo += 1
      }
      uniqueDonors.add(d.donante_email)
      sumDonativosEspecies += Number(d.monto)
    }
  }

  const rankingEspecies = Array.from(tarjetasMap.values()).sort((a, b) => b.recaudado_periodo - a.recaudado_periodo)
  const especieMasApadrinada = rankingEspecies.slice().sort((a, b) => b.padrinos_periodo - a.padrinos_periodo)[0]
  const especieMasRecaudada = rankingEspecies[0]

  const tasaConversionEspecies = totalVisitas > 0 ? ((uniqueDonors.size / totalVisitas) * 100).toFixed(1) : '0.0'
  const donativoPromedio = donacionesEspecies && donacionesEspecies.length > 0 ? (sumDonativosEspecies / donacionesEspecies.length).toFixed(2) : '0.00'

  const especiesKpis = {
    masApadrinada: especieMasApadrinada && especieMasApadrinada.padrinos_periodo > 0 ? { nombre: especieMasApadrinada.nombre, valor: especieMasApadrinada.padrinos_periodo } : null,
    masRecaudada: especieMasRecaudada && especieMasRecaudada.recaudado_periodo > 0 ? { nombre: especieMasRecaudada.nombre, valor: especieMasRecaudada.recaudado_periodo } : null,
    visitas: totalVisitas,
    tasaConversion: tasaConversionEspecies,
    promedio: donativoPromedio
  }

  return {
    filas: filasReporte,
    kpis: {
      ventasDia,
      miembrosActivos: miembrosActivos || 0,
      saldoCirculante,
      topProductos,
      totalDonaciones,
      boletosHoy,
      ingresosBoletera,
      proximasVisitas,
    },
    especiesKpis,
    rankingEspecies,
  }
}

export async function generarCSVReporte(filas: Record<string, unknown>[]) {
  const columnas = [
    { key: 'fecha', header: 'Fecha' },
    { key: 'caja', header: 'Caja / Origen' },
    { key: 'producto', header: 'Producto' },
    { key: 'categoria', header: 'Categoría' },
    { key: 'cantidad', header: 'Cantidad' },
    { key: 'precio_unitario', header: 'Precio Unitario' },
    { key: 'subtotal', header: 'Subtotal' },
    { key: 'descuento', header: 'Descuento' },
    { key: 'total', header: 'Total (Pagado)' },
    { key: 'codigo_descuento', header: 'Cupón Aplicado' },
    { key: 'metodo_pago', header: 'Método de Pago' },
    { key: 'origen', header: 'Origen' },
  ]

  const records = filas.map(f => {
    return columnas.map(col => f[col.key] ?? '')
  })

  const csv = stringify([columnas.map(c => c.header), ...records])
  return csv
}

export async function getCajasBasico() {
  const supabase = await createAdminSupabaseClient()
  const { data } = await supabase.from('cajas').select('id, nombre').order('nombre')
  return data ?? []
}

export async function getDonacionDetalle(donacionId: string) {
  const supabase = await createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('donaciones')
    .select('*, tarjetas_donacion(*)')
    .eq('id', donacionId)
    .single()

  if (error || !data) {
    console.error('Error fetching donacion:', error)
    return null
  }

  // Flatten the response slightly to make it easier for the modal
  return {
    ...data,
    imagen_url: data.tarjetas_donacion?.imagen_url,
    nombre_especie: data.tarjetas_donacion?.nombre_especie,
    nombre_animal: data.tarjetas_donacion?.nombre_animal,
    meta_tipo: data.tarjetas_donacion?.meta_tipo,
    meta_monto: data.tarjetas_donacion?.meta_monto || 0,
    monto_recaudado: data.tarjetas_donacion?.monto_recaudado || 0,
  }
}
