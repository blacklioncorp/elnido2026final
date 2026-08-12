'use client'

import { useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ExternalLink, Calendar, User, DollarSign, Target, MessageCircle } from 'lucide-react'
import Image from 'next/image'
import { formatCurrency } from '@/lib/utils'

interface DonacionDetalleProps {
  isOpen: boolean
  onClose: () => void
  data: any | null // we'll use 'any' for simplicity, but expect specific structure
}

export default function DonacionDetalleModal({ isOpen, onClose, data }: DonacionDetalleProps) {
  // Handle escape key
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onClose])

  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }
    return () => { document.body.style.overflow = 'auto' }
  }, [isOpen])

  if (!data) return null

  const isRecurrente = data.es_recurrente === true || data.metodo_pago?.includes('subscription') || data.stripe_session_id?.includes('sub_')

  const metaTipoFormat: Record<string, string> = {
    mensual: 'Meta Mensual',
    anual: 'Meta Anual',
    unica: 'Meta Única',
  }

  const progreso = data.meta_monto > 0 ? Math.min(100, Math.round((data.monto_recaudado / data.meta_monto) * 100)) : 0

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 text-forest-green-dark/50 hover:text-forest-green-dark hover:bg-forest-green-dark/5 rounded-full transition-colors z-10"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="p-6">
              {/* Header: Especie Info */}
              <div className="flex flex-col items-center text-center mb-6 pt-4">
                <div className="relative w-20 h-20 rounded-full overflow-hidden mb-4 border-4 border-forest-green-dark/5">
                  {data.imagen_url ? (
                    <Image
                      src={data.imagen_url}
                      alt={data.nombre_especie || 'Especie'}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-forest-green-dark/10 flex items-center justify-center text-2xl">
                      🌿
                    </div>
                  )}
                </div>
                <h3 className="text-xl font-bold text-forest-green-dark leading-tight">
                  {data.nombre_especie} {data.nombre_animal && `"${data.nombre_animal}"`}
                </h3>
                <div className="mt-2 flex gap-2">
                  <span className="bg-forest-green-dark/10 text-forest-green-dark px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider">
                    {metaTipoFormat[data.meta_tipo] || data.meta_tipo}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${isRecurrente ? 'bg-quetzal-blue/10 text-quetzal-blue' : 'bg-conservation-gold/20 text-conservation-gold'}`}>
                    {isRecurrente ? 'Recurrente' : 'Único'}
                  </span>
                </div>
              </div>

              {/* Donation Details */}
              <div className="bg-forest-green-dark/5 rounded-2xl p-5 mb-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-forest-green-dark/70">
                    <DollarSign className="h-4 w-4" />
                    <span className="text-sm font-medium">Monto Donado</span>
                  </div>
                  <span className="font-bold text-forest-green-dark text-lg">{formatCurrency(data.monto)}</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-forest-green-dark/70">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm font-medium">Fecha y Hora</span>
                  </div>
                  <span className="font-medium text-forest-green-dark text-sm">
                    {new Date(data.created_at).toLocaleString('es-MX', {
                      dateStyle: 'short',
                      timeStyle: 'short'
                    })}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-forest-green-dark/70">
                    <User className="h-4 w-4" />
                    <span className="text-sm font-medium">Donante</span>
                  </div>
                  <span className="font-medium text-forest-green-dark text-sm">
                    {data.donante_username ? `@${data.donante_username}` : 'Anónimo'}
                  </span>
                </div>
              </div>

              {/* Mensaje de Apoyo */}
              {data.mensaje && (
                <div className="bg-conservation-gold/10 rounded-2xl p-5 mb-6 border border-conservation-gold/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <MessageCircle className="h-16 w-16 text-conservation-gold" />
                  </div>
                  <h4 className="text-forest-green-dark font-semibold text-sm mb-2 flex items-center gap-2 relative z-10">
                    <MessageCircle className="h-4 w-4 text-conservation-gold" />
                    Mensaje de Apoyo
                  </h4>
                  <p className="text-forest-green-dark/90 text-sm italic relative z-10 leading-relaxed">
                    "{data.mensaje}"
                  </p>
                </div>
              )}

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2 text-forest-green-dark font-medium">
                    <Target className="h-4 w-4 text-conservation-gold" />
                    <span className="text-sm">Progreso de especie</span>
                  </div>
                  <span className="text-sm font-bold text-forest-green-dark">{progreso}%</span>
                </div>
                <div className="w-full bg-forest-green-dark/10 rounded-full h-2.5 mb-1 overflow-hidden">
                  <div 
                    className="bg-conservation-gold h-2.5 rounded-full transition-all duration-1000 ease-out" 
                    style={{ width: `${progreso}%` }}
                  ></div>
                </div>
                <p className="text-xs text-forest-green-dark/60 text-right">
                  Lleva {formatCurrency(data.monto_recaudado)} de {formatCurrency(data.meta_monto)}
                </p>
              </div>

              {/* Action Button */}
              {data.tarjeta_id && (
                <a
                  href="/donativos"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-forest-green-dark text-white font-medium py-3 rounded-xl hover:bg-forest-green-dark/90 transition-colors"
                >
                  Ir a tarjeta de especie
                  <ExternalLink className="h-4 w-4" />
                </a>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
