'use server'

import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function unirseListaEspera(email: string): Promise<{ success?: boolean; ya_registrado?: boolean; error?: string }> {
  if (!email || !email.includes('@')) {
    return { error: 'Por favor ingresa un correo electrónico válido' }
  }

  try {
    const supabase = await createAdminSupabaseClient()
    const { error } = await supabase
      .from('lista_espera_membresias')
      .insert({ email: email.trim().toLowerCase() } as any)

    if (error?.code === '23505') {
      return { ya_registrado: true }
    }

    if (error) {
      console.error('Error insertando en lista_espera_membresias:', error)
      return { error: 'No se pudo guardar el registro en este momento. Inténtalo más tarde.' }
    }

    return { success: true }
  } catch (err: any) {
    console.error('Error in unirseListaEspera:', err)
    return { error: err.message || 'Error inesperado' }
  }
}
