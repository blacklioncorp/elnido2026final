'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, X, Sparkles, Loader2, Shield, Lock } from 'lucide-react'
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
        {abrirDonacionAuto && (
          <div className="mb-4 p-2.5 rounded-xl bg-conservation-gold/15 border border-conservation-gold/30 flex items-center gap-2 text-conservation-gold text-xs font-semibold">
            <Sparkles className="h-4 w-4 shrink-0" />
            <span>¡Gracias por escanear el QR del recinto!</span>
          </div>
        )}

        <div className="flex items-center gap-2 mb-2 text-conservation-gold">
          <Heart className="h-4 w-4 fill-conservation-gold" />
          <span className="text-xs font-bold uppercase tracking-wider">Sé su Guardián</span>
        </div>

        <h3 className="text-xl font-bold text-off-white mb-2">
          Apadrina a {especie.nombre}
        </h3>

        <p className="text-off-white/70 text-sm mb-6 leading-relaxed">
          Tu donativo financia directamente su alimentación, hábitat y atención médica especializada en el santuario.
        </p>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setModalAbierto(true)}
          className="w-full py-4 px-4 rounded-xl font-extrabold text-forest-green-dark bg-conservation-gold hover:bg-conservation-gold/90 transition-all shadow-lg flex items-center justify-center gap-2 text-base"
        >
          <Heart className="h-5 w-5 fill-forest-green-dark" />
          <span>Apadrinar</span>
        </motion.button>

        <p className="text-[11px] text-center text-off-white/40 mt-3 flex items-center justify-center gap-1">
          <Lock className="h-3 w-3" /> Donación 100% segura con Stripe
        </p>
      </div>

      {/* Modal de Donación Simple */}
      <AnimatePresence>
        {modalAbierto && (
          <div
            className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setModalAbierto(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ duration: 0.2 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-forest-green-dark border border-white/10 rounded-3xl p-6 md:p-8 max-w-lg w-full shadow-2xl relative max-h-[90vh] overflow-y-auto"
            >
              {/* Header Modal */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <div className="flex items-center gap-2 text-conservation-gold mb-1">
                    <Heart className="h-4 w-4 fill-conservation-gold" />
                    <span className="text-xs font-bold uppercase tracking-wider">Donación para Conservación</span>
                  </div>
                  <h2 className="text-2xl font-extrabold text-off-white">
                    Apadrinar a {especie.nombre}
                  </h2>
                  <p className="text-xs text-off-white/60 mt-1">
                    Donativo directo para su alimentación y cuidados en El Nido
                  </p>
                </div>
                <button
                  onClick={() => setModalAbierto(false)}
                  className="p-1.5 text-off-white/40 hover:text-off-white hover:bg-white/10 rounded-xl transition-colors shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Formulario */}
              <form onSubmit={handleSubmit} className="space-y-4">
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
                    Aquí recibirás tu recibo de donación y agradecimiento.
                  </p>
                </div>

                {/* Turnstile */}
                <div className="pt-1">
                  <TurnstileCaptcha onVerify={(t) => setTurnstileToken(t)} />
                </div>

                {/* Botón Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-4 rounded-xl font-bold text-forest-green-dark bg-conservation-gold hover:bg-conservation-gold/90 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2 text-base mt-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Conectando con Stripe…</span>
                    </>
                  ) : (
                    <>
                      <Heart className="h-5 w-5 fill-forest-green-dark" />
                      <span>Donar {formatCurrency(montoFinal)}</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-off-white/40 pt-1 flex items-center justify-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-conservation-gold" />
                  Transacción protegida y cifrada con Stripe
                </p>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
