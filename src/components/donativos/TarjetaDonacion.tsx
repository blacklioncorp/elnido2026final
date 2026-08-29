'use client'

import { useState, useRef } from 'react'
import LightboxImage from '@/components/ui/LightboxImage'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Feather, Heart, Star } from 'lucide-react'
import type { Database } from '@/lib/database.types'
import FormularioDonacion from './FormularioDonacion'
import MapaCondicional from './MapaCondicional'
import Link from 'next/link'

type TarjetaDonacion = Database['public']['Tables']['tarjetas_donacion']['Row']

interface Donante {
  donante_username: string | null
  donante_nombre: string
  monto: number
  created_at: string
}

interface TarjetaDonacionProps {
  tarjeta: TarjetaDonacion
  donantesRecientes: Donante[]
}

// Deterministic color based on string
const AVATAR_COLORS = [
  'bg-quetzal-blue',
  'bg-conservation-gold',
  'bg-forest-green-light',
  '#7C3AED',
  '#BE185D',
  '#B45309',
]
function getAvatarColor(str: string): string {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(str: string): string {
  return str.slice(0, 2).toUpperCase()
}

function getAnimalEmoji(tipo: string, nombre: string): string {
  if (tipo === 'familia') return '🦁'
  const n = nombre.toLowerCase()
  if (n.includes('guacamaya') || n.includes('loro') || n.includes('cotorra')) return '🦜'
  if (n.includes('jaguar') || n.includes('ocelot') || n.includes('puma')) return '🐆'
  if (n.includes('tortuga')) return '🐢'
  if (n.includes('cocodrilo') || n.includes('caimán')) return '🐊'
  if (n.includes('oso')) return '🐻'
  if (n.includes('venado')) return '🦌'
  if (n.includes('quetzal')) return '🦚'
  if (n.includes('mariposa') || n.includes('monarca')) return '🦋'
  if (n.includes('delfín') || n.includes('ballena')) return '🐬'
  if (n.includes('águila') || n.includes('halcón') || n.includes('búho')) return '🦅'
  return '🦎'
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount)
}

