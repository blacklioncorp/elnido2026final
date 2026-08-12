'use client'

import { useState } from 'react'
import { Share2, Check } from 'lucide-react'

interface ShareButtonsProps {
  shareText: string
  shareUrl: string
}

export default function ShareButtons({ shareText, shareUrl }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="bg-[#F7F3E8] rounded-2xl p-5">
      <p className="text-xs font-bold uppercase tracking-wider text-forest-green-dark/50 mb-3 flex items-center gap-1.5">
        <Share2 className="h-3 w-3" />
        Comparte tu impacto
      </p>
      <div className="flex flex-col gap-2">
        <div className="flex gap-2">
          <a
            href={`https://wa.me/?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center bg-green-500 hover:bg-green-600 text-white font-semibold text-sm py-2.5 rounded-xl transition-colors"
          >
            WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-white font-semibold text-sm py-2.5 rounded-xl transition-colors hover:brightness-110"
            style={{ backgroundColor: '#1877F2' }}
          >
            Facebook
          </a>
        </div>
        <button
          onClick={handleCopy}
          className="w-full text-center bg-gradient-to-r from-[#833AB4] via-[#FD1D1D] to-[#F56040] hover:opacity-90 text-white font-semibold text-sm py-2.5 rounded-xl transition-opacity flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <Check className="h-4 w-4" />
              ¡Enlace copiado!
            </>
          ) : (
            'Copiar enlace para Instagram'
          )}
        </button>
      </div>
    </div>
  )
}
