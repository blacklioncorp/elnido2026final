/**
 * Comprime imágenes en el navegador antes de enviarlas al servidor.
 * Esto evita el error HTTP 413 (Payload Too Large) en Vercel (límite de 4.5 MB en Serverless Functions)
 * y acelera la subida hasta 40 veces.
 */
export async function compressImageClient(
  file: File,
  maxDimension = 1200,
  quality = 0.82
): Promise<File> {
  // Preservar SVGs y GIFs animados sin procesar por canvas
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file
  }

  // Si el archivo ya es muy pequeño (< 200 KB) y no es gigante, no requiere compresión agresiva
  if (file.size < 200 * 1024) {
    return file
  }

  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      return resolve(file)
    }

    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        let { width, height } = img

        // Redimensionar manteniendo proporción
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width)
            width = maxDimension
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height)
            height = maxDimension
          }
        }

        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          return resolve(file)
        }

        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              return resolve(file)
            }
            const baseName = file.name.replace(/\.[^/.]+$/, '')
            const compressedFile = new File([blob], `${baseName}.webp`, {
              type: 'image/webp',
              lastModified: Date.now(),
            })
            resolve(compressedFile)
          },
          'image/webp',
          quality
        )
      }

      img.onerror = () => resolve(file)
      img.src = e.target?.result as string
    }

    reader.onerror = () => resolve(file)
    reader.readAsDataURL(file)
  })
}
