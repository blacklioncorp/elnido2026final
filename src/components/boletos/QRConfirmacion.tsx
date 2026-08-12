'use client'

import Image from 'next/image'
import { Download } from 'lucide-react'

export default function QRConfirmacion({
  qrDataUrl,
  instruccion,
}: {
  qrDataUrl: string
  instruccion: string
}) {
  const descargar = () => {
    const a = document.createElement('a')
    a.href = qrDataUrl
    a.download = 'boleto-elnido.png'
    document.body.appendChild(a)
    a.click()
    a.remove()
  }

  return (
    <div className="flex flex-col items-center gap-5">
      <div className="rounded-2xl bg-white p-4 shadow-lg">
        <Image
          src={qrDataUrl}
          alt="Código QR de tu boleto"
          width={240}
          height={240}
          unoptimized
        />
      </div>
      <p className="max-w-sm text-center text-sm text-off-white/80">
        {instruccion}
      </p>
      <button
        type="button"
        onClick={descargar}
        className="flex items-center gap-2 rounded-full bg-conservation-gold px-6 py-3 font-semibold text-forest-green-dark transition-transform hover:scale-105"
      >
        <Download className="h-5 w-5" /> Descargar QR
      </button>
    </div>
  )
}
