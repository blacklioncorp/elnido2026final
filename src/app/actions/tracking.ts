'use server'

import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function incrementarVistasTarjetas() {
  try {
    const supabase = await createAdminSupabaseClient()
    
    const { data: tarjetas } = await supabase
      .from('tarjetas_donacion')
      .select('id, vistas')
      .eq('activa', true)

    if (tarjetas) {
      for (const tarjeta of tarjetas) {
        await supabase
          .from('tarjetas_donacion')
          .update({ vistas: (tarjeta.vistas || 0) + 1 })
          .eq('id', tarjeta.id)
      }
    }
    
    return { success: true }
  } catch (error) {
    console.error('Error incrementing vistas:', error)
    return { success: false }
  }
}
