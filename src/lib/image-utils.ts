import sharp from 'sharp'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function processAndUploadImage(
  file: File,
  bucket: string,
  prefix: string
): Promise<{ url: string } | { error: string }> {
  try {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('El archivo excede el límite de 10 MB')
    }

    const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'webp', 'gif']
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extensionesPermitidas.includes(extension || '')) {
      throw new Error('Formato no soportado. Usa JPG, PNG, WebP o GIF')
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const supabase = await createAdminSupabaseClient()

    const baseFileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`

    // Generar 3 versiones
    const versions = [
      { suffix: '-original.webp', pipeline: sharp(buffer).webp({ quality: 95 }) },
      { suffix: '-large.webp', pipeline: sharp(buffer).resize({ width: 1200, withoutEnlargement: true }).webp({ quality: 85 }) },
      { suffix: '-card.webp', pipeline: sharp(buffer).resize({ width: 600, withoutEnlargement: true }).webp({ quality: 80 }) }
    ]

    for (const v of versions) {
      const outputBuffer = await v.pipeline.toBuffer()
      const { error } = await supabase.storage
        .from(bucket)
        .upload(`${baseFileName}${v.suffix}`, outputBuffer, {
          contentType: 'image/webp',
          upsert: false
        })
      if (error) {
        console.error(`Error al subir ${v.suffix}:`, error.message)
        throw new Error(`Error al subir la imagen a Supabase. Intenta de nuevo.`)
      }
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(`${baseFileName}-original.webp`)
      
    return { url: publicUrl }
  } catch (err: unknown) {
    console.error('processAndUploadImage error:', err)
    return { error: err instanceof Error ? err.message : 'Error interno al procesar imagen' }
  }
}
