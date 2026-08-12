'use server'

import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { processAndUploadImage } from '@/lib/image-utils'

const tarjetaSchema = z.object({
  nombre_especie: z.string().min(2, 'El nombre de la especie es requerido'),
  nombre_animal: z.string().max(100).optional().nullable(),
  tipo: z.enum(['especie', 'animal_individual', 'familia']),
  descripcion: z.string().min(10, 'La descripción debe tener al menos 10 caracteres'),
  historia: z.string().optional().nullable(),
  imagen_url: z.string().url('URL de imagen inválida').optional().nullable(),
  meta_tipo: z.enum(['unica', 'mensual', 'anual']),
  meta_monto: z.coerce.number().positive('El monto de meta debe ser positivo'),
  activa: z.boolean().optional().default(false),
})

export type TarjetaInput = z.infer<typeof tarjetaSchema>
export type TarjetaResult = { success: true, id?: string } | { error: string }

export async function getTarjetasDonacion() {
  const supabase = await createAdminSupabaseClient()
  const { data } = await supabase
    .from('tarjetas_donacion')
    .select('*')
    .order('created_at', { ascending: false })
  return data ?? []
}

export async function createTarjetaDonacion(input: TarjetaInput): Promise<TarjetaResult> {
  const parsed = tarjetaSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const supabase = await createAdminSupabaseClient()
  const { data, error } = await supabase.from('tarjetas_donacion').insert({
    ...parsed.data,
    nombre_animal: parsed.data.nombre_animal ?? null,
    historia: parsed.data.historia ?? null,
    imagen_url: parsed.data.imagen_url ?? null,
  }).select('id').single()

  if (error) return { error: error.message }
  revalidatePath('/admin/donativos')
  revalidatePath('/donativos')
  return { success: true, id: data.id }
}

export async function updateTarjetaDonacion(
  id: string,
  input: Partial<TarjetaInput>,
): Promise<TarjetaResult> {
  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase
    .from('tarjetas_donacion')
    .update({ ...input, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/donativos')
  revalidatePath('/donativos')
  return { success: true }
}

export async function toggleTarjetaActiva(
  id: string,
  activa: boolean,
): Promise<TarjetaResult> {
  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase
    .from('tarjetas_donacion')
    .update({ activa, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { error: error.message }
  revalidatePath('/admin/donativos')
  revalidatePath('/donativos')
  return { success: true }
}

export async function deleteTarjetaDonacion(id: string): Promise<TarjetaResult> {
  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase.from('tarjetas_donacion').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/donativos')
  revalidatePath('/donativos')
  return { success: true }
}

export async function uploadEspecieImagen(formData: FormData): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File | null
  if (!file) return { error: 'No se proporcionó archivo' }
  return processAndUploadImage(file, 'especies', 'especie')
}

export async function reiniciarMetasProgramadas(): Promise<TarjetaResult> {
  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase.rpc('reiniciar_metas_programadas')
  if (error) return { error: error.message }
  revalidatePath('/admin/donativos')
  revalidatePath('/donativos')
  return { success: true }
}

export async function getSuscripcionesActivas() {
  const supabase = await createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('donaciones')
    .select('*, tarjeta:tarjetas_donacion(nombre_especie, nombre_animal)')
    .eq('es_recurrente', true)
    .order('created_at', { ascending: false })
    
  if (error) {
    console.error('Error fetching subscriptions:', error)
    return []
  }
  return data ?? []
}

