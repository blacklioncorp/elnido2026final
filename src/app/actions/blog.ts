'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { blogPosts } from '@/lib/blog' // fallback estático
import { processAndUploadImage } from '@/lib/image-utils'
import { sanitizeHtml } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

// ─── Helpers ─────────────────────────────────────────────────
function generateSlug(titulo: string): string {
  return titulo
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

// ─── Schema ───────────────────────────────────────────────────
const blogSchema = z.object({
  titulo:     z.string().min(3, 'El título es requerido'),
  slug:       z.string().optional(),
  contenido:  z.string().min(10, 'El contenido es requerido'),
  excerpt:    z.string().optional().nullable(),
  imagen_url: z.string().url().optional().nullable().or(z.literal('')),
  publicado:  z.boolean().optional().default(false),
})

export type BlogInput = z.infer<typeof blogSchema>
export type BlogResult = { success: true; id?: string; slug?: string } | { error: string }

// ─── Queries ─────────────────────────────────────────────────

/** Posts publicados para la página pública */
export async function getPostsPublicados() {
  try {
    const supabase = await createAdminSupabaseClient()
    const { data, error } = await supabase
      .from('blog')
      .select('*')
      .eq('publicado', true)
      .order('created_at', { ascending: false })

    if (error || !data?.length) return [] // fallback manejado en la página
    return data
  } catch {
    return []
  }
}

/** Todos los posts para admin */
export async function getPosts() {
  const supabase = await createAdminSupabaseClient()
  const { data, error } = await supabase
    .from('blog')
    .select('*')
    .order('created_at', { ascending: false })
  if (error) throw new Error(error.message)
  return data ?? []
}

/** Post por slug (Supabase) */
export async function getPostBySlug(slug: string) {
  const supabase = await createAdminSupabaseClient()
  const { data } = await supabase
    .from('blog').select('*').eq('slug', slug).eq('publicado', true).single()
  return data ?? null
}

// ─── Mutations ────────────────────────────────────────────────

export async function createPost(input: BlogInput, autorId?: string): Promise<BlogResult> {
  const parsed = blogSchema.safeParse(input)
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }

  const supabase = await createAdminSupabaseClient()
  const slug = parsed.data.slug || generateSlug(parsed.data.titulo)

  const { data, error } = await supabase
    .from('blog')
    .insert({
      titulo:     parsed.data.titulo,
      slug,
      contenido:  sanitizeHtml(parsed.data.contenido),
      excerpt:    parsed.data.excerpt ? sanitizeHtml(parsed.data.excerpt) : null,
      imagen_url: parsed.data.imagen_url || null,
      publicado:  parsed.data.publicado ?? false,
      autor_id:   autorId ?? null,
    })
    .select('id, slug')
    .single()

  if (error) return { error: error.message }
  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { success: true, id: data.id, slug: data.slug }
}

export async function updatePost(id: string, input: Partial<BlogInput>): Promise<BlogResult> {
  const supabase = await createAdminSupabaseClient()
  const updateData: Database['public']['Tables']['blog']['Update'] = { updated_at: new Date().toISOString() }

  if ('titulo' in input)     { updateData.titulo = input.titulo; if (!input.slug) updateData.slug = generateSlug(input.titulo!) }
  if ('slug' in input)       updateData.slug = input.slug
  if ('contenido' in input)  updateData.contenido = input.contenido ? sanitizeHtml(input.contenido) : input.contenido
  if ('excerpt' in input)    updateData.excerpt = input.excerpt ? sanitizeHtml(input.excerpt) : null
  if ('imagen_url' in input) updateData.imagen_url = input.imagen_url || null
  if ('publicado' in input)  updateData.publicado = input.publicado

  const { error } = await supabase.from('blog').update(updateData).eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { success: true }
}

export async function toggleBlogPublicado(id: string, publicado: boolean): Promise<BlogResult> {
  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase
    .from('blog')
    .update({ publicado, updated_at: new Date().toISOString() })
    .eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { success: true }
}

export async function deletePost(id: string): Promise<BlogResult> {
  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase.from('blog').delete().eq('id', id)
  if (error) return { error: error.message }
  revalidatePath('/admin/blog')
  revalidatePath('/blog')
  return { success: true }
}

export async function uploadBlogImagen(formData: FormData): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File | null
  if (!file) return { error: 'No se proporcionó archivo' }
  return processAndUploadImage(file, 'especies', 'blog')
}
