'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

type Particle = { left: number; size: number; duration: number; delay: number }

// Configuración determinista (idéntica en servidor y cliente) para no romper
// la hidratación. Un LCG de enteros de 32 bits es reproducible bit a bit en
// cualquier motor JS — a diferencia de Math.sin/Math.random, que difieren
// entre Node y el navegador y provocan mismatch de hidratación.
const PARTICLES: Particle[] = (() => {
  let seed = 1337
  const next = () => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff
    return seed / 0x7fffffff // [0, 1)
  }
  // toFixed asegura que la cadena renderizada sea idéntica en ambos lados.
  const round = (n: number, d: number) => Number(n.toFixed(d))
  return Array.from({ length: 18 }, () => ({
    left: round(next() * 100, 2),
    size: round(4 + next() * 8, 2),
    duration: round(4 + next() * 4, 2),
    delay: round(next() * 6, 2),
  }))
})()


function Particles() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {PARTICLES.map((p, i) => (
        <span
          key={i}
          className="hero3d-particle absolute rounded-full bg-off-white/20"
          style={{
            left: `${p.left}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
          }}
        />
      ))}
    </div>
  )
}

export default function Hero3D() {

  return (
    <section className="relative h-[70vh] w-full overflow-hidden md:h-screen">
      {/* Keyframes locales — globals.css no debe modificarse */}
      <style>{`
        @keyframes hero3d-gradient-shift {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes hero3d-rise {
          0%   { transform: translateY(0); opacity: 0; }
          10%  { opacity: 1; }
          90%  { opacity: 1; }
          100% { transform: translateY(-110vh); opacity: 0; }
        }
        @keyframes hero3d-pulse {
          0%, 100% { transform: scale(1); }
          50%      { transform: scale(1.05); }
        }
        .hero3d-gradient {
          background-size: 300% 300%;
          animation: hero3d-gradient-shift 8s ease-in-out infinite;
        }
        .hero3d-particle {
          bottom: -10%;
          animation-name: hero3d-rise;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
        }
        .hero3d-cta {
          animation: hero3d-pulse 2s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .hero3d-gradient, .hero3d-particle, .hero3d-cta { animation: none; }
        }
      `}</style>

      {/* Foto del quetzal de fondo */}
      <div className="absolute inset-0">
        <Image
          src="https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/especies/banner-hero-elnido.webp"
          alt="El Nido Santuario"
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
      </div>

      {/* Gradiente animado de marca sobre la foto (semitransparente para
          conservar el quetzal y dar legibilidad al texto) */}
      <div className="hero3d-gradient absolute inset-0 bg-gradient-to-br from-forest-green-dark/80 via-quetzal-blue/50 to-forest-green-light/70 mix-blend-multiply" />
      {/* Transición inferior hacia el resto de la página */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-forest-green-dark" />

      {/* Partículas flotantes */}
      <Particles />


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
          className="mb-6 max-w-4xl text-3xl font-bold leading-tight text-off-white drop-shadow-lg md:text-6xl"
        >
          Protegemos la vida para que el futuro siga teniendo alas.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="mb-10 max-w-2xl text-lg text-off-white/90 drop-shadow md:text-xl"
        >
          Más de 50 años dedicados a la conservación, protección y cuidado de especies que necesitan una nueva oportunidad.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="pointer-events-auto"
        >
          <Link
            href="/sobre-nosotros"
            className="hero3d-cta inline-block rounded-full bg-conservation-gold px-8 py-4 text-lg font-semibold text-forest-green-dark shadow-lg transition-colors hover:bg-conservation-gold/90"
          >
            Conoce El Nido
          </Link>
        </motion.div>
      </div>
    </section>
  )
}
