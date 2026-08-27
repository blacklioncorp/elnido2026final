'use server'

import { processAndUploadImage } from '@/lib/image-utils'

export async function uploadPaqueteImagen(formData: FormData): Promise<{ url: string } | { error: string }> {
  const file = formData.get('file') as File | null
  if (!file) return { error: 'No se proporcionó archivo' }
  return processAndUploadImage(file, 'especies', 'paquetes')
}
