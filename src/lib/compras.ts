import { addDays, format } from 'date-fns'
import type { createAdminSupabaseClient } from './supabase-server'
import type { Database } from './database.types'
import type { Compra } from './boletos'
import { getMetadata } from './boletos'

type Admin = Awaited<ReturnType<typeof createAdminSupabaseClient>>
type CompraUpdate = Database['public']['Tables']['compras']['Update']

/**
 * Marca una compra como completada a partir de su stripe_session_id.
 * Si el producto principal es una membresía, calcula fechas de vigencia,
 * saldo y descuento. Es idempotente: no recalcula si ya estaba completada.
 */
export async function completarCompraPorSesion(
  admin: Admin,
  sessionId: string,
): Promise<Compra | null> {
  const { data: compra } = await admin
    .from('compras')
    .select('*')
    .eq('stripe_session_id', sessionId)
    .maybeSingle()

  if (!compra) return null
  if (compra.estado === 'completado' || compra.estado === 'activado') {
    return compra
  }

  const update: CompraUpdate = { estado: 'completado' }

  if (compra.tipo_producto_id) {
    const { data: tipo } = await admin
      .from('tipos_producto')
      .select('*')
      .eq('id', compra.tipo_producto_id)
      .maybeSingle()

    if (tipo?.categoria === 'membresia') {
      const meta = getMetadata(tipo)
      const inicio = new Date()
      const fin = addDays(inicio, meta.validez_dias ?? 365)
      update.membresia_inicio = format(inicio, 'yyyy-MM-dd')
      update.membresia_fin = format(fin, 'yyyy-MM-dd')
      update.saldo_actual = meta.saldo ?? 0
      update.descuento_eventos = meta.descuento_eventos ?? 15
    }
  }

  const { data: actualizada } = await admin
    .from('compras')
    .update(update)
    .eq('id', compra.id)
    .select()
    .single()

  return actualizada ?? compra
}
