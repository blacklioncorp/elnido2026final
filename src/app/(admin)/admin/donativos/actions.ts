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
  seccion: z.enum(['amigos', 'impulsa_vuelo']).optional().default('amigos'),
  latitud_origen: z.coerce.number().min(-90, 'Debe ser entre -90 y 90').max(90, 'Debe ser entre -90 y 90').optional().nullable(),
  longitud_origen: z.coerce.number().min(-180, 'Debe ser entre -180 y 180').max(180, 'Debe ser entre -180 y 180').optional().nullable(),
  latitud_destino: z.coerce.number().min(-90, 'Debe ser entre -90 y 90').max(90, 'Debe ser entre -90 y 90').optional().nullable(),
  longitud_destino: z.coerce.number().min(-180, 'Debe ser entre -180 y 180').max(180, 'Debe ser entre -180 y 180').optional().nullable(),
  latitud_actual: z.coerce.number().min(-90, 'Debe ser entre -90 y 90').max(90, 'Debe ser entre -90 y 90').optional().nullable(),
  longitud_actual: z.coerce.number().min(-180, 'Debe ser entre -180 y 180').max(180, 'Debe ser entre -180 y 180').optional().nullable(),
  area_protegida: z.string().optional().nullable(),
  liberada: z.boolean().optional().default(false),
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
    latitud_origen: parsed.data.latitud_origen ?? null,
    longitud_origen: parsed.data.longitud_origen ?? null,
    latitud_destino: parsed.data.latitud_destino ?? null,
    longitud_destino: parsed.data.longitud_destino ?? null,
    latitud_actual: parsed.data.latitud_actual ?? null,
    longitud_actual: parsed.data.longitud_actual ?? null,
    area_protegida: parsed.data.area_protegida ?? null,
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

const actualizacionSchema = z.object({
  tarjeta_id: z.string().uuid('ID de tarjeta inválido'),
  titulo: z.string().min(3, 'El título es requerido'),
  descripcion: z.string().min(10, 'La descripción es requerida'),
  fecha: z.string(),
  imagen_url: z.string().url('URL inválida').optional().nullable(),
})

export type ActualizacionInput = z.infer<typeof actualizacionSchema>

export async function createActualizacion(input: ActualizacionInput) {
  const parsed = actualizacionSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message }

  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase.from('actualizaciones_liberacion').insert(parsed.data)
  if (error) return { error: error.message }
  revalidatePath('/admin/donativos')
  revalidatePath(`/impulsa-el-vuelo/${input.tarjeta_id}`)
  return { success: true }
}

export async function deleteActualizacion(id: string) {
  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase.from('actualizaciones_liberacion').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/donativos')
  return { success: true }
}


