'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'

const Hero = () => {
  return (
    <section className="relative flex items-center justify-center h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-forest-green-dark opacity-50"></div>
        <Image
          src="https://images.unsplash.com/photo-1555169062-013468b47731?q=80&w=1974&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
          alt="Quetzal"
          fill={true}
          style={{objectFit: "cover"}}
        />
      </div>

      {/* Glassmorphism container for the content */}
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="relative z-10 max-w-4xl mx-auto text-center p-8 bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20"
      >
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-5xl md:text-7xl font-extrabold text-white drop-shadow-lg"
        >
          Conserva el Vuelo, Salva una Vida
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-4 text-lg md:text-xl text-off-white max-w-2xl mx-auto"
        >
          Tu apoyo es crucial para proteger al Quetzal y otras especies en peligro. Sé un guardián de la fauna mexicana y ayúdanos a construir un futuro donde puedan prosperar.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="mt-8"
        >
          <Link href="/apadrinar" className="inline-block px-8 py-4 text-lg font-bold text-white bg-conservation-gold rounded-full hover:bg-quetzal-blue transition-colors duration-300 transform hover:scale-105 shadow-lg">
            Apadrina un Quetzal
          </Link>
        </motion.div>
      </motion.div>

      {/* Placeholder for 3D model - can be a separate component */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-1/3 z-0">
        {/* This div will house the canvas for the 3D model */}
        {/* For now, it's just a placeholder area */}
      </div>
    </section>
  )
}

export default Hero
