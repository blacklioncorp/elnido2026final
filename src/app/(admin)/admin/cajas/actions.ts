'use server'

import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'

export async function getTodasLasCajas() {
  const supabase = await createAdminSupabaseClient()
  const { data } = await supabase.from('cajas').select('*').order('created_at', { ascending: false })
  return data ?? []
}

export async function guardarCaja(caja: any) {
  const supabase = await createAdminSupabaseClient()
  if (caja.id) {
    const { error } = await supabase.from('cajas').update(caja).eq('id', caja.id)
    if (error) throw new Error(error.message)
  } else {
    const { error } = await supabase.from('cajas').insert(caja)
    if (error) throw new Error(error.message)
  }
  revalidatePath('/admin/cajas')
}

export async function cambiarEstadoCaja(id: string, activa: boolean) {
  const supabase = await createAdminSupabaseClient()
  await supabase.from('cajas').update({ activa }).eq('id', id)
  revalidatePath('/admin/cajas')
}

export async function regenerarNipCaja(id: string) {
  const supabase = await createAdminSupabaseClient()
  const nuevoNip = Math.floor(1000 + Math.random() * 9000).toString()
  await supabase.from('cajas').update({ nip: nuevoNip }).eq('id', id)
  revalidatePath('/admin/cajas')
  return nuevoNip
}
