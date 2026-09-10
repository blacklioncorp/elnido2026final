'use server'

import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getProductos() {
  const supabase = await createAdminSupabaseClient()
  const { data } = await supabase.from('productos_pos').select('*').order('created_at', { ascending: false })
  return data ?? []
}

export async function getCategoriasUnicas() {
  const supabase = await createAdminSupabaseClient()
  // No hay un select distinct directo, así que traemos todo y extraemos
  const { data } = await supabase.from('productos_pos').select('categoria')
  if (!data) return []
  return Array.from(new Set(data.map(d => d.categoria)))
}

export async function guardarProducto(producto: any) {
  try {
    const supabase = await createAdminSupabaseClient()
    
    if (producto.id) {
      const { error } = await supabase.from('productos_pos').update(producto).eq('id', producto.id)
      if (error) { throw new Error('DB Update: ' + error.message) }
    } else {
      // Remover undefined keys para evitar errores de postgrest
      const { id, ...prodInsert } = producto;
      const { error } = await supabase.from('productos_pos').insert(prodInsert)
      if (error) { throw new Error('DB Insert: ' + error.message) }
    }
    
    revalidatePath('/admin/caja/productos')
  } catch (err: any) {
    throw new Error(err.message || 'Error desconocido en el servidor');
  }
}

export async function eliminarProducto(id: string) {
  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase.from('productos_pos').delete().eq('id', id)
  if (error) { console.error('Error delete:', error); throw new Error(error.message) }
  revalidatePath('/admin/caja/productos')
}
