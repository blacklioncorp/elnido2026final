'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { Menu, X, PawPrint, GraduationCap, Heart, Gift } from 'lucide-react'

const MENU_ITEMS = [
  { href: '/fauna', label: 'Fauna', icon: PawPrint },
  { href: '/grupos', label: 'Grupos', icon: GraduationCap },
  { href: '/donativos', label: 'Apadrinar', icon: Heart },
  { href: '/donar', label: 'Donar', icon: Gift },
]

export default function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="md:hidden">
      {/* Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* FAB & Bubbles */}
      <div className="fixed bottom-24 right-6 z-50 flex flex-col-reverse items-end gap-4">
        {/* Main FAB */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative w-[56px] h-[56px] flex items-center justify-center rounded-full text-white shadow-xl shadow-black/30 transition-transform active:scale-95 bg-gradient-to-br from-forest-green-dark to-quetzal-blue"
        >
          <motion.div
            initial={false}
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </motion.div>
        </button>

        {/* Bubbles */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial="hidden"
              animate="visible"
              exit="hidden"
              className="flex flex-col-reverse items-end gap-3 mb-2"
            >
              {MENU_ITEMS.map((item, index) => (
                <motion.div
                  key={item.href}
                  custom={index}
                  variants={{
                    hidden: { opacity: 0, y: 20, scale: 0.8 },
                    visible: (i) => ({
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: {
                        type: 'spring',
                        stiffness: 300,
                        damping: 20,
                        delay: i * 0.05,
                      }
                    })
                  }}
                  className="flex items-center gap-3"
                >
                  <span className="bg-white/90 text-forest-green-dark text-xs font-bold px-3 py-1.5 rounded-lg shadow-sm">
                    {item.label}
                  </span>
                  <Link
                    href={item.href}
                    onClick={() => setIsOpen(false)}
                    className="w-[50px] h-[50px] bg-off-white text-forest-green-dark flex items-center justify-center rounded-full shadow-lg hover:bg-white transition-colors"
                  >
                    <item.icon className="w-5 h-5" />
                  </Link>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
