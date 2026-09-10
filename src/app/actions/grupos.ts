'use server'

import { z } from 'zod'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { revalidatePath } from 'next/cache'
import { processAndUploadImage } from '@/lib/image-utils'
import { NivelEducativo } from '@/types/grupos'

const paqueteSchema = z.object({
  nombre: z.string().min(2, 'El nombre debe tener al menos 2 caracteres'),
  slug: z.string().optional(),
  nivel: z.enum(['preescolar', 'primaria', 'secundaria', 'preparatoria', 'licenciatura']),
  duracion_horas: z.coerce.number().min(1, 'La duración mínima es de 1 hora'),
  precio_por_persona: z.coerce.number().min(0, 'El precio no puede ser negativo'),
  max_personas: z.coerce.number().min(1, 'El cupo mínimo es de 1 persona').default(60),
  descripcion_corta: z.string().min(5, 'La descripción corta es requerida'),
  descripcion_larga: z.string().optional().default(''),
  objetivos: z.string().optional().default(''),
  actividades: z.array(z.object({
    nombre: z.string(),
    duracion: z.string().optional()
  })).default([]),
  itinerario: z.array(z.object({
    actividad: z.string(),
    duracion: z.string().optional()
  })).nullable().default([]),
  instalaciones: z.string().optional().nullable(),
  alineacion_sep: z.string().optional().nullable(),
  imagen_url: z.string().optional().nullable(),
  activo: z.boolean().default(true),
})

export type PaqueteInput = z.infer<typeof paqueteSchema>
export type PaqueteResult = { success: true; id?: string } | { error: string }

function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9 -]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

export async function uploadPaqueteImagen(formData: FormData): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File | null
  if (!file) return { error: 'No se proporcionó archivo' }
  return processAndUploadImage(file, 'especies', 'paquetes')
}

export async function createPaquete(input: PaqueteInput): Promise<PaqueteResult> {
  const parsed = paqueteSchema.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const data = parsed.data
  const slug = data.slug?.trim() ? slugify(data.slug) : slugify(data.nombre)

  try {
    const supabase = await createAdminSupabaseClient()

    // Verificar si el slug ya existe
    const { data: existing } = await supabase
      .from('paquetes_educativos')
      .select('id')
      .eq('slug', slug)
      .maybeSingle()

    const finalSlug = existing ? `${slug}-${Date.now().toString().slice(-4)}` : slug

    const { data: inserted, error } = await supabase
      .from('paquetes_educativos')
      .insert({
        nombre: data.nombre,
        slug: finalSlug,
        nivel: data.nivel,
        duracion_horas: data.duracion_horas,
        precio_por_persona: data.precio_por_persona,
        max_personas: data.max_personas,
        descripcion_corta: data.descripcion_corta,
        descripcion_larga: data.descripcion_larga,
        objetivos: data.objetivos,
        actividades: data.actividades,
        itinerario: data.itinerario,
        instalaciones: data.instalaciones || null,
        alineacion_sep: data.alineacion_sep || null,
        imagen_url: data.imagen_url || null,
        activo: data.activo,
      })
      .select('id')
      .single()

    if (error) {
      console.error('Error insertando paquete:', error)
      return { error: error.message }
    }

    revalidatePath('/admin/grupos')
    revalidatePath('/grupos')
    return { success: true, id: inserted.id }
  } catch (err: any) {
    console.error('Error in createPaquete:', err)
    return { error: err.message || 'Error inesperado al crear paquete' }
  }
}

export async function updatePaquete(id: string, input: Partial<PaqueteInput>): Promise<PaqueteResult> {
  try {
    const supabase = await createAdminSupabaseClient()

    const updatePayload: any = {
      ...input,
      updated_at: new Date().toISOString()
    }

    if (input.nombre && !input.slug) {
      // no sobreescribir slug salvo que venga explícito
    } else if (input.slug) {
      updatePayload.slug = slugify(input.slug)
    }

    const { error } = await supabase
      .from('paquetes_educativos')
      .update(updatePayload)
      .eq('id', id)

    if (error) {
      console.error('Error actualizando paquete:', error)
      return { error: error.message }
    }

    revalidatePath('/admin/grupos')
    revalidatePath('/grupos')
    return { success: true }
  } catch (err: any) {
    console.error('Error in updatePaquete:', err)
    return { error: err.message || 'Error inesperado al actualizar paquete' }
  }
}

export async function togglePaqueteActivo(id: string, activo: boolean): Promise<PaqueteResult> {
  try {
    const supabase = await createAdminSupabaseClient()
    const { error } = await supabase
      .from('paquetes_educativos')
      .update({ activo, updated_at: new Date().toISOString() })
      .eq('id', id)

    if (error) return { error: error.message }

    revalidatePath('/admin/grupos')
    revalidatePath('/grupos')
    return { success: true }
  } catch (err: any) {
    return { error: err.message || 'Error al cambiar estado' }
  }
}

export async function deletePaquete(id: string): Promise<PaqueteResult> {
  try {
    const supabase = await createAdminSupabaseClient()

    // Comprobar si hay cotizaciones vinculadas
    const { data: cotizaciones, error: countErr } = await supabase
      .from('cotizaciones')
      .select('id')
      .eq('paquete_id', id)
      .limit(1)

    if (cotizaciones && cotizaciones.length > 0) {
      return { 
        error: 'No se puede eliminar este paquete porque tiene cotizaciones asociadas en el sistema. Puedes desactivarlo para que no esté disponible al público.' 
      }
    }

    const { error } = await supabase
      .from('paquetes_educativos')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === '23503') {
        return { error: 'No se puede eliminar el paquete porque tiene registros vinculados. Puedes desactivarlo.' }
      }
      return { error: error.message }
    }

    revalidatePath('/admin/grupos')
    revalidatePath('/grupos')
    return { success: true }
  } catch (err: any) {
    console.error('Error in deletePaquete:', err)
    return { error: err.message || 'Error inesperado al eliminar paquete' }
  }
}