function ProgressBar({ porcentaje }: { porcentaje: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const clampedPct = Math.min(porcentaje, 100)

  const gradientColor =
    clampedPct >= 90
      ? 'from-emerald-400 to-emerald-500'
      : clampedPct >= 51
      ? 'from-conservation-gold to-yellow-400'
      : 'from-quetzal-blue to-blue-400'

  return (
    <div ref={ref} className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-forest-green-dark/70">Progreso</span>
        <span className="text-2xl font-extrabold text-forest-green-dark">{Math.round(clampedPct)}%</span>
      </div>
      <div className="h-4 w-full rounded-full bg-gray-200 overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${gradientColor} relative`}
          initial={{ width: 0 }}
          animate={inView ? { width: `${clampedPct}%` } : { width: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        >
          {/* Shimmer animation */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute inset-y-0 w-8 bg-white/30 skew-x-12 animate-[shimmer_2s_infinite]" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function TarjetaDonacionCard({ tarjeta, donantesRecientes }: TarjetaDonacionProps) {
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [historiaExpandida, setHistoriaExpandida] = useState(false)

  const porcentaje = tarjeta.meta_monto > 0
    ? (tarjeta.monto_recaudado / tarjeta.meta_monto) * 100
    : 0
  const restante = tarjeta.meta_monto - tarjeta.monto_recaudado
  const casiListo = restante > 0 && restante < 500
  const emoji = getAnimalEmoji(tarjeta.tipo, tarjeta.nombre_especie)

  const tipoBadgeLabel =
    tarjeta.tipo === 'especie' ? 'Especie' :
    tarjeta.tipo === 'animal_individual' ? 'Animal' : 'Familia'

  return (
    <>
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 20px 60px rgba(11,43,38,0.2)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className="rounded-2xl overflow-hidden shadow-lg shadow-forest-green-dark/10 border border-forest-green-dark/8 bg-white cursor-pointer group"
        onClick={() => !tarjeta.meta_cumplida && setFormularioAbierto(true)}
      >
        {/* ── IMAGE SECTION ── */}
        <div className="relative h-[220px] overflow-hidden">
          {tarjeta.imagen_url ? (
            <LightboxImage
              src={tarjeta.imagen_url}
              alt={tarjeta.nombre_especie}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-forest-green-dark to-forest-green-light flex items-center justify-center">
              <span className="text-7xl">{emoji}</span>
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Type badge — top left */}
          <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
            <span className="bg-conservation-gold text-forest-green-dark text-xs font-bold px-2.5 py-1 rounded-full self-start shadow-md">
              {tipoBadgeLabel}
            </span>
            {tarjeta.seccion === 'impulsa_vuelo' && (
              <span className="bg-quetzal-blue text-white text-xs font-bold px-2.5 py-1 rounded-full self-start shadow-md">
                En camino a la libertad 🗺️
              </span>
            )}
          </div>

          {/* Badges — top right */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1 items-end">
            {tarjeta.meta_cumplida && (
              <span className="bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                ✅ Meta Cumplida
              </span>
            )}
            {casiListo && !tarjeta.meta_cumplida && (
              <motion.span
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
                className="bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full"
              >
                🎯 ¡Casi llegamos!
              </motion.span>
            )}
          </div>
        </div>

        {/* ── CARD BODY ── */}
        <div className="bg-[#F7F3E8] p-6 space-y-4" style={{ background: '#F7F3E8' }}>

          {/* Species name + animal name */}
          <div>
            {tarjeta.seccion === 'impulsa_vuelo' ? (
              <Link href={`/impulsa-el-vuelo/${tarjeta.id}`}>
                <h2 className="text-2xl font-bold text-forest-green-dark leading-tight hover:text-quetzal-blue transition-colors">
                  {tarjeta.nombre_especie}
                </h2>
              </Link>
            ) : (
              <h2 className="text-2xl font-bold text-forest-green-dark leading-tight">
                {tarjeta.nombre_especie}
              </h2>
            )}
            {tarjeta.nombre_animal && (
              <p className="text-lg italic text-quetzal-blue mt-0.5">&ldquo;{tarjeta.nombre_animal}&rdquo;</p>
            )}
            {tarjeta.seccion === 'impulsa_vuelo' && tarjeta.area_protegida && (
              <p className="text-xs text-forest-green-dark/70 font-medium mt-1 flex items-center gap-1">
                📍 Destino: {tarjeta.area_protegida}
              </p>
            )}
          </div>

          {/* Decorative separator */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-conservation-gold/40" />
            <Feather className="h-3.5 w-3.5 text-conservation-gold" />
            <div className="h-px flex-1 bg-conservation-gold/40" />
          </div>

          {/* Description + "Leer más" */}
          <div>
            <p className="text-sm text-forest-green-dark/70 leading-relaxed">
              {historiaExpandida
                ? (tarjeta.historia ?? tarjeta.descripcion)
                : tarjeta.descripcion}
            </p>
            {tarjeta.historia && tarjeta.historia !== tarjeta.descripcion && (
              <button
                onClick={(e) => { e.stopPropagation(); setHistoriaExpandida(!historiaExpandida) }}
                className="text-quetzal-blue text-xs font-medium mt-1 hover:underline"
              >
                {historiaExpandida ? 'Leer menos' : 'Leer más...'}
              </button>
            )}
          </div>

          {/* Meta badge */}
          <div>
            <span className={`text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full ${
              tarjeta.meta_tipo === 'unica' ? 'bg-conservation-gold text-forest-green-dark' :
              tarjeta.meta_tipo === 'mensual' ? 'bg-quetzal-blue text-white' :
              'bg-forest-green-light text-forest-green-dark'
            }`}>
              {tarjeta.meta_tipo === 'unica' ? 'Meta única' :
               tarjeta.meta_tipo === 'mensual' ? 'Meta mensual' :
               'Meta anual'}
            </span>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs text-forest-green-dark/60">
              <span>Meta: {formatCurrency(tarjeta.meta_monto)}</span>
            </div>
            <ProgressBar porcentaje={porcentaje} />
            <p className="text-xs text-forest-green-dark/50">
              {formatCurrency(tarjeta.monto_recaudado)} recaudados de {formatCurrency(tarjeta.meta_monto)}
            </p>
          </div>

          {/* Recent donors */}
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-forest-green-dark/50 flex items-center gap-1.5 mb-2">
              <Heart className="h-3 w-3 text-red-400 fill-red-400" />
              Últimos Guardianes
            </p>
            {donantesRecientes.length === 0 ? (
              <p className="text-xs text-forest-green-dark/40 flex items-center gap-1">
                <Star className="h-3 w-3 text-conservation-gold" />
                Sé el primero en apadrinar
              </p>
            ) : (
              <div className="space-y-1.5">
                {donantesRecientes.slice(0, 3).map((d, i) => {
                  const name = d.donante_username ?? d.donante_nombre
                  const avatarColor = getAvatarColor(name)
                  const fecha = new Date(d.created_at).toLocaleDateString('es-MX', {
                    day: 'numeric', month: 'short', year: 'numeric'
                  })
                  return (
                    <div key={i} className="flex items-center gap-2 group/donor relative">
                      <div
                        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 ${avatarColor.startsWith('bg-') ? avatarColor : ''}`}
                        style={!avatarColor.startsWith('bg-') ? { backgroundColor: avatarColor } : {}}
                      >
                        {getInitials(name)}
                      </div>
                      <span className="text-xs text-forest-green-dark/70 flex-1 min-w-0 truncate">
                        <strong>{name}</strong>
                      </span>
                      <span className="text-xs font-bold text-quetzal-blue flex-shrink-0">
                        {formatCurrency(d.monto)}
                      </span>
                      {/* Tooltip on hover */}
                      <div className="absolute left-0 -bottom-7 bg-forest-green-dark text-off-white text-xs px-2 py-1 rounded opacity-0 group-hover/donor:opacity-100 transition-opacity pointer-events-none z-20 whitespace-nowrap">
                        {fecha}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {tarjeta.seccion === 'impulsa_vuelo' && (
            <MapaCondicional tarjeta={tarjeta} />
          )}

          {/* CTA Button */}
          {tarjeta.meta_cumplida ? (
            <button
              disabled
              className="w-full py-4 rounded-xl bg-gray-300 text-gray-500 font-semibold text-lg cursor-not-allowed flex items-center justify-center gap-2"
            >
              ✅ Meta Cumplida
            </button>
          ) : (
            <motion.button
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 3, ease: 'easeInOut' }}
              whileHover={{ scale: 1.03, filter: 'brightness(1.1)' }}
              whileTap={{ scale: 0.98 }}
              onClick={(e) => { e.stopPropagation(); setFormularioAbierto(true) }}
              className="w-full py-4 rounded-xl font-semibold text-lg text-off-white shadow-lg shadow-forest-green-dark/30 flex items-center justify-center gap-2 relative overflow-hidden"
              style={{
                background: 'linear-gradient(135deg, #0B2B26 0%, #2E86AB 100%)',
              }}
            >
              <span>{emoji}</span>
              <span>Apadrinar a {tarjeta.nombre_animal ?? tarjeta.nombre_especie}</span>
            </motion.button>
          )}
        </div>
      </motion.div>

      {/* Donation Drawer */}
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
