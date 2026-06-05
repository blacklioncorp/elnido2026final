'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

export default function MarketingHero() {
  return (
    <section className="relative flex items-center justify-center min-h-screen overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <Image
          src="/images/quetzal.png"
          alt="Quetzal en su hábitat natural"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-forest-green-dark/70 via-forest-green-dark/50 to-forest-green-dark" />
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 rounded-full bg-conservation-gold/40"
            style={{
              left: `${15 + i * 15}%`,
              top: `${20 + (i % 3) * 25}%`,
            }}
            animate={{ y: [-20, 20, -20], opacity: [0.2, 0.8, 0.2] }}
            transition={{ duration: 4 + i, repeat: Infinity, ease: 'easeInOut', delay: i * 0.7 }}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-5xl mx-auto text-center px-4">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-conservation-gold font-semibold tracking-widest uppercase text-sm mb-6"
        >
          Santuario de Fauna Mexicana en Peligro de Extinción
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-5xl md:text-7xl lg:text-8xl font-extrabold text-white tracking-tighter leading-none mb-6"
        >
          Conserva.{' '}
          <span className="text-conservation-gold">Educa.</span>
          {' '}Inspira.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-lg md:text-xl text-off-white/80 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Únete a nosotros en la misión de proteger la increíble biodiversidad
          de México. Conoce a nuestros residentes y descubre cómo puedes
          hacer la diferencia.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Link
            href="/donar"
            className="w-full sm:w-auto bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-bold py-4 px-10 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-conservation-gold/20 text-lg"
          >
            Dona Ahora
          </Link>
          <Link
            href="/apadrinar"
            className="w-full sm:w-auto bg-white/10 hover:bg-white/20 backdrop-blur-sm border border-white/20 hover:border-white/40 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 text-lg"
          >
            Apadrina una Especie
          </Link>
        </motion.div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-20 grid grid-cols-3 gap-4 max-w-xl mx-auto"
        >
          {[
            { value: '12+', label: 'Especies protegidas' },
            { value: '340+', label: 'Guardianes activos' },
            { value: '8 años', label: 'De conservación' },
          ].map((stat) => (
            <div key={stat.label} className="text-center p-4 bg-white/5 backdrop-blur-sm rounded-xl border border-white/10">
              <div className="text-2xl font-extrabold text-conservation-gold">{stat.value}</div>
              <div className="text-xs text-off-white/60 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10"
        animate={{ y: [0, 8, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-white/30 rounded-full flex justify-center pt-2">
          <div className="w-1 h-2 bg-white/50 rounded-full" />
        </div>
      </motion.div>
    </section>
  )
}
