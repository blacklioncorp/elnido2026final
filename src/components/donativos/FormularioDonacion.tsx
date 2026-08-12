'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { X, Info, Loader2 } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Database } from '@/lib/database.types'
import { createDonacionCheckout } from '@/app/actions/donaciones'

type TarjetaDonacion = Database['public']['Tables']['tarjetas_donacion']['Row']

const schema = z.object({
  donanteNombre: z.string().min(2, 'Mínimo 2 caracteres'),
  donanteEmail: z.email('Correo inválido'),
  donanteUsername: z
    .string()
    .min(3, 'Mínimo 3 caracteres')
    .max(20, 'Máximo 20 caracteres')
    .regex(/^[a-zA-Z0-9]+$/, 'Solo letras y números, sin espacios'),
  monto: z
    .number()
    .positive('El monto debe ser mayor a cero')
    .max(50000, 'Máximo $50,000 MXN'),
  mensaje: z.string().max(200, 'Máximo 200 caracteres').optional(),
  aceptaPublico: z.literal(true, {
    error: 'Debes aceptar la visibilidad pública'
  } as any),
  aceptaNotificaciones: z.boolean().optional(),
  esRecurrente: z.boolean().optional(),
})

type FormValues = z.infer<typeof schema>

const MONTOS_SUGERIDOS = [100, 200, 500, 1000]

interface FormularioDonacionProps {
  tarjeta: TarjetaDonacion
  onClose: () => void
}

