'use client'

import { useState } from 'react'
import { X, Heart, User, Mail, AtSign, Calendar, DollarSign, CreditCard, MessageSquare, Pause, Play, Ban, Loader2, Sparkles, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import { toast } from 'sonner'
import { cambiarEstadoSuscripcionAdmin, type ApadrinamientoRow } from '@/app/(admin)/admin/apadrinamientos/actions'

interface PadrinoDetalleModalProps {
  isOpen: boolean
  onClose: () => void
  apadrinamiento: ApadrinamientoRow | null
  onUpdate: () => void
}

export default function PadrinoDetalleModal({
  isOpen,
  onClose,
  apadrinamiento,
  onUpdate,
}: PadrinoDetalleModalProps) {
  const [loadingAction, setLoadingAction] = useState<string | null>(null)

  if (!isOpen || !apadrinamiento) return null

  const handleGestion = async (accion: 'pausar' | 'reanudar' | 'cancelar') => {
    const confirmMsg =
      accion === 'cancelar'
        ? '¿Estás seguro de cancelar definitivamente la suscripción de este padrino?'
        : accion === 'pausar'
        ? '¿Deseas pausar temporalmente los cobros automáticos de esta suscripción?'
        : '¿Deseas reactivar los cobros automáticos de esta suscripción?'

    if (!confirm(confirmMsg)) return

    try {
      setLoadingAction(accion)
      const res = await cambiarEstadoSuscripcionAdmin(apadrinamiento.id, accion)
      if (res.success) {
        toast.success(res.message || 'Estado de suscripción actualizado')
        onUpdate()
        onClose()
      } else {
        toast.error(res.error || 'Error al actualizar suscripción')
      }
    } catch (err: any) {
      toast.error(err.message || 'Error inesperado')
    } finally {
      setLoadingAction(null)
    }
  }

  const fechaFormateada = new Date(apadrinamiento.created_at).toLocaleString('es-MX', {
    dateStyle: 'long',
    timeStyle: 'short',
  })

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#0e1f18] border border-white/10 rounded-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 sticky top-0 bg-[#0e1f18]/95 backdrop-blur-md z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-conservation-gold/20 border border-conservation-gold/40 flex items-center justify-center text-conservation-gold">
              <Heart className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-off-white">Detalle de Apadrinamiento</h3>
              <p className="text-xs text-off-white/50">Registrado el {fechaFormateada}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-off-white/50 hover:text-white hover:bg-white/10 transition-colors"
            aria-label="Cerrar modal"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Info Padrino */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
            <p className="text-xs uppercase tracking-wider font-semibold text-conservation-gold flex items-center gap-1.5">
              <User className="h-3.5 w-3.5" /> Datos del Guardián / Padrino
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-off-white">
              <div>
                <span className="text-off-white/50 text-xs block">Nombre:</span>
                <span className="font-semibold">{apadrinamiento.donante_nombre}</span>
              </div>
              <div>
                <span className="text-off-white/50 text-xs block">Correo Electrónico:</span>
                <span className="font-mono text-xs">{apadrinamiento.donante_email}</span>
              </div>
              {apadrinamiento.donante_username && (
                <div>
                  <span className="text-off-white/50 text-xs block">Alias en Muro:</span>
                  <span className="font-semibold text-quetzal-blue">@{apadrinamiento.donante_username}</span>
                </div>
              )}
              <div>
                <span className="text-off-white/50 text-xs block">Canal / Origen:</span>
                <span className="capitalize">{apadrinamiento.origen === 'donativos' ? '🌿 Ficha de Especie' : '💛 Donación General'}</span>
              </div>
            </div>
          </div>

          {/* Especie Apadrinada */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
            <p className="text-xs uppercase tracking-wider font-semibold text-quetzal-blue flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5" /> Especie en Conservación
            </p>
            {apadrinamiento.tarjeta ? (
              <div className="flex items-center gap-4 pt-1">
                {apadrinamiento.tarjeta.imagen_url && (
                  <div className="w-14 h-14 rounded-xl overflow-hidden relative shrink-0 border border-white/10">
                    <Image 
                      src={apadrinamiento.tarjeta.imagen_url} 
                      alt={apadrinamiento.tarjeta.nombre_especie}
                      fill
                      className="object-cover"
                    />
                  </div>
                )}
                <div>
                  <h4 className="text-base font-bold text-off-white">
                    {apadrinamiento.tarjeta.nombre_especie}
                  </h4>
                  {apadrinamiento.tarjeta.nombre_animal && (
                    <p className="text-xs text-off-white/60">
                      Ejemplar: <span className="font-medium text-conservation-gold">{apadrinamiento.tarjeta.nombre_animal}</span>
                    </p>
                  )}
                  <p className="text-xs text-off-white/40 capitalize">
                    Programa: {apadrinamiento.tarjeta.tipo.replace('_', ' ')}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-off-white/70 italic">
                Aportación general para el sostenimiento del Santuario.
              </p>
            )}
          </div>

          {/* Datos Financieros y de Suscripción */}
          <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-3">
            <p className="text-xs uppercase tracking-wider font-semibold text-emerald-400 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5" /> Información de Aportación
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
              <div>
                <span className="text-off-white/50 text-xs block">Monto Aportado:</span>
                <span className="text-lg font-extrabold text-conservation-gold">
                  ${apadrinamiento.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })} <span className="text-xs font-normal text-off-white/60">MXN</span>
                </span>
              </div>
              <div>
                <span className="text-off-white/50 text-xs block">Tipo de Pago:</span>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-semibold ${
                  apadrinamiento.es_recurrente
                    ? 'bg-quetzal-blue/20 text-quetzal-blue border border-quetzal-blue/30'
                    : 'bg-white/10 text-off-white/80 border border-white/10'
                }`}>
                  {apadrinamiento.es_recurrente ? '🔄 Mensual Recurrente' : '⚡ Pago Único'}
                </span>
              </div>
              <div>
                <span className="text-off-white/50 text-xs block">Estado:</span>
                <span className={`inline-block mt-0.5 px-2 py-0.5 rounded text-xs font-bold ${
                  apadrinamiento.estado_suscripcion === 'activa'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : apadrinamiento.estado_suscripcion === 'pausada'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : apadrinamiento.estado_suscripcion === 'cancelada'
                    ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                    : 'bg-white/10 text-off-white/70'
                }`}>
                  {apadrinamiento.estado_suscripcion ? apadrinamiento.estado_suscripcion.toUpperCase() : 'COMPLETADA'}
                </span>
              </div>
            </div>

            {apadrinamiento.stripe_subscription_id && (
              <div className="pt-2 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-off-white/50">ID Suscripción Stripe:</span>
                <span className="font-mono text-off-white/80 bg-white/5 px-2 py-1 rounded">
                  {apadrinamiento.stripe_subscription_id}
                </span>
              </div>
            )}
          </div>

          {/* Mensaje del Padrino */}
          {apadrinamiento.mensaje && (
            <div className="p-4 rounded-xl bg-conservation-gold/10 border border-conservation-gold/20 space-y-1.5">
              <p className="text-xs uppercase tracking-wider font-semibold text-conservation-gold flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5" /> Mensaje / Dedicatoria del Padrino
              </p>
              <p className="text-sm text-off-white italic">
                &ldquo;{apadrinamiento.mensaje}&rdquo;
              </p>
            </div>
          )}

          {/* Acciones de Suscripción (si aplica) */}
          {apadrinamiento.es_recurrente && apadrinamiento.stripe_subscription_id && (
            <div className="pt-2 border-t border-white/10 space-y-2">
              <p className="text-xs font-semibold text-off-white/60">Gestión de Suscripción en Stripe:</p>
              <div className="flex flex-wrap gap-2">
                {apadrinamiento.estado_suscripcion === 'activa' && (
                  <button
                    onClick={() => handleGestion('pausar')}
                    disabled={loadingAction !== null}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {loadingAction === 'pausar' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Pause className="h-3.5 w-3.5" />}
                    Pausar Suscripción
                  </button>
                )}

                {apadrinamiento.estado_suscripcion === 'pausada' && (
                  <button
                    onClick={() => handleGestion('reanudar')}
                    disabled={loadingAction !== null}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-emerald-300 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {loadingAction === 'reanudar' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                    Reanudar Suscripción
                  </button>
                )}

                {apadrinamiento.estado_suscripcion !== 'cancelada' && (
                  <button
                    onClick={() => handleGestion('cancelar')}
                    disabled={loadingAction !== null}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 text-xs font-semibold transition-colors disabled:opacity-50"
                  >
                    {loadingAction === 'cancelar' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ban className="h-3.5 w-3.5" />}
                    Cancelar Suscripción
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/10 bg-white/[0.02] flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-off-white text-sm font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
