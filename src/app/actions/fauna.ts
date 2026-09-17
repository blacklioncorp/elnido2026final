'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { processAndUploadImage } from '@/lib/image-utils'
import type { FaunaTipo, Database } from '@/lib/database.types'

// ─── Helpers ─────────────────────────────────────────────────
function generateSlug(nombre: string): string {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
}

// ─── Schema ───────────────────────────────────────────────────
const faunaSchema = z.object({
  nombre:               z.string().min(2, 'El nombre es requerido'),
  nombre_cientifico:    z.string().optional().nullable(),
  slug:                 z.string().optional(),
  tipo:                 z.enum(['ave','mamifero','reptil','felino','primate','otro']),
  descripcion:          z.string().optional().nullable(),
  historia:             z.string().optional().nullable(),
  imagen_url:           z.string().url().optional().nullable().or(z.literal('')),
  galeria:              z.array(z.string()).optional().default([]),
  activo:               z.boolean().optional().default(true),
  tarjeta_donacion_id:  z.string().uuid().optional().nullable(),
})

export type FaunaInput = z.infer<typeof faunaSchema>
export type FaunaResult = { success: true; id?: string } | { error: string }

// ─── Queries ─────────────────────────────────────────────────

export async function getFauna(soloActivas = false) {
  const supabase = await createAdminSupabaseClient()
  let query = supabase.from('fauna').select('*').order('nombre', { ascending: true })
  if (soloActivas) query = query.eq('activo', true)
  const { data, error } = await query
  if (error) throw new Error(error.message)
  return data ?? []
}

export async function getFaunaBySlug(slug: string) {
  const supabase = await createAdminSupabaseClient()
  const { data } = await supabase
    .from('fauna')
    .select('*, tarjeta_donacion:tarjetas_donacion(*)')
    .eq('slug', slug)
    .eq('activo', true)
    .single()
  return data ?? null
}

/** Lista todas las tarjetas de donación activas (para el selector admin) */
export async function getTarjetasDonacionActivas() {
  const supabase = await createAdminSupabaseClient()
  const { data } = await supabase
    .from('tarjetas_donacion')
    .select('id, nombre_especie, nombre_animal, seccion')
    .eq('activa', true)
    .order('nombre_especie', { ascending: true })
  return data ?? []
}

/** Registra un escaneo de código QR físico de forma no bloqueante */
export async function registrarEscaneoQR(
  especieId: string,
  slug: string,
  userAgent?: string | null,
  referer?: string | null
) {
  try {
    const supabase = await createAdminSupabaseClient()
    await supabase.from('escaneos_qr').insert({
      especie_id: especieId,
      especie_slug: slug,
      user_agent: userAgent ?? null,
      referer: referer ?? null,
    } as any)
  } catch (err) {
    console.error('Error registrando escaneo QR:', err)
  }
}

/** Obtiene métricas y estadísticas agregadas de escaneos QR */
export async function getEstadisticasQR() {
  try {
    const supabase = await createAdminSupabaseClient()
    const now = new Date()
    const inicioMes = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()

    const { data: todos, error } = await supabase
      .from('escaneos_qr')
      .select('id, especie_id, especie_slug, created_at')

    if (error || !todos) {
      return {
        totalMes: 0,
        totalGlobal: 0,
        conteoPorEspecie: {} as Record<string, number>,
        conteoPorSlug: {} as Record<string, number>,
        especieMasEscaneada: null as { slug: string; total: number } | null,
      }
    }

    const totalGlobal = todos.length
    const totalMes = todos.filter((e: any) => e.created_at >= inicioMes).length

    const conteoPorEspecie: Record<string, number> = {}
    const conteoPorSlug: Record<string, number> = {}

    for (const esc of todos as any[]) {
      if (esc.especie_id) {
        conteoPorEspecie[esc.especie_id] = (conteoPorEspecie[esc.especie_id] || 0) + 1
      }
      if (esc.especie_slug) {
        conteoPorSlug[esc.especie_slug] = (conteoPorSlug[esc.especie_slug] || 0) + 1
      }
    }

    let maxSlug = null
    let maxCount = 0
    for (const [slug, count] of Object.entries(conteoPorSlug)) {
      if (count > maxCount) {
        maxCount = count
        maxSlug = slug
      }
    }

    return {
      totalMes,
      totalGlobal,
      conteoPorEspecie,
      conteoPorSlug,
      especieMasEscaneada: maxSlug ? { slug: maxSlug, total: maxCount } : null,
    }
  } catch {
    return {
      totalMes: 0,
      totalGlobal: 0,
      conteoPorEspecie: {} as Record<string, number>,
      conteoPorSlug: {} as Record<string, number>,
      especieMasEscaneada: null,
    }
  }
}

// ─── Mutations ────────────────────────────────────────────────

export async function createFauna(input: FaunaInput): Promise<FaunaResult> {
  const parsed = faunaSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const supabase = await createAdminSupabaseClient()
  const slug = parsed.data.slug || generateSlug(parsed.data.nombre)

  const { data, error } = await supabase
    .from('fauna')
    .insert({
      nombre:               parsed.data.nombre,
      nombre_cientifico:    parsed.data.nombre_cientifico ?? null,
      slug,
      tipo:                 parsed.data.tipo as FaunaTipo,
      descripcion:          parsed.data.descripcion ?? null,
      historia:             parsed.data.historia ?? null,
      imagen_url:           (parsed.data.imagen_url || null),
      galeria:              (parsed.data.galeria ?? []) as unknown as string[],
      activo:               parsed.data.activo ?? true,
      tarjeta_donacion_id:  parsed.data.tarjeta_donacion_id ?? null,
    } as any)
    .select('id')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/fauna')
  revalidatePath('/fauna')
  return { success: true, id: data.id }
}

export async function updateFauna(id: string, input: Partial<FaunaInput>): Promise<FaunaResult> {
  const supabase = await createAdminSupabaseClient()
  const updateData: Database['public']['Tables']['fauna']['Update'] = { updated_at: new Date().toISOString() }

  if (input.nombre) {
    updateData.nombre = input.nombre
    if (!input.slug) updateData.slug = generateSlug(input.nombre)
  }
  if (input.slug)              updateData.slug = input.slug
  if ('nombre_cientifico' in input) updateData.nombre_cientifico = input.nombre_cientifico ?? null
  if ('tipo' in input)         updateData.tipo = input.tipo
  if ('descripcion' in input)  updateData.descripcion = input.descripcion ?? null
  if ('historia' in input)     updateData.historia = input.historia ?? null
  if ('imagen_url' in input)   updateData.imagen_url = input.imagen_url || null
  if ('galeria' in input)             updateData.galeria = input.galeria ?? []
  if ('activo' in input)              updateData.activo = input.activo
  if ('tarjeta_donacion_id' in input) (updateData as any).tarjeta_donacion_id = input.tarjeta_donacion_id ?? null

  const { error } = await supabase.from('fauna').update(updateData as any).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/fauna')
  revalidatePath('/fauna')
  return { success: true }
}

export async function toggleFaunaActivo(id: string, activo: boolean): Promise<FaunaResult> {
  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase
    .from('fauna')
    .update({ activo, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/fauna')
  revalidatePath('/fauna')
  return { success: true }
}

export async function deleteFauna(id: string): Promise<FaunaResult> {
  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase.from('fauna').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/fauna')
  revalidatePath('/fauna')
  return { success: true }
}

export async function uploadFaunaImagen(formData: FormData): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File | null
  if (!file) return { error: 'No se proporcionó archivo' }
  return processAndUploadImage(file, 'especies', 'fauna')
}
