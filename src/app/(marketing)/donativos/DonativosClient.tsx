'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { Heart, ExternalLink } from 'lucide-react'
import type { Database } from '@/lib/database.types'
import TarjetaDonacion from '@/components/donativos/TarjetaDonacion'
import VideoTestimonial from '@/components/home/VideoTestimonial'

type TarjetaDonacionRow = Database['public']['Tables']['tarjetas_donacion']['Row']

interface Donante {
  donante_username: string | null
  donante_nombre: string
  monto: number
  created_at: string
}

interface DonativosClientProps {
  tarjetas: TarjetaDonacionRow[]
  donantesMap: Record<string, Donante[]>
  videoUrl?: string | null
}

import type { Variants } from 'framer-motion'

const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.12,
    },
  },
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 200, damping: 25 } },
}

export default function DonativosClient({ tarjetas, donantesMap, videoUrl }: DonativosClientProps) {
  return (
    <div className="min-h-screen bg-off-white">
      {/* ── HERO ── */}
      <section
        className="relative px-4 py-24 text-center overflow-hidden"
        style={{
          background: 'linear-gradient(160deg, #0B2B26 0%, #1A4A3A 50%, #0B2B26 100%)',
        }}
      >
        {/* Decorative circles */}
        <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-conservation-gold/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-quetzal-blue/5 blur-3xl pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="relative z-10 max-w-3xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 bg-conservation-gold/15 border border-conservation-gold/30 text-conservation-gold text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            <Heart className="h-3 w-3 fill-conservation-gold" />
            Programa Guardián
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-off-white mb-5 leading-tight tracking-tight">
            Apadrina una{' '}
            <span
              className="relative"
              style={{
                background: 'linear-gradient(90deg, #D4A843, #2E86AB)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Especie
            </span>
          </h1>
          <p className="text-off-white/70 text-lg md:text-xl max-w-xl mx-auto leading-relaxed">
            Elige una historia, hazte Guardián, sigue su progreso
          </p>
        </motion.div>

        {/* Wave divider */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
            <path d="M0 60V30C360 0 720 60 1080 30L1440 0V60H0Z" fill={videoUrl ? "#0B2B26" : "#F7F3E8"} />
          </svg>
        </div>
      </section>

      <VideoTestimonial
        videoUrl={videoUrl}
        frase="Tu donativo hace historias como esta posibles"
        ctaTexto="Apadrinar una especie"
        ctaLink="#tarjetas"
      />

      {/* ── CARDS SECTION ── */}
      <section id="tarjetas" className="max-w-7xl mx-auto px-4 py-16">
        {tarjetas.length === 0 ? (
          /* Empty State */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-24 max-w-md mx-auto"
          >
            <div className="text-6xl mb-6">🦎</div>
            <h2 className="text-2xl font-bold text-forest-green-dark mb-3">
              Pronto nuevas especies
            </h2>
            <p className="text-forest-green-dark/60 mb-8">
              Estamos preparando nuevas historias de conservación. ¡Síguenos y sé el primero en enterarte!
            </p>
            <Link
              href="/donar"
              className="inline-flex items-center gap-2 bg-forest-green-dark text-off-white font-bold px-6 py-3 rounded-xl hover:bg-forest-green-light transition-colors"
            >
              <Heart className="h-4 w-4" />
              Hacer una donación general
              <ExternalLink className="h-4 w-4" />
            </Link>
          </motion.div>
        ) : (
          <>
            <div className="text-center mb-12">
              <p className="text-forest-green-dark/60 text-sm font-medium">
                {tarjetas.length} especie{tarjetas.length !== 1 ? 's' : ''} esperando tu apoyo
              </p>
            </div>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {tarjetas.map((tarjeta) => (
                <motion.div key={tarjeta.id} variants={cardVariants}>
                  <TarjetaDonacion
                    tarjeta={tarjeta}
                    donantesRecientes={donantesMap[tarjeta.id] ?? []}
                  />
                </motion.div>
              ))}
            </motion.div>

            {/* Footer CTA */}
            <div className="text-center mt-16 pt-8 border-t border-forest-green-dark/10">
              <p className="text-forest-green-dark/50 text-sm mb-4">
                ¿Prefieres una donación general al santuario?
              </p>
              <Link
                href="/donar"
                className="inline-flex items-center gap-2 text-quetzal-blue font-semibold text-sm hover:underline"
              >
                Ir a donación general →
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  )
}