export default function FormularioDonacion({ tarjeta, onClose }: FormularioDonacionProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null)
  const [showTooltip, setShowTooltip] = useState(false)
  const [mensajeLen, setMensajeLen] = useState(0)
  const [montoSeleccionado, setMontoSeleccionado] = useState<number | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({ 
    resolver: zodResolver(schema),
    defaultValues: { esRecurrente: false }
  })

  const onSubmit = async (data: FormValues) => {
    setLoading(true)
    setErrorGeneral(null)

    const result = await createDonacionCheckout({
      tarjetaId: tarjeta.id,
      donanteNombre: data.donanteNombre,
      donanteEmail: data.donanteEmail,
      donanteUsername: data.donanteUsername,
      monto: data.monto,
      mensaje: data.mensaje,
      esRecurrente: data.esRecurrente,
    })

    if ('error' in result) {
      setErrorGeneral(result.error)
      setLoading(false)
      return
    }

    // Redirect to Stripe Checkout
    router.push(result.url)
  }

  const selectMonto = (m: number) => {
    setMontoSeleccionado(m)
    setValue('monto', m, { shouldValidate: true })
  }

  const especie = tarjeta.nombre_animal
    ? `${tarjeta.nombre_especie} "${tarjeta.nombre_animal}"`
    : tarjeta.nombre_especie

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Drawer */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', stiffness: 280, damping: 30 }}
        className="fixed right-0 top-0 h-full w-full max-w-md bg-[#F7F3E8] z-50 flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-forest-green-dark px-6 py-5 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-conservation-gold text-xs font-bold uppercase tracking-widest mb-1">
                Apadrinar
              </p>
              <h2 className="text-off-white font-bold text-xl leading-tight">{especie}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-off-white/60 hover:text-off-white transition-colors mt-1 flex-shrink-0 ml-4"
              aria-label="Cerrar"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-5">

          {/* Nombre */}
          <div>
            <label className="block text-xs font-semibold text-forest-green-dark/70 uppercase tracking-wider mb-1.5">
              Tu nombre <span className="text-forest-green-dark/40 font-normal normal-case">(solo visible para el santuario)</span>
            </label>
            <input
              {...register('donanteNombre')}
              type="text"
              placeholder="Juan García"
              className="w-full px-4 py-3 rounded-xl bg-white border border-forest-green-dark/15 focus:border-quetzal-blue focus:outline-none focus:ring-1 focus:ring-quetzal-blue text-forest-green-dark placeholder-forest-green-dark/30 transition-colors text-sm"
            />
            {errors.donanteNombre && (
              <p className="text-red-500 text-xs mt-1">{errors.donanteNombre.message}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-semibold text-forest-green-dark/70 uppercase tracking-wider mb-1.5">
              Tu email <span className="text-forest-green-dark/40 font-normal normal-case">(solo visible para el santuario)</span>
            </label>
            <input
              {...register('donanteEmail')}
              type="email"
              placeholder="juan@correo.com"
              className="w-full px-4 py-3 rounded-xl bg-white border border-forest-green-dark/15 focus:border-quetzal-blue focus:outline-none focus:ring-1 focus:ring-quetzal-blue text-forest-green-dark placeholder-forest-green-dark/30 transition-colors text-sm"
            />
            {errors.donanteEmail && (
              <p className="text-red-500 text-xs mt-1">{errors.donanteEmail.message}</p>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="block text-xs font-semibold text-forest-green-dark/70 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              Tu alias de Guardián
              <div className="relative">
                <button
                  type="button"
                  onMouseEnter={() => setShowTooltip(true)}
                  onMouseLeave={() => setShowTooltip(false)}
                  onFocus={() => setShowTooltip(true)}
                  onBlur={() => setShowTooltip(false)}
                  className="text-quetzal-blue"
                  aria-label="Información sobre el alias"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
                {showTooltip && (
                  <div className="absolute left-6 top-0 w-64 bg-forest-green-dark text-off-white text-xs px-3 py-2 rounded-lg shadow-xl z-10 leading-relaxed">
                    Este nombre aparecerá junto a tu donativo en la barra de progreso. Otros padrinos podrán verlo.
                    Te recomendamos usar un alias como <strong>QuetzalFan</strong> o <strong>GuardiánDelBosque</strong>.
                  </div>
                )}
              </div>
            </label>
            <input
              {...register('donanteUsername')}
              type="text"
              placeholder="QuetzalFan123"
              maxLength={20}
              className="w-full px-4 py-3 rounded-xl bg-white border border-forest-green-dark/15 focus:border-quetzal-blue focus:outline-none focus:ring-1 focus:ring-quetzal-blue text-forest-green-dark placeholder-forest-green-dark/30 transition-colors text-sm"
            />
            {errors.donanteUsername && (
              <p className="text-red-500 text-xs mt-1">{errors.donanteUsername.message}</p>
            )}
            <p className="text-forest-green-dark/40 text-xs mt-1">3-20 caracteres, solo letras y números</p>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-xs font-semibold text-forest-green-dark/70 uppercase tracking-wider mb-1.5">
              Monto a donar (MXN)
            </label>
            {/* Quick-select amounts */}
            <div className="grid grid-cols-4 gap-2 mb-2">
              {MONTOS_SUGERIDOS.map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => selectMonto(m)}
                  className={`py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
                    montoSeleccionado === m
                      ? 'bg-conservation-gold text-forest-green-dark scale-105 shadow-md shadow-conservation-gold/30'
                      : 'bg-white text-forest-green-dark border border-forest-green-dark/15 hover:bg-forest-green-dark/5'
                  }`}
                >
                  ${m}
                </button>
              ))}
            </div>
            <input
              {...register('monto', { valueAsNumber: true })}
              type="number"
              min={1}
              max={50000}
              placeholder="Otro monto..."
              onChange={(e) => {
                setMontoSeleccionado(null)
                register('monto', { valueAsNumber: true }).onChange(e)
              }}
              className="w-full px-4 py-3 rounded-xl bg-white border border-forest-green-dark/15 focus:border-quetzal-blue focus:outline-none focus:ring-1 focus:ring-quetzal-blue text-forest-green-dark placeholder-forest-green-dark/30 transition-colors text-sm"
            />
            {errors.monto && (
              <p className="text-red-500 text-xs mt-1">{errors.monto.message}</p>
            )}
          </div>

          {/* Mensaje */}
          <div>
            <label className="block text-xs font-semibold text-forest-green-dark/70 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Mensaje de apoyo <span className="font-normal normal-case">(opcional, público)</span></span>
              <span className={`font-normal ${mensajeLen > 180 ? 'text-red-500' : ''}`}>{mensajeLen}/200</span>
            </label>
            <textarea
              {...register('mensaje')}
              rows={3}
              maxLength={200}
              placeholder="Deja un mensaje de apoyo para esta especie..."
              onChange={(e) => {
                setMensajeLen(e.target.value.length)
                register('mensaje').onChange(e)
              }}
              className="w-full px-4 py-3 rounded-xl bg-white border border-forest-green-dark/15 focus:border-quetzal-blue focus:outline-none focus:ring-1 focus:ring-quetzal-blue text-forest-green-dark placeholder-forest-green-dark/30 transition-colors text-sm resize-none"
            />
            {errors.mensaje && (
              <p className="text-red-500 text-xs mt-1">{errors.mensaje.message}</p>
            )}
          </div>

          {/* Checkboxes */}
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                {...register('aceptaPublico')}
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-forest-green-dark/30 text-quetzal-blue focus:ring-quetzal-blue accent-quetzal-blue flex-shrink-0"
              />
              <span className="text-xs text-forest-green-dark/70 leading-relaxed">
                <strong className="text-forest-green-dark">* Requerido:</strong> Acepto que mi nombre de usuario y monto sean visibles públicamente en la barra de progreso.
              </span>
            </label>
            {errors.aceptaPublico && (
              <p className="text-red-500 text-xs">{errors.aceptaPublico.message}</p>
            )}

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                {...register('aceptaNotificaciones')}
                type="checkbox"
                className="mt-0.5 h-4 w-4 rounded border-forest-green-dark/30 accent-quetzal-blue flex-shrink-0"
              />
              <span className="text-xs text-forest-green-dark/60 leading-relaxed">
                Quiero recibir notificaciones sobre el progreso de esta especie.
              </span>
            </label>
          </div>

          {/* Error general */}
          {errorGeneral && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
              {errorGeneral}
            </div>
          )}

          {/* Checkbox: Hacer este donativo mensual */}
          <div className="bg-quetzal-blue/5 border border-quetzal-blue/20 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                {...register('esRecurrente')}
                type="checkbox"
                className="mt-1 h-5 w-5 rounded border-quetzal-blue/30 text-quetzal-blue focus:ring-quetzal-blue accent-quetzal-blue flex-shrink-0"
              />
              <div className="flex-1">
                <span className="block font-bold text-forest-green-dark mb-0.5 flex items-center gap-2">
                  ☑️ Hacer este donativo mensual
                  <div className="relative group inline-block">
                    <Info className="h-4 w-4 text-quetzal-blue cursor-help" />
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-60 bg-forest-green-dark text-off-white text-xs px-3 py-2 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10 text-center leading-relaxed pointer-events-none">
                      Tu donativo se renovará automáticamente cada mes. Recibirás un recordatorio 3 días antes del cobro.
                    </div>
                  </div>
                </span>
                <span className="block text-xs text-forest-green-dark/60 leading-relaxed">
                  Se cobrará el mismo monto cada mes. Puedes cancelar cuando quieras contactando al santuario.
                </span>
              </div>
            </label>
          </div>

          {/* Submit */}
          <div className="space-y-2 pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-lg text-off-white disabled:opacity-60 flex items-center justify-center gap-2 transition-all hover:brightness-110 shadow-lg"
              style={{ background: 'linear-gradient(135deg, #0B2B26 0%, #2E86AB 100%)' }}
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>{watch('esRecurrente') ? `💳 Donar $${watch('monto') || 0}/mes` : '💳 Donar con tarjeta'}</>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-xl font-medium text-forest-green-dark/60 hover:text-forest-green-dark hover:bg-forest-green-dark/5 transition-colors text-sm"
            >
              Cancelar
            </button>
          </div>
        </form>
      </motion.div>
    </>
  )
}
