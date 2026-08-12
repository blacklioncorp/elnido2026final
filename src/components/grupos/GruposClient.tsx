'use client'

import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PaqueteEducativo } from '@/types/grupos'
import GrupoCard from './GrupoCard'
import CalculadoraCotizacion from './CalculadoraCotizacion'
import { cn } from '@/lib/utils'

interface Props {
  paquetes: PaqueteEducativo[]
}

const NIVELES = [
  { id: 'todos', label: 'Todos' },
  { id: 'preescolar', label: '🐣 Preescolar' },
  { id: 'primaria', label: '🦊 Primaria' },
  { id: 'secundaria', label: '🐺 Secundaria' }, // Añadido secundaria por si acaso
  { id: 'preparatoria', label: '🦅 Preparatoria' },
  { id: 'licenciatura', label: '🦉 Licenciatura' },
]

export default function GruposClient({ paquetes }: Props) {
  const [filtro, setFiltro] = useState<string>('todos')
  const [selectedPaqueteId, setSelectedPaqueteId] = useState<string | undefined>()
  const calculadoraRef = useRef<HTMLDivElement>(null)

  const paquetesFiltrados = paquetes.filter(
    p => filtro === 'todos' || p.nivel === filtro
  )

  const handleSelectPaquete = (id: string) => {
    setSelectedPaqueteId(id)
    if (calculadoraRef.current) {
      calculadoraRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  return (
    <div className="min-h-screen bg-forest-green-dark">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 overflow-hidden">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-forest-green-dark via-forest-green-dark/90 to-quetzal-blue/20" />
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-quetzal-blue/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-conservation-gold/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3" />

        <div className="relative container mx-auto text-center max-w-4xl z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-block py-1 px-3 rounded-full bg-white/10 text-conservation-gold text-sm font-semibold mb-6 border border-white/10">
              Programas Escolares
            </span>
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-off-white mb-6 leading-tight">
              Experiencias Educativas en <span className="text-conservation-gold">El Nido</span>
            </h1>
            <p className="text-lg md:text-xl text-off-white/80 mb-10 max-w-2xl mx-auto leading-relaxed">
              Paquetes diseñados para escuelas, desde preescolar hasta universidad. Transforma tu visita en un aprendizaje vivencial e inolvidable.
            </p>
            
            <button
              onClick={() => {
                if (calculadoraRef.current) {
                  calculadoraRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }
              }}
              className="bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-bold text-lg py-4 px-8 rounded-full transition-all duration-300 hover:scale-105 shadow-[0_0_40px_rgba(212,168,67,0.3)]"
            >
              Solicitar cotización
            </button>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="relative z-20 container mx-auto px-4 pb-24 -mt-8">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
          {NIVELES.map(n => (
            <button
              key={n.id}
              onClick={() => setFiltro(n.id)}
              className={cn(
                "px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border",
                filtro === n.id
                  ? "bg-conservation-gold text-forest-green-dark border-conservation-gold shadow-lg shadow-conservation-gold/20"
                  : "bg-forest-green-light/30 text-off-white/70 border-white/10 hover:bg-white/10 hover:text-off-white"
              )}
            >
              {n.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8 mb-24"
        >
          <AnimatePresence mode="popLayout">
            {paquetesFiltrados.map(paquete => (
              <motion.div
                key={paquete.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
              >
                <GrupoCard 
                  paquete={paquete} 
                  onSelect={handleSelectPaquete} 
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>

        {paquetesFiltrados.length === 0 && (
          <div className="text-center py-20 text-off-white/50">
            No se encontraron paquetes para este nivel.
          </div>
        )}

        {/* Calculator Section */}
        <div ref={calculadoraRef} className="scroll-mt-32 max-w-5xl mx-auto">
          <CalculadoraCotizacion paquetes={paquetes} selectedPaqueteId={selectedPaqueteId} />
        </div>

      </section>
    </div>
  )
}
