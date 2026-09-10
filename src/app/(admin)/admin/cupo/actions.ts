'use server'

import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { format, addDays, startOfDay } from 'date-fns'

export async function getCupoDiario(dias: 7 | 30 | 31 = 30) {
  const supabase = await createAdminSupabaseClient()
  const hoy = format(new Date(), 'yyyy-MM-dd')
  const hasta = format(addDays(new Date(), dias), 'yyyy-MM-dd')

  const { data } = await supabase
    .from('cupo_diario')
    .select('*')
    .gte('fecha', hoy)
    .lte('fecha', hasta)
    .order('fecha', { ascending: true })

  return data ?? []
}

export async function getCupoRangoCompleto() {
  const supabase = await createAdminSupabaseClient()
  const hace7 = format(addDays(new Date(), -7), 'yyyy-MM-dd')
  const hasta = format(addDays(new Date(), 30), 'yyyy-MM-dd')

  const { data } = await supabase
    .from('cupo_diario')
    .select('*')
    .gte('fecha', hace7)
    .lte('fecha', hasta)
    .order('fecha', { ascending: true })

  return data ?? []
}

const ajusteSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Fecha inválida'),
  cupo_maximo: z.coerce.number().int().min(1).max(10000),
})

export async function ajustarCupoFecha(input: { fecha: string; cupo_maximo: number }) {
  const parsed = ajusteSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase
    .from('cupo_diario')
    .upsert(
      { fecha: parsed.data.fecha, cupo_maximo: parsed.data.cupo_maximo, lugares_ocupados: 0 },
      { onConflict: 'fecha', ignoreDuplicates: false },
    )

  if (error) return { error: error.message }
  revalidatePath('/admin/cupo')
  return { success: true }
}

export async function ajustarCupoGlobal(cupo_maximo: number) {
  if (cupo_maximo < 1 || cupo_maximo > 10000) return { error: 'Cupo inválido' }

  const supabase = await createAdminSupabaseClient()
  const hoy = format(startOfDay(new Date()), 'yyyy-MM-dd')

  // Update all future dates that already exist
  const { error } = await supabase
    .from('cupo_diario')
    .update({ cupo_maximo })
    .gte('fecha', hoy)

  if (error) return { error: error.message }
  revalidatePath('/admin/cupo')
  return { success: true }
}
