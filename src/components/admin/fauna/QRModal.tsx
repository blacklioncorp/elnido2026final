'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { X, Download, Printer, Copy, CheckCircle, QrCode, ExternalLink, BarChart3, Sparkles } from 'lucide-react'

interface QRModalProps {
  especie: {
    id: string
    nombre: string
    slug: string
    imagen_url?: string | null
  }
  escaneosCount?: number
  onClose: () => void
}

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://elnido.mx'

export default function QRModal({ especie, escaneosCount = 0, onClose }: QRModalProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [copied, setCopied] = useState(false)
  const [qrDataUrl, setQrDataUrl] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(true)

  const url = `${SITE_URL}/fauna/${especie.slug}?origen=qr`

  const generateQR = useCallback(async (canvas: HTMLCanvasElement, size: number) => {
    const QRCode = (await import('qrcode')).default
    await QRCode.toCanvas(canvas, url, {
      width: size,
      margin: 2,
      color: { dark: '#0B2B26', light: '#FFFFFF' },
      errorCorrectionLevel: 'H',
    })
    return canvas.toDataURL('image/png')
  }, [url])

  useEffect(() => {
    let isMounted = true
    const init = async () => {
      setIsGenerating(true)
      try {
        if (canvasRef.current) {
          const dataUrl = await generateQR(canvasRef.current, 320)
          if (isMounted) setQrDataUrl(dataUrl)
        }
      } catch (err) {
        console.error('Error generating QR:', err)
      } finally {
        if (isMounted) setIsGenerating(false)
      }
    }
    init()
    return () => { isMounted = false }
  }, [generateQR])

  const handleDownload = async () => {
    try {
      const offscreen = document.createElement('canvas')
      const dataUrl = await generateQR(offscreen, 600)
      const link = document.createElement('a')
      link.download = `qr-${especie.slug}.png`
      link.href = dataUrl
      link.click()
    } catch (err) {
      console.error('Download error:', err)
    }
  }

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = async () => {
    try {
      const offscreen = document.createElement('canvas')
      await generateQR(offscreen, 800)
      const highResDataUrl = offscreen.toDataURL('image/png')

      const win = window.open('', '_blank', 'width=800,height=900')
      if (!win) return
      win.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Cartel Recinto — ${especie.nombre}</title>
          <meta charset="utf-8" />
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            @page { size: letter portrait; margin: 0; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
              background: #F4F1EA;
              width: 100vw;
              min-height: 100vh;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              padding: 2.5cm;
              color: #0B2B26;
            }
            .poster {
              background: #FFFFFF;
              border: 3px solid #0B2B26;
              border-radius: 28px;
              padding: 48px 40px;
              display: flex;
              flex-direction: column;
              align-items: center;
              text-align: center;
              gap: 22px;
              width: 100%;
              max-width: 520px;
              box-shadow: 0 10px 30px rgba(0,0,0,0.06);
            }
            .logo-title {
              font-size: 32px;
              font-weight: 900;
              letter-spacing: -0.5px;
              color: #0B2B26;
            }
            .logo-sub {
              font-size: 13px;
              text-transform: uppercase;
              letter-spacing: 3px;
              color: #2E86AB;
              font-weight: 700;
              margin-top: 2px;
            }
            .divider {
              width: 100%;
              height: 2px;
              background: #E8D5A3;
              border-radius: 2px;
            }
            .species-name {
              font-size: 28px;
              font-weight: 900;
              color: #0B2B26;
              letter-spacing: -0.5px;
            }
            .qr-frame {
              padding: 18px;
              border: 2.5px solid #0B2B26;
              border-radius: 24px;
              background: #FFFFFF;
              box-shadow: 0 4px 16px rgba(0,0,0,0.04);
            }
            .qr-frame img {
              width: 250px;
              height: 250px;
              display: block;
            }
            .main-cta {
              font-size: 17px;
              font-weight: 700;
              color: #0B2B26;
              line-height: 1.4;
              max-width: 400px;
            }
            .sub-cta {
              font-size: 14px;
              color: #4A7C59;
              font-weight: 600;
            }
            .price-pill {
              display: inline-block;
              background: #C9A84C;
              color: #0B2B26;
              font-size: 14px;
              font-weight: 800;
              padding: 8px 22px;
              border-radius: 999px;
              letter-spacing: 0.5px;
            }
            .footer-url {
              font-size: 10px;
              color: #718096;
              margin-top: 4px;
            }
          </style>
        </head>
        <body>
          <div class="poster">
            <div>
              <div class="logo-title">🪺 EL NIDO</div>
              <div class="logo-sub">Santuario de Aves</div>
            </div>
            
            <div class="divider"></div>

            <div class="species-name">${especie.nombre}</div>

            <div class="qr-frame">
              <img src="${highResDataUrl}" alt="QR ${especie.nombre}" />
            </div>

            <div class="main-cta">
              Escanea para conocer su historia y convertirte en su Guardián
            </div>

            <div class="price-pill">🐾 Apadrina desde $50/mes</div>

            <div class="footer-url">${url}</div>
          </div>

          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
        </html>
      `)
      win.document.close()
    } catch (err) {
      console.error('Print error:', err)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-forest-green-dark border border-white/10 rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-conservation-gold/20 text-conservation-gold">
              <QrCode className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-off-white">
                Código QR — {especie.nombre}
              </h2>
              <p className="text-xs text-off-white/50">Recinto y Donación In-Situ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-off-white/40 hover:text-off-white hover:bg-white/10 rounded-xl transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* QR Container */}
        <div className="bg-white rounded-2xl p-5 flex items-center justify-center mb-4 shadow-inner">
          <canvas
            ref={canvasRef}
            className={`rounded-lg max-w-full ${isGenerating ? 'opacity-0' : 'opacity-100'} transition-opacity`}
            style={{ width: 220, height: 220 }}
          />
        </div>

        {/* URL Box */}
        <div className="bg-forest-green-light/40 border border-white/10 rounded-xl p-3 mb-5 flex items-center justify-between gap-2">
          <div className="truncate text-xs font-mono text-off-white/70 flex-1">
            <span className="text-off-white/40">{SITE_URL}</span>/fauna/{especie.slug}?origen=qr
          </div>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir enlace"
            className="p-1.5 text-off-white/50 hover:text-off-white hover:bg-white/10 rounded-lg transition-colors flex-shrink-0"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-5">
          <button
            onClick={handleCopy}
            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-off-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            {copied ? <CheckCircle className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-off-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Download className="h-4 w-4" />
            <span>Descargar</span>
          </button>

          <button
            onClick={handlePrint}
            className="py-2.5 px-3 rounded-xl bg-conservation-gold text-forest-green-dark hover:bg-conservation-gold/90 text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-md"
          >
            <Printer className="h-4 w-4" />
            <span>Imprimir</span>
          </button>
        </div>

        {/* Info & Stats Footer */}
        <div className="space-y-2.5 pt-2 border-t border-white/10">
          <div className="p-3 rounded-xl bg-conservation-gold/10 border border-conservation-gold/20 flex items-start gap-2.5 text-xs text-off-white/80">
            <Sparkles className="h-4 w-4 text-conservation-gold shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              💡 Escanea este QR para ver la ficha de esta especie y apadrinarla directamente en el recinto.
            </p>
          </div>

          <div className="p-3 rounded-xl bg-quetzal-blue/10 border border-quetzal-blue/20 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-off-white/80 font-medium">
              <BarChart3 className="h-4 w-4 text-quetzal-blue shrink-0" />
              <span>Escaneos registrados:</span>
            </div>
            <span className="font-extrabold text-quetzal-blue text-sm px-2 py-0.5 rounded-md bg-quetzal-blue/20">
              {escaneosCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
