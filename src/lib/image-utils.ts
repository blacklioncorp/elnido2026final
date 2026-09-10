import { createAdminSupabaseClient } from '@/lib/supabase-server'

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024 // 10 MB límite de entrada
const TARGET_MAX_BYTES = 150 * 1024 // 150 KB límite final optimizado
const MAX_DIMENSION = 800 // 800px ancho / alto máximo

export async function processAndUploadImage(
  file: File,
  bucket: string,
  prefix: string
): Promise<{ url: string } | { error: string }> {
  try {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new Error('El archivo excede el límite de 10 MB')
    }

    const extensionesPermitidas = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'avif']
    const extension = file.name.split('.').pop()?.toLowerCase()
    if (!extensionesPermitidas.includes(extension || '')) {
      throw new Error('Formato no soportado. Usa JPG, PNG, WebP o GIF')
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const supabase = await createAdminSupabaseClient()

    const sharpModule = await import('sharp')
    const sharp = sharpModule.default || sharpModule

    const fileName = `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}.webp`

    // 1. Redimensionar a máx 800px y comprimir a WebP (calidad inicial 78%)
    let quality = 78
    let outputBuffer = await sharp(buffer)
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ quality, effort: 5 })
      .toBuffer()

    // 2. Reducir calidad progresivamente si excede 150 KB
    while (outputBuffer.length > TARGET_MAX_BYTES && quality > 30) {
      quality -= 8
      outputBuffer = await sharp(buffer)
        .resize({
          width: MAX_DIMENSION,
          height: MAX_DIMENSION,
          fit: 'inside',
          withoutEnlargement: true
        })
        .webp({ quality, effort: 6 })
        .toBuffer()
    }

    // 3. Subir única versión optimizada a Supabase Storage con Cache-Control de 1 año
    const { error } = await supabase.storage
      .from(bucket)
      .upload(fileName, outputBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: false
      })

    if (error) {
      console.error('Error al subir imagen optimizada:', error.message)
      throw new Error('Error al subir la imagen a Supabase. Intenta de nuevo.')
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(fileName)
      
    return { url: publicUrl }
  } catch (err: unknown) {
    console.error('processAndUploadImage error:', err)
    return { error: err instanceof Error ? err.message : 'Error interno al procesar imagen' }
  }
}
