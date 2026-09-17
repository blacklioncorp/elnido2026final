'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, X, Loader2, Shield, Lock, Sparkles } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'
import { createDonacionGenericaCheckout } from '@/app/actions/donaciones'
import TurnstileCaptcha from '@/components/ui/TurnstileCaptcha'

const MONTOS_SUGERIDOS = [50, 100, 200, 500]

interface FaunaDonarCTAProps {
  especie: {
    nombre: string
    slug: string
  }
  abrirDonacionAuto?: boolean
}

export default function FaunaDonarCTA({
  especie,
  abrirDonacionAuto = false,
}: FaunaDonarCTAProps) {
  const [modalAbierto, setModalAbierto] = useState(() => Boolean(abrirDonacionAuto))
  const [monto, setMonto] = useState<number>(100)
  const [montoPersonalizado, setMontoPersonalizado] = useState<string>('')
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Bloqueo de scroll y clase para ocultar navbar/footer en móvil mientras el modal está abierto
  useEffect(() => {
    if (!modalAbierto) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalAbierto(false)
    }
    window.addEventListener('keydown', handleKeyDown)

    const esMobil = window.matchMedia('(max-width: 767px)').matches
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    if (esMobil) {
      document.body.classList.add('modal-open-mobile')
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = prevOverflow
      document.body.classList.remove('modal-open-mobile')
    }
  }, [modalAbierto])

  const montoFinal = montoPersonalizado ? Number(montoPersonalizado) : monto

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!montoFinal || montoFinal <= 0) {
      toast.error('Por favor ingresa un monto válido mayor a $0.')
      return
    }

    setLoading(true)
    try {
      const res = await createDonacionGenericaCheckout({
        nombre: nombre.trim(),
        email: email.trim(),
        monto: montoFinal,
        esRecurrente: false,
        turnstileToken,
      })

      if ('error' in res) {
        toast.error(res.error)
        setLoading(false)
        return
      }

      if (res.url) {
        window.location.href = res.url
      }
    } catch (err: any) {
      toast.error(err?.message || 'Error inesperado al procesar la donación.')
      setLoading(false)
    }
  }

  return (
    <>
      {/* Sidebar Card */}
      <div className="bg-forest-green-light/40 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-2 text-conservation-gold">
          <Heart className="h-4 w-4 fill-conservation-gold" />
          <span className="text-xs font-bold uppercase tracking-wider">Apoya a esta especie</span>
        </div>

        <h3 className="text-xl font-bold text-off-white mb-2">
          Donar a {especie.nombre}
        </h3>

        <p className="text-off-white/70 text-sm mb-6 leading-relaxed">
          Tu donativo apoya directamente a esta especie financiando su alimentación, hábitat y atención médica especializada en el santuario.
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setModalAbierto(true)}
          className="w-full py-4 px-4 rounded-xl font-extrabold text-forest-green-dark bg-conservation-gold hover:bg-conservation-gold/90 transition-all shadow-lg flex items-center justify-center gap-2 text-base"
        >
          <Heart className="h-5 w-5 fill-forest-green-dark" />
          <span>Donar</span>
        </motion.button>

        <p className="text-[11px] text-center text-off-white/40 mt-3 flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" /> Donación 100% segura con Stripe
        </p>
      </div>

      {/* Modal / Drawer de Donación */}
      <AnimatePresence>
        {modalAbierto && (
          <div className="fixed inset-0 z-[9999] flex items-end md:items-center md:justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setModalAbierto(false)}
            />

            {/* Modal Card / Drawer */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              onClick={(e) => e.stopPropagation()}
              className="relative z-10 w-full md:max-w-lg bg-forest-green-dark border-t md:border border-white/15 rounded-t-3xl md:rounded-3xl max-h-[92vh] md:max-h-[85vh] flex flex-col shadow-2xl overflow-hidden"
            >
              {/* Handle visual para móvil */}
              <div className="md:hidden w-12 h-1.5 bg-white/20 rounded-full mx-auto my-3 shrink-0" />

              {/* Header Modal */}
              <div className="flex items-center justify-between px-6 pb-4 pt-1 md:pt-6 border-b border-white/10 shrink-0">
                <div>
                  <div className="flex items-center gap-2 text-conservation-gold mb-0.5">
                    <Heart className="h-4 w-4 fill-conservation-gold" />
                    <span className="text-[11px] font-bold uppercase tracking-wider">Donación Única</span>
                  </div>
                  <h2 className="text-xl md:text-2xl font-extrabold text-off-white">
                    Donar a {especie.nombre}
                  </h2>
                  <p className="text-xs text-off-white/60">
                    Tu donativo apoya directamente a esta especie
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="p-2 text-off-white/50 hover:text-off-white hover:bg-white/10 rounded-xl transition-colors shrink-0"
                  aria-label="Cerrar modal"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Contenido scrolleable del formulario */}
              <form id="donacion-form" onSubmit={handleSubmit} className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4">
                {/* Selector de Montos */}
                <div>
                  <label className="block text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-2">
                    Selecciona un monto (MXN)
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {MONTOS_SUGERIDOS.map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => {
                          setMonto(val)
                          setMontoPersonalizado('')
                        }}
                        className={`py-2.5 rounded-xl font-bold text-sm transition-all ${
                          monto === val && !montoPersonalizado
                            ? 'bg-conservation-gold text-forest-green-dark shadow-md'
                            : 'bg-white/10 text-off-white hover:bg-white/15'
                        }`}
                      >
                        ${val}
                      </button>
                    ))}
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-off-white/40 text-sm">$</span>
                    <input
                      type="number"
                      min="10"
                      max="50000"
                      value={montoPersonalizado}
                      onChange={(e) => {
                        setMontoPersonalizado(e.target.value)
                        setMonto(0)
                      }}
                      placeholder="Otro monto en pesos..."
                      className="w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-conservation-gold text-off-white placeholder-off-white/30 text-sm focus:outline-none"
                    />
                  </div>
                </div>

                {/* Datos del Donante */}
                <div>
                  <label className="block text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5">
                    Tu Nombre Completo *
                  </label>
                  <input
                    type="text"
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    placeholder="Ej. María González"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-conservation-gold text-off-white placeholder-off-white/30 text-sm focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5">
                    Correo Electrónico *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-conservation-gold text-off-white placeholder-off-white/30 text-sm focus:outline-none"
                  />
                  <p className="text-[11px] text-off-white/40 mt-1">
                    Aquí recibirás tu comprobante y confirmación.
                  </p>
                </div>

                {/* Turnstile */}
                <div className="pt-1">
                  <TurnstileCaptcha onVerify={(t) => setTurnstileToken(t)} />
                </div>
              </form>

              {/* Footer Fijo con Botón Submit */}
              <div className="shrink-0 p-5 border-t border-white/10 bg-forest-green-dark/95 backdrop-blur-md">
                <button
                  type="submit"
                  form="donacion-form"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-forest-green-dark bg-conservation-gold hover:bg-conservation-gold/90 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2 text-base"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Conectando con Stripe…</span>
                    </>
                  ) : (
                    <>
                      <Heart className="h-5 w-5 fill-forest-green-dark" />
                      <span>Donar con tarjeta ({formatCurrency(montoFinal)})</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-off-white/40 pt-2 flex items-center justify-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-conservation-gold" />
                  Transacción 100% protegida y cifrada con Stripe
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
