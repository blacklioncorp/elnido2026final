'use server'

import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function validarCajaAcceso(cajaId: string, nip: string) {
  const supabase = await createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('cajas')
    .select('id')
    .eq('id', cajaId)
    .eq('nip', nip)
    .eq('activa', true)
    .single()
    
  if (error || !data) return false
  return true
}

export async function getCajasActivas() {
  const supabase = await createAdminSupabaseClient()
  const { data } = await supabase.from('cajas').select('*').eq('activa', true)
  return data ?? []
}

export async function getProductosPOS() {
  const supabase = await createAdminSupabaseClient()
  const { data } = await supabase.from('productos_pos').select('*').eq('activo', true)
  return data ?? []
}

export async function buscarCliente(query: string) {
  const supabase = await createAdminSupabaseClient()
  // Buscar por email (simulando que también podría buscar por RFID UID)
  const { data: cliente } = await supabase
    .from('clientes')
    .select('*')
    .eq('email', query)
    .single()

  if (!cliente) return null

  // Verificar membresía activa en compras
  const hoy = new Date().toISOString().slice(0, 10)
  const { data: compra } = await supabase
    .from('compras')
    .select('saldo_actual, estado, membresia_fin, tipos_producto(nombre, categoria)')
    .eq('cliente_id', cliente.id)
    .in('estado', ['completado', 'activado'])
    .gte('membresia_fin', hoy)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  let membresiaActiva = false
  let membresiaTipo = undefined
  let saldo = 0

  if (compra) {
    membresiaActiva = true
    membresiaTipo = (compra.tipos_producto as any)?.nombre
    saldo = Number(compra.saldo_actual || 0)
  } else {
    // Buscar saldo en compras que no son membresía pero tienen saldo
    const { data: compraConSaldo } = await supabase
      .from('compras')
      .select('saldo_actual')
      .eq('cliente_id', cliente.id)
      .gt('saldo_actual', 0)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()
      
    if (compraConSaldo) {
      saldo = Number(compraConSaldo.saldo_actual || 0)
    }
  }

  return {
    id: cliente.id,
    nombre: cliente.nombre,
    email: cliente.email,
    saldo,
    membresiaActiva,
    membresiaTipo
  }
}

export async function procesarVenta(venta: any, detalles: any[]) {
  const supabase = await createAdminSupabaseClient()
  
  // 1. Insertar venta
  const { data: ventaDB, error: errorVenta } = await supabase
    .from('ventas_pos')
    .insert(venta)
    .select('id')
    .single()

  if (errorVenta || !ventaDB) {
    console.error('Error al insertar venta:', errorVenta)
    throw new Error('Error al procesar la venta')
  }

  // 2. Insertar detalles
  const insertDetalles = detalles.map(d => ({
    venta_id: ventaDB.id,
    producto_id: d.productoId,
    descripcion: d.nombre,
    cantidad: d.cantidad,
    precio_unitario: d.precio
  }))

  const { error: errorDetalles } = await supabase
    .from('venta_detalles')
    .insert(insertDetalles)

  if (errorDetalles) {
    console.error('Error al insertar detalles:', errorDetalles)
    throw new Error('Error al guardar los detalles de la venta')
  }

  // 3. Si pagó con RFID, descontar saldo de la última compra con saldo
  if (venta.metodo_pago === 'saldo_rfid' && venta.cliente_id) {
    const { data: comprasConSaldo } = await supabase
      .from('compras')
      .select('id, saldo_actual')
      .eq('cliente_id', venta.cliente_id)
      .gt('saldo_actual', 0)
      .order('created_at', { ascending: false })

    let restoADescontar = Number(venta.total)
    
    if (comprasConSaldo) {
      for (const c of comprasConSaldo) {
        if (restoADescontar <= 0) break;
        const saldoDisponible = Number(c.saldo_actual)
        const aDescontar = Math.min(saldoDisponible, restoADescontar)
        
        await supabase
          .from('compras')
          .update({ saldo_actual: saldoDisponible - aDescontar })
          .eq('id', c.id)

        restoADescontar -= aDescontar
      }
    }
  }

  return { exito: true, ventaId: ventaDB.id }
}
