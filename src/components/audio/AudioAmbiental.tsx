'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Headphones, X, Play, Pause } from 'lucide-react'
import { createClient } from '@/lib/supabase'

export default function AudioAmbiental() {
  const [isOpen, setIsOpen] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [audioUrl, setAudioUrl] = useState('https://cdn.pixabay.com/download/audio/2022/03/10/audio_0f60a6b4b3.mp3')
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    // Load Audio config from Supabase configuracion table
    const load = async () => {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('configuracion')
          .select('valor')
          .eq('clave', 'audio_ambiental_url')
          .single()

        if (data && data.valor) {
          setAudioUrl(data.valor)
        }
      } catch {
        // Use default silently
      }
    }
    load()
  }, [])

  const togglePlay = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause()
      } else {
        audioRef.current.play()
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleClose = () => {
    if (audioRef.current && isPlaying) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
    setIsOpen(false)
  }

  return (
    <>
      <audio ref={audioRef} src={audioUrl} loop />

      <div className="fixed bottom-40 right-6 z-50 flex flex-col items-end">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute bottom-16 right-0 w-72 bg-off-white border border-forest-green-dark/10 rounded-2xl shadow-2xl p-4 overflow-hidden origin-bottom-right"
            >
              <div className="flex items-center justify-between mb-3 border-b border-forest-green-dark/10 pb-2">
                <div className="flex items-center gap-2 text-forest-green-dark font-bold">
                  <Headphones size={18} />
                  <span>Sonidos del Santuario</span>
                </div>
                <button
                  onClick={handleClose}
                  className="text-forest-green-dark/50 hover:text-forest-green-dark transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex items-center gap-4 py-2">
                <button
                  onClick={togglePlay}
                  className="w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-full bg-forest-green-dark text-white hover:bg-forest-green-light transition-colors"
                >
                  {isPlaying ? <Pause size={24} /> : <Play size={24} className="ml-1" />}
                </button>
                <div className="flex-1">
                  <p className="text-sm text-forest-green-dark font-medium leading-tight">
                    Canto de aves, selva y viento
                  </p>
                  <div className="mt-2 h-1 bg-forest-green-dark/10 rounded-full overflow-hidden relative">
                    {isPlaying && (
                      <motion.div
                        className="absolute inset-y-0 left-0 bg-forest-green-dark"
                        initial={{ width: '0%' }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                      />
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-[56px] h-[56px] flex items-center justify-center rounded-full bg-forest-green-light text-white shadow-xl shadow-black/30 transition-transform active:scale-95 focus:outline-none hover:scale-105"
          title="Escuchar el santuario"
        >
          <Headphones size={24} />
        </button>
      </div>
    </>
  )
}
