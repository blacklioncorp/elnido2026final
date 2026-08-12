'use client'

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'

const FALLBACK_IMAGE = 'https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/especies/banner-hero-elnido.webp'
const SLIDE_DURATION = 6000 // 6 seconds per slide
const TRANSITION_DURATION = 2.5 // 2.5s fade

interface Props {
  initialImages?: string[]
}

export default function HeroCinematico({ initialImages = [] }: Props) {
  const images = initialImages.length > 0 ? initialImages : [FALLBACK_IMAGE]
  const [currentIndex, setCurrentIndex] = useState(0)

  useEffect(() => {
    if (images.length <= 1) return

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, SLIDE_DURATION)

    return () => clearInterval(timer)
  }, [images.length])

  return (
    <section className="relative h-[70vh] w-full overflow-hidden md:h-screen">
      <style>{`
        @keyframes hero-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
        .hero-cta {
          animation: hero-pulse 2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero-cta { animation: none; }
        }
      `}</style>

      {/* Background Images */}
      {images.length > 0 && (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1, scale: 1.1 }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: TRANSITION_DURATION, ease: "easeInOut" },
              scale: { duration: SLIDE_DURATION / 1000 + TRANSITION_DURATION, ease: "linear" }
            }}
            className="absolute inset-0 origin-center"
          >
            <Image
              src={images[currentIndex]}
              alt={`El Nido Especie ${currentIndex + 1}`}
              fill
              priority={currentIndex === 0}
              sizes="100vw"
              className="object-cover"
            />
          </motion.div>
        </AnimatePresence>
      )}

      {/* Overlay degradado para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-br from-forest-green-dark/80 via-quetzal-blue/50 to-forest-green-light/70 mix-blend-multiply z-[1]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-forest-green-dark z-[1]" />

      {/* Texto overlay */}
      <div className="pointer-events-none relative z-10 flex h-full flex-col items-center justify-center px-4 text-center">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-4 text-sm uppercase tracking-widest text-conservation-gold"
        >
          Bienvenido a El Nido
        </motion.p>
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8 max-w-3xl text-2xl font-bold leading-tight text-off-white drop-shadow-lg md:text-6xl"
        >
          El último refugio de las aves más amenazadas de México
        </motion.h1>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="pointer-events-auto"
        >
          <Link
            href="/apadrinar"
            className="hero-cta inline-block rounded-full bg-conservation-gold px-8 py-4 text-lg font-semibold text-forest-green-dark shadow-lg transition-colors hover:bg-conservation-gold/90"
          >
            Conviértete en Guardián
          </Link>
        </motion.div>
      </div>

      {/* Progress Bar (Segmentos) */}
      {images.length > 1 && (
        <div className="absolute bottom-8 left-0 right-0 z-20 flex justify-center gap-2 px-4">
          {images.map((_, idx) => (
            <div
              key={idx}
              className="h-1 flex-1 max-w-16 rounded-full bg-white/20 overflow-hidden"
            >
              {idx === currentIndex && (
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ duration: SLIDE_DURATION / 1000, ease: "linear" }}
                  className="h-full bg-conservation-gold"
                />
              )}
              {idx < currentIndex && (
                <div className="h-full w-full bg-conservation-gold opacity-50" />
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
