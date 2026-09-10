'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createAdminSupabaseClient, createServerSupabaseClient } from '@/lib/supabase-server'
import { processAndUploadImage } from '@/lib/image-utils'
import { sanitizeHtml } from '@/lib/utils'
import type { BitacoraEstado, BitacoraVisibilidad } from '@/lib/database.types'

const bitacoraSchema = z.object({
  fauna_id:    z.string().uuid().optional().nullable(),
  titulo:      z.string().min(3, 'El título es requerido'),
  contenido:   z.string().min(10, 'El contenido es requerido'),
  imagen_url:  z.string().url().optional().nullable().or(z.literal('')),
  video_url:   z.string().url().optional().nullable().or(z.literal('')),
  visibilidad: z.enum(['publico','padrinos','mixto']).default('publico'),
})

export type BitacoraInput = z.infer<typeof bitacoraSchema>
export type BitacoraResult = { success: true; id?: string } | { error: string }

// ─── Queries ─────────────────────────────────────────────────

/** Para la página pública: solo publicadas */
export async function getEntradasPublicas() {
  const supabase = await createAdminSupabaseClient()
  const { data } = await supabase
    .from('bitacora')
    .select('*, fauna:fauna(nombre, slug, imagen_url)')
    .eq('estado', 'publicado')
    .in('visibilidad', ['publico', 'mixto'])
    .order('created_at', { ascending: false })
  return data ?? []
}

/** Para admin: filtros completos */
export async function getEntradasBitacora(filtros: {
  estado?: BitacoraEstado
  visibilidad?: BitacoraVisibilidad
  autor_id?: string
  fauna_id?: string
} = {}) {
  const supabase = await createAdminSupabaseClient()
  let query = supabase
    .from('bitacora')
    .select('*, fauna:fauna(nombre, slug)')
    .order('created_at', { ascending: false })

  if (filtros.estado)      query = query.eq('estado', filtros.estado)
  if (filtros.visibilidad) query = query.eq('visibilidad', filtros.visibilidad)
  if (filtros.autor_id)    query = query.eq('autor_id', filtros.autor_id)
  if (filtros.fauna_id)    query = query.eq('fauna_id', filtros.fauna_id)

  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getEntradasByFauna(faunaId: string) {
  const supabase = await createAdminSupabaseClient()
  const { data } = await supabase
    .from('bitacora')
    .select('*')
    .eq('fauna_id', faunaId)
    .eq('estado', 'publicado')
    .order('created_at', { ascending: false })
  return data ?? []
}

// ─── Mutations ────────────────────────────────────────────────

/** Cuidador crea entrada: va a estado 'revision' */
export async function crearEntradaBitacora(
  input: BitacoraInput,
  autorId: string,
): Promise<BitacoraResult> {
  const parsed = bitacoraSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const supabase = await createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('bitacora')
    .insert({
      fauna_id:    parsed.data.fauna_id ?? null,
      autor_id:    autorId,
      titulo:      parsed.data.titulo,
      contenido:   sanitizeHtml(parsed.data.contenido),
      imagen_url:  parsed.data.imagen_url || null,
      video_url:   parsed.data.video_url || null,
      visibilidad: parsed.data.visibilidad as BitacoraVisibilidad,
      estado:      'revision' as BitacoraEstado,
    })
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/bitacora')
  return { success: true, id: data.id }
}

/** Editor aprueba una entrada */
export async function aprobarEntradaBitacora(id: string, revisorId: string): Promise<BitacoraResult> {
  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase
    .from('bitacora')
    .update({
      estado:      'publicado' as BitacoraEstado,
      revisor_id:  revisorId,
      updated_at:  new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/bitacora')
  revalidatePath('/diario-de-campo')
  return { success: true }
}

/** Editor rechaza una entrada con comentario */
export async function rechazarEntradaBitacora(
  id: string,
  revisorId: string,
  comentario: string,
): Promise<BitacoraResult> {
  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase
    .from('bitacora')
    .update({
      estado:              'rechazado' as BitacoraEstado,
      revisor_id:          revisorId,
      comentario_revision: comentario,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/bitacora')
  return { success: true }
}

/** Cuidador reenvía a revisión desde rechazado */
export async function reenviarARevision(id: string): Promise<BitacoraResult> {
  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase
    .from('bitacora')
    .update({
      estado:              'revision' as BitacoraEstado,
      comentario_revision: null,
      updated_at:          new Date().toISOString(),
    })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/bitacora')
  return { success: true }
}

/** Upload imagen bitácora al bucket 'bitacora' */
export async function uploadBitacoraImagen(formData: FormData): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File | null
  if (!file) return { error: 'No se proporcionó archivo' }
  return processAndUploadImage(file, 'bitacora', 'bitacora')
}
