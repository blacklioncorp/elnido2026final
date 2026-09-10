'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Camera, X, CheckCircle, XCircle, QrCode } from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error'

interface ToastState {
  visible: boolean
  type: ToastType
  title: string
  message: string
}

interface ResultadoQR {
  valido: boolean
  mensaje?: string
  datos?: {
    nombre: string
    email: string
    tipo_producto: string
    categoria: string
    fecha_visita: string | null
    cantidad_personas: number
  }
}

interface EscanerQRProps {
  onResultado?: (resultado: ResultadoQR) => void
  className?: string
}

// ─── Beep util ────────────────────────────────────────────────────────────────
function playBeep(success: boolean) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.value = success ? 880 : 330
    osc.type = 'sine'
    gain.gain.setValueAtTime(0.4, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.5)
  } catch (_) {}
}

// ─── Toast Component ──────────────────────────────────────────────────────────
function QRToast({ toast }: { toast: ToastState }) {
  if (!toast.visible) return null
  return createPortal(
    <div
      className={`fixed top-6 left-1/2 -translate-x-1/2 z-[9999] flex items-start gap-3 px-5 py-4 rounded-2xl shadow-2xl min-w-72 max-w-sm ${
        toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
      }`}
      role="alert"
      aria-live="assertive"
    >
      {toast.type === 'success' ? (
        <CheckCircle className="h-6 w-6 shrink-0 mt-0.5" />
      ) : (
        <XCircle className="h-6 w-6 shrink-0 mt-0.5" />
      )}
      <div className="min-w-0">
        <p className="font-bold text-sm leading-tight">{toast.title}</p>
        {toast.message && (
          <p className="text-xs opacity-90 mt-0.5 leading-snug">{toast.message}</p>
        )}
      </div>
    </div>,
    document.body
  )
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EscanerQR({ onResultado, className }: EscanerQRProps) {
  const [modalAbierto, setModalAbierto] = useState(false)
  const [validando, setValidando] = useState(false)
  const [scannerListo, setScannerListo] = useState(false)
  const [errorCamara, setErrorCamara] = useState<string | null>(null)
  const [toast, setToast] = useState<ToastState>({ visible: false, type: 'success', title: '', message: '' })

  const scannerRef = useRef<any>(null)
  const contenedorId = 'qr-scanner-visor'
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const procesandoRef = useRef(false)

  const mostrarToast = useCallback((type: ToastType, title: string, message = '') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToast({ visible: true, type, title, message })
    toastTimerRef.current = setTimeout(() => {
      setToast(t => ({ ...t, visible: false }))
    }, 4000)
  }, [])

  const detenerScanner = useCallback(async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop()
        scannerRef.current.clear()
      } catch (_) {}
      scannerRef.current = null
    }
    procesandoRef.current = false
    setScannerListo(false)
    setValidando(false)
    setErrorCamara(null)
  }, [])

  const cerrarModal = useCallback(async () => {
    await detenerScanner()
    setModalAbierto(false)
  }, [detenerScanner])

  const validarQR = useCallback(async (codigo: string) => {
    if (procesandoRef.current) return
    procesandoRef.current = true
    setValidando(true)

    try { await scannerRef.current?.pause(true) } catch (_) {}

    try {
      const res = await fetch('/api/qr/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code: codigo.trim() })
      })
      const data: ResultadoQR = await res.json()

      if (data.valido && data.datos) {
        playBeep(true)
        mostrarToast(
          'success',
          `✅ Acceso válido — ${data.datos.nombre}`,
          `${data.datos.tipo_producto} · ${data.datos.cantidad_personas} persona(s)${
            data.datos.fecha_visita ? ` · ${data.datos.fecha_visita}` : ''
          }`
        )
        onResultado?.(data)
        setTimeout(() => cerrarModal(), 1500)
      } else {
        playBeep(false)
        const msg = data.mensaje || 'Error desconocido'
        mostrarToast(
          'error',
          msg.includes('utilizado') ? '❌ Este QR ya fue utilizado' : '❌ QR no encontrado',
          msg
        )
        setTimeout(async () => {
          try { await scannerRef.current?.resume() } catch (_) {}
          procesandoRef.current = false
          setValidando(false)
        }, 2500)
        return
      }
    } catch (err: any) {
      playBeep(false)
      mostrarToast('error', '❌ Error de conexión', err.message || 'No se pudo conectar al servidor')
      setTimeout(async () => {
        try { await scannerRef.current?.resume() } catch (_) {}
        procesandoRef.current = false
        setValidando(false)
      }, 2500)
      return
    }

    procesandoRef.current = false
    setValidando(false)
  }, [mostrarToast, onResultado, cerrarModal])

  const iniciarScanner = useCallback(async () => {
    if (scannerRef.current) return
    setScannerListo(false)
    setErrorCamara(null)

    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      const scanner = new Html5Qrcode(contenedorId, { verbose: false })
      scannerRef.current = scanner

      const cameras = await Html5Qrcode.getCameras()
      if (!cameras || cameras.length === 0) {
        setErrorCamara('No se encontró ninguna cámara en este dispositivo.')
        return
      }

      // Prefer rear/environment camera on tablets
      const camId =
        cameras.find(c => /environment|back|rear/i.test(c.label))?.id ??
        cameras[cameras.length - 1].id

      await scanner.start(
        { deviceId: { exact: camId } },
        { fps: 15, qrbox: { width: 240, height: 240 }, aspectRatio: 1.0, disableFlip: false },
        (decodedText) => { validarQR(decodedText) },
        (_) => {}
      )
      setScannerListo(true)
    } catch (err: any) {
      const msg: string = err?.message || String(err)
      if (/permission|denied|notallowed/i.test(msg)) {
        setErrorCamara('Permiso de cámara denegado. Actívalo en los ajustes del navegador y recarga la página.')
      } else if (/notfound|overconstrained/i.test(msg)) {
        setErrorCamara('Cámara no encontrada o no compatible con este navegador.')
      } else {
        setErrorCamara(`Error al iniciar la cámara: ${msg}`)
      }
    }
  }, [validarQR])

  useEffect(() => {
    if (modalAbierto) {
      const t = setTimeout(() => iniciarScanner(), 200)
      return () => clearTimeout(t)
    }
  }, [modalAbierto, iniciarScanner])

  useEffect(() => {
    return () => {
      detenerScanner()
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    }
  }, [detenerScanner])

  return (
    <>
      {/* Trigger Button */}
      <button
        id="btn-escanear-qr"
        type="button"
        onClick={() => setModalAbierto(true)}
        className={
          className ??
          'flex items-center gap-2 bg-quetzal-blue/10 hover:bg-quetzal-blue/20 border border-quetzal-blue/30 text-quetzal-blue px-4 py-2.5 rounded-xl font-semibold text-sm transition-all hover:shadow-md active:scale-95'
        }
        aria-label="Abrir escáner de cámara para QR"
      >
        <Camera className="h-5 w-5" />
        Escanear QR
      </button>

      {/* Toast */}
      <QRToast toast={toast} />

      {/* Scanner Modal */}
      {modalAbierto &&
        createPortal(
          <div
            className="fixed inset-0 z-[9990] flex flex-col bg-black"
            role="dialog"
            aria-modal="true"
            aria-label="Escáner de código QR"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-safe-top py-4 shrink-0">
              <div className="flex items-center gap-2 text-white">
                <QrCode className="h-5 w-5" style={{ color: '#D4A373' }} />
                <span className="font-bold tracking-wide">Validar Boleto</span>
              </div>
              <button
                id="btn-cerrar-scanner"
                onClick={cerrarModal}
                className="flex items-center gap-1.5 text-white/70 hover:text-white border border-white/20 hover:border-white/50 px-3 py-1.5 rounded-lg text-sm transition-colors"
                aria-label="Cerrar escáner"
              >
                <X className="h-4 w-4" /> Cancelar
              </button>
            </div>

            <p className="text-center text-white/50 text-sm px-6 shrink-0 pb-2">
              Apunta la cámara al código QR del boleto
            </p>

            {/* Viewport */}
            <div className="flex-1 flex items-center justify-center relative px-4 pb-4">
              <div
                id={contenedorId}
                className="w-full max-w-sm rounded-2xl overflow-hidden relative"
                style={{ minHeight: 300 }}
              />

              {/* Gold corner frame + scan line */}
              {scannerListo && !validando && (
                <div
                  aria-hidden="true"
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                >
                  <div className="relative w-60 h-60">
                    {[
                      'top-0 left-0 border-t-[3px] border-l-[3px] rounded-tl-xl',
                      'top-0 right-0 border-t-[3px] border-r-[3px] rounded-tr-xl',
                      'bottom-0 left-0 border-b-[3px] border-l-[3px] rounded-bl-xl',
                      'bottom-0 right-0 border-b-[3px] border-r-[3px] rounded-br-xl',
                    ].map((cls, i) => (
                      <div key={i} className={`absolute w-8 h-8 ${cls}`} style={{ borderColor: '#D4A373' }} />
                    ))}
                    <div className="absolute inset-x-4 top-0 qr-scan-line">
                      <div
                        className="h-0.5"
                        style={{ background: 'linear-gradient(to right, transparent, #D4A373, transparent)', opacity: 0.9 }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Validating overlay */}
              {validando && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-2xl">
                  <div
                    className="h-12 w-12 border-4 rounded-full animate-spin mb-3"
                    style={{ borderColor: 'rgba(255,255,255,0.2)', borderTopColor: '#D4A373' }}
                  />
                  <p className="text-white font-semibold text-sm">Validando código...</p>
                </div>
              )}

              {/* Error state */}
              {errorCamara && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-2xl p-6 text-center">
                  <XCircle className="h-12 w-12 text-red-400 mb-3" />
                  <p className="text-white font-semibold mb-2">Sin acceso a cámara</p>
                  <p className="text-white/60 text-sm leading-relaxed">{errorCamara}</p>
                  <p className="text-white/30 text-xs mt-5">
                    Usa el campo de texto en el POS para pegar el código manualmente.
                  </p>
                </div>
              )}

              {/* Loading state */}
              {!scannerListo && !errorCamara && (
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <div className="h-10 w-10 border-4 border-white/20 border-t-white rounded-full animate-spin mb-3" />
                  <p className="text-white/60 text-sm">Iniciando cámara...</p>
                </div>
              )}
            </div>

            <p className="text-center text-white/25 text-xs pb-6 px-4 shrink-0">
              Detección automática · No necesitas presionar ningún botón
            </p>
          </div>,
          document.body
        )}

      <style>{`
        @keyframes qrScanLine {
          0%   { transform: translateY(0px); }
          50%  { transform: translateY(224px); }
          100% { transform: translateY(0px); }
        }
        .qr-scan-line {
          animation: qrScanLine 2.6s ease-in-out infinite;
        }
      `}</style>
    </>
  )
}
