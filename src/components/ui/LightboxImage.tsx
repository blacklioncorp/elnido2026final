'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface LightboxImageProps {
  src: string
  alt: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  sizes?: string
  priority?: boolean
  // Opcional: Para navegación en galería
  gallery?: string[]
  currentGalleryIndex?: number
  onNavigate?: (newIndex: number) => void
}

import { getOptimizedUrl } from '@/lib/utils'
export default function LightboxImage({
  src,
  alt,
  className = '',
  fill,
  width,
  height,
  sizes,
  priority = false,
  gallery,
  currentGalleryIndex = -1,
  onNavigate
}: LightboxImageProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  // URLs deducidas
  const cardUrl = getOptimizedUrl(src, 'card')
  const largeUrl = getOptimizedUrl(src, 'large')

  // Manejar teclado para lightbox
  useEffect(() => {
    if (!isOpen) return
    
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
      if (e.key === 'ArrowLeft' && onNavigate && currentGalleryIndex > 0) {
        onNavigate(currentGalleryIndex - 1)
      }
      if (e.key === 'ArrowRight' && onNavigate && gallery && currentGalleryIndex < gallery.length - 1) {
        onNavigate(currentGalleryIndex + 1)
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    document.body.style.overflow = 'hidden' // Evitar scroll
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onNavigate, currentGalleryIndex, gallery])

  // Determinar si podemos navegar
  const canGoLeft = !!onNavigate && currentGalleryIndex > 0
  const canGoRight = !!onNavigate && !!gallery && currentGalleryIndex < gallery.length - 1

  return (
    <>
      <Image
        src={cardUrl}
        alt={alt}
        className={`cursor-pointer transition-transform hover:scale-105 duration-300 ${className}`}
        fill={fill}
        width={width}
        height={height}
        sizes={sizes}
        priority={priority}
        onClick={(e) => {
          e.stopPropagation()
          setIsOpen(true)
        }}
      />

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4 sm:p-8">
          <button
            onClick={() => setIsOpen(false)}
            className="absolute top-4 right-4 p-2 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors z-[101]"
            aria-label="Cerrar lightbox"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="relative w-full max-w-5xl h-full max-h-screen flex items-center justify-center">
            <Image
              src={largeUrl}
              alt={alt}
              fill
              className="object-contain"
              sizes="100vw"
              priority
            />
            
            {canGoLeft && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate(currentGalleryIndex - 1)
                }}
                className="absolute left-4 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors"
                aria-label="Imagen anterior"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            
            {canGoRight && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate(currentGalleryIndex + 1)
                }}
                className="absolute right-4 p-3 text-white/70 hover:text-white bg-black/50 hover:bg-black/80 rounded-full transition-colors"
                aria-label="Siguiente imagen"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  )
}
