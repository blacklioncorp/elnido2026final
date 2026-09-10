'use client'

import { MapPin } from 'lucide-react'
import MapaVisitanos from './MapaVisitanos'
import BotonesTransporte from './BotonesTransporte'

interface VisitanosProps {
  className?: string
}

export default function Visitanos({ className = '' }: VisitanosProps) {
  return (
    <section className={`w-full py-8 md:py-12 ${className}`}>
      <div className="w-full max-w-5xl mx-auto space-y-8">
        {/* Header de Sección */}
        <div className="text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="text-conservation-gold font-semibold tracking-widest uppercase text-sm mb-2 flex items-center justify-center md:justify-start gap-1.5">
              <span>📍</span>
              <span>Encuéntranos</span>
            </p>
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tighter text-off-white">
              Visítanos
            </h2>
          </div>
          <div className="flex items-start md:items-center justify-center md:justify-start gap-2.5 text-off-white/90 bg-forest-green-light/40 border border-white/10 px-4 py-3 rounded-2xl backdrop-blur-sm shadow-sm max-w-lg">
            <MapPin className="h-5 w-5 text-conservation-gold shrink-0 mt-0.5 md:mt-0" />
            <div className="text-left text-sm md:text-base">
              <span className="font-semibold block text-off-white">Santuario de Aves El Nido</span>
              <span className="text-off-white/70 text-xs md:text-sm">C. Progreso S/N, Santa Barbara, 56538 Ixtapaluca, Méx.</span>
            </div>
          </div>
        </div>

        {/* Contenedor del Mapa Interactivo */}
        <div className="rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-forest-green-light/20 backdrop-blur-sm p-2 md:p-3">
          <MapaVisitanos />
        </div>

        {/* Sección de Rutas y Transporte */}
        <div className="bg-forest-green-light/30 border border-white/10 rounded-3xl p-6 md:p-8 backdrop-blur-sm space-y-6 shadow-lg">
          <div className="text-center space-y-1">
            <p className="text-xs font-bold uppercase tracking-wider text-conservation-gold">
              ¿Cómo llegar?
            </p>
            <h3 className="text-xl md:text-2xl font-bold text-off-white">
              Santuario de Aves El Nido
            </h3>
            <p className="text-sm text-off-white/70">
              C. Progreso S/N, Santa Barbara, Ixtapaluca
            </p>
          </div>

          <BotonesTransporte />

          <p className="text-center text-xs text-off-white/50 pt-1">
            Elige tu plataforma favorita
          </p>
        </div>
      </div>
    </section>
  )
}
