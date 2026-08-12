'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, ChevronDown, CheckCircle2, ChevronRight, X } from 'lucide-react'
import LightboxImage from '@/components/ui/LightboxImage'
import { PaqueteEducativo } from '@/types/grupos'
import { cn } from '@/lib/utils'

interface Props {
  paquete: PaqueteEducativo
  onSelect: (paqueteId: string) => void
}

const nivelColors = {
  preescolar: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  primaria: 'bg-green-500/10 text-green-500 border-green-500/20',
  secundaria: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  preparatoria: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  licenciatura: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
}

const gradientByNivel = {
  preescolar: 'from-pink-500/20 to-rose-500/20',
  primaria: 'from-green-500/20 to-emerald-500/20',
  secundaria: 'from-yellow-500/20 to-orange-500/20',
  preparatoria: 'from-blue-500/20 to-indigo-500/20',
  licenciatura: 'from-purple-500/20 to-fuchsia-500/20',
}

export default function GrupoCard({ paquete, onSelect }: Props) {
  const [expanded, setExpanded] = useState(false)

  return (
    <motion.div 
      layout
      className="bg-forest-green-light/30 backdrop-blur-md border border-white/10 rounded-2xl overflow-hidden shadow-xl"
    >
      <div 
        className={cn(
          "h-48 relative overflow-hidden bg-gradient-to-br",
          gradientByNivel[paquete.nivel]
        )}
      >
        {paquete.imagen_url ? (
          <LightboxImage 
            src={paquete.imagen_url} 
            alt={paquete.nombre} 
            fill
            className="object-cover opacity-80 mix-blend-overlay"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center opacity-30">
            <span className="text-6xl text-white">🪶</span>
          </div>
        )}
        <div className="absolute top-4 left-4">
          <span className={cn(
            "px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full border",
            nivelColors[paquete.nivel]
          )}>
            {paquete.nivel}
          </span>
        </div>
      </div>

      <div className="p-6">
        <h3 className="text-2xl font-bold text-off-white mb-2">{paquete.nombre}</h3>
        <p className="text-off-white/60 text-sm mb-4 line-clamp-2">{paquete.descripcion}</p>
        
        <div className="flex items-center gap-4 mb-6">
          <div className="flex items-center gap-1.5 text-conservation-gold">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-semibold">{paquete.duracion_horas} hrs</span>
          </div>
          <div className="text-lg font-bold text-quetzal-blue">
            ${paquete.precio_por_persona.toFixed(2)} MXN
          </div>
        </div>

        <div className="flex gap-3">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-off-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            {expanded ? 'Ver menos' : 'Ver más'}
            <ChevronDown className={cn("w-4 h-4 transition-transform", expanded && "rotate-180")} />
          </button>
          <button 
            onClick={() => onSelect(paquete.id)}
            className="flex-1 px-4 py-2 bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark rounded-xl text-sm font-bold flex items-center justify-center gap-1 transition-colors"
          >
            Cotizar
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-white/10 bg-black/20"
          >
            <div className="p-6 space-y-6">
              {/* Descripción */}
              {paquete.descripcion && (
                <div>
                  <h4 className="text-off-white font-semibold mb-2">Sobre la experiencia</h4>
                  <p className="text-off-white/70 text-sm leading-relaxed">{paquete.descripcion}</p>
                </div>
              )}

              {/* Qué Incluye */}
              {paquete.que_incluye && paquete.que_incluye.length > 0 && (
                <div>
                  <h4 className="text-off-white font-semibold mb-3">¿Qué incluye?</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {paquete.que_incluye.map((item, i) => (
                      <div key={i} className="flex gap-3 bg-white/5 p-3 rounded-lg">
                        <CheckCircle2 className="w-5 h-5 text-conservation-gold flex-shrink-0" />
                        <p className="text-off-white text-sm font-medium">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Qué NO Incluye */}
              {paquete.que_no_incluye && paquete.que_no_incluye.length > 0 && (
                <div>
                  <h4 className="text-off-white font-semibold mb-3">No Incluye</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {paquete.que_no_incluye.map((item, i) => (
                      <div key={i} className="flex gap-3 bg-white/5 p-3 rounded-lg">
                        <X className="w-5 h-5 text-red-400 flex-shrink-0" />
                        <p className="text-off-white text-sm font-medium">{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Itinerario */}
              {paquete.itinerario && Array.isArray(paquete.itinerario) && paquete.itinerario.length > 0 && (
                <div>
                  <h4 className="text-off-white font-semibold mb-3">Itinerario General</h4>
                  <div className="bg-white/5 rounded-lg p-1">
                    {paquete.itinerario.map((item: any, i: number) => (
                      <div key={i} className="flex justify-between py-2 px-3 border-b border-white/5 last:border-0 text-sm">
                        <span className="text-off-white/80">{item?.actividad || 'Actividad'}</span>
                        <span className="text-off-white/50">{item?.duracion || ''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
