'use client'

import { useState, useEffect } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Heart, Sparkles, ArrowRight, CheckCircle2, Star } from 'lucide-react'
import Link from 'next/link'
import FormularioDonacion from '@/components/donativos/FormularioDonacion'
import { formatCurrency } from '@/lib/utils'
import type { Database } from '@/lib/database.types'

type TarjetaDonacion = Database['public']['Tables']['tarjetas_donacion']['Row']

interface FaunaDonarCTAProps {
  especie: {
    nombre: string
    slug: string
  }
  tarjeta: TarjetaDonacion | null
  abrirDonacionAuto?: boolean
}

export default function FaunaDonarCTA({
  especie,
  tarjeta,
  abrirDonacionAuto = false,
}: FaunaDonarCTAProps) {
  // Auto-abrir formulario si la URL trae ?donar=true (desde QR in-situ)
  const [formularioAbierto, setFormularioAbierto] = useState(
    () => Boolean(abrirDonacionAuto && tarjeta && !tarjeta.meta_cumplida)
  )

  // Si tiene tarjeta de donación activa vinculada
  if (tarjeta) {
    const porcentaje = Math.min(
      Math.round(((tarjeta.monto_recaudado ?? 0) / (tarjeta.meta_monto || 1)) * 100),
      100
    )

    return (
      <>
        <div className="bg-forest-green-light/40 backdrop-blur-md rounded-2xl border border-conservation-gold/30 p-6 shadow-xl relative overflow-hidden">
          {/* Badge QR / In-situ scan notice */}
          {abrirDonacionAuto && (
            <div className="mb-4 p-2.5 rounded-xl bg-conservation-gold/15 border border-conservation-gold/40 flex items-center gap-2 text-conservation-gold text-xs font-semibold">
              <Sparkles className="h-4 w-4 shrink-0" />
              <span>¡Gracias por escanear el QR del recinto!</span>
            </div>
          )}

          <div className="flex items-center gap-2 mb-2">
            <span className="p-1.5 rounded-lg bg-conservation-gold/20 text-conservation-gold">
              <Heart className="h-4 w-4 fill-conservation-gold" />
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-conservation-gold">
              Programa de Apadrinamiento
            </span>
          </div>

          <h3 className="text-xl font-bold text-off-white mb-2">
            Apadrina a {tarjeta.nombre_animal || especie.nombre}
          </h3>

          <p className="text-off-white/70 text-sm mb-4 leading-relaxed">
            {tarjeta.descripcion ||
              `Tu aporte financia directamente su alimentación, hábitat y atención médica especializada en el santuario.`}
          </p>

          {/* Meta y Progreso */}
          <div className="space-y-2 mb-6">
            <div className="flex justify-between items-center text-xs">
              <span className="text-off-white/60">
                {tarjeta.meta_tipo === 'unica' ? 'Meta única' : 'Meta mensual'}
              </span>
              <span className="font-bold text-conservation-gold">{porcentaje}%</span>
            </div>
            <div className="w-full bg-forest-green-dark/70 rounded-full h-2.5 overflow-hidden border border-white/5">
              <div
                className="h-full bg-gradient-to-r from-conservation-gold to-quetzal-blue rounded-full transition-all duration-700"
                style={{ width: `${porcentaje}%` }}
              />
            </div>
            <div className="flex justify-between items-center text-xs text-off-white/50">
              <span>Recaudado: {formatCurrency(tarjeta.monto_recaudado ?? 0)}</span>
              <span>Meta: {formatCurrency(tarjeta.meta_monto)}</span>
            </div>
          </div>

          {/* Botón CTA */}
          {tarjeta.meta_cumplida ? (
            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-center font-semibold text-sm flex items-center justify-center gap-2">
              <CheckCircle2 className="h-4 w-4" /> Meta Cumplida
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setFormularioAbierto(true)}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-forest-green-dark bg-conservation-gold hover:bg-conservation-gold/90 transition-all shadow-lg flex items-center justify-center gap-2 text-base"
            >
              <Heart className="h-5 w-5 fill-forest-green-dark" />
              <span>Donar y Apadrinar Ahora</span>
            </motion.button>
          )}

          <p className="text-[11px] text-center text-off-white/40 mt-3">
            Donación 100% segura con Stripe y deducible de impuestos
          </p>
        </div>

        {/* Modal / Drawer de Donación */}
        <AnimatePresence>
          {formularioAbierto && (
            <FormularioDonacion
              tarjeta={tarjeta}
              onClose={() => setFormularioAbierto(false)}
            />
          )}
        </AnimatePresence>
      </>
    )
  }

  // Fallback si la especie no tiene tarjeta activa vinculada en la base de datos
  return (
    <div className="bg-forest-green-light/40 backdrop-blur-md rounded-2xl border border-white/10 p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-2 text-conservation-gold">
        <Star className="h-4 w-4 fill-conservation-gold" />
        <span className="text-xs font-bold uppercase tracking-wider">Sé su Guardián</span>
      </div>

      <h3 className="text-xl font-bold text-off-white mb-2">
        Protege al {especie.nombre}
      </h3>

      <p className="text-off-white/70 text-sm mb-6 leading-relaxed">
        Suma tu apoyo a los programas de conservación y bienestar animal de El Nido para esta y otras especies en riesgo.
      </p>

      <Link
        href="/donativos"
        className="w-full py-3.5 px-4 rounded-xl font-bold text-forest-green-dark bg-conservation-gold hover:bg-conservation-gold/90 transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
      >
        <span>Ver Causas de Donación</span>
        <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  )
}
