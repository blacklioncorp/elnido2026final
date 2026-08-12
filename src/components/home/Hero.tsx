'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

const HERO_IMAGES = [
  "https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/especies/Quetzal-Chucho.svg",
  "https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/especies/Guacamaya-Jacinta.svg",
  "https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/especies/Flamingo.svg",
  "https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/especies/Jaguar-(Samba).svg",
  "https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/especies/tucan.webp"
]

const Hero = () => {
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % HERO_IMAGES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <section className="relative flex items-center justify-center h-screen overflow-hidden bg-forest-green-dark">
      {/* Background Images Carousel */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence initial={false}>
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            <Image
              src={HERO_IMAGES[currentIndex]}
              alt={`Especie ${currentIndex + 1}`}
              fill={true}
              priority={currentIndex === 0}
              className="object-cover opacity-60 mix-blend-screen"
            />
          </motion.div>
        </AnimatePresence>
        <div className="absolute inset-0 bg-gradient-to-b from-forest-green-dark/40 via-forest-green-dark/60 to-forest-green-dark"></div>
      </div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 w-full max-w-5xl mx-auto text-center px-4 md:px-8 mt-20"
      >
        <div className="bg-forest-green-dark/30 backdrop-blur-md rounded-3xl p-8 md:p-12 border border-white/10 shadow-2xl">
          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-5xl md:text-7xl font-extrabold text-white drop-shadow-lg tracking-tight"
          >
            Conserva el Vuelo, Salva una Vida
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-6 text-lg md:text-2xl text-off-white/90 max-w-3xl mx-auto leading-relaxed"
          >
            Tu apoyo es crucial para proteger a nuestras especies en peligro. Sé un guardián de la fauna mexicana y ayúdanos a construir un futuro donde puedan prosperar.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.8 }}
            className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            <Link href="/apadrinar" className="w-full sm:w-auto px-8 py-4 text-lg font-bold text-forest-green-dark bg-conservation-gold rounded-full hover:bg-white transition-colors duration-300 transform hover:scale-105 shadow-[0_0_20px_rgba(242,192,41,0.4)]">
              Apadrina una Especie
            </Link>
            <Link href="/donar" className="w-full sm:w-auto px-8 py-4 text-lg font-bold text-white bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition-all duration-300">
              Hacer Donativo
            </Link>
          </motion.div>
        </div>
      </motion.div>
      
      {/* Decorative Wave at bottom */}
      <div className="absolute bottom-0 left-0 right-0 w-full overflow-hidden leading-none z-10 text-forest-green-dark">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="relative block w-full h-16 md:h-24 transform rotate-180">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="currentColor"></path>
        </svg>
      </div>
    </section>
  )
}

export default Hero
