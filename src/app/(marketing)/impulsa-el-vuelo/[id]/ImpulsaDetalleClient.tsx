'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useInView } from 'framer-motion'
import { createClient } from '@/lib/supabase'
import { verificarPadrino, verificarPadrinoPorSession } from '@/app/actions/liberacion'
import MapaInteractivo from '@/components/donativos/MapaInteractivo'
import MapaEstaticoConBlur from '@/components/donativos/MapaEstaticoConBlur'
import type { Database } from '@/lib/database.types'
import { Heart } from 'lucide-react'

type TarjetaDonacion = Database['public']['Tables']['tarjetas_donacion']['Row']
type Actualizacion = Database['public']['Tables']['actualizaciones_liberacion']['Row']

interface Props {
  tarjeta: TarjetaDonacion
  actualizaciones: Actualizacion[]
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(amount)
}

function ProgressBarBig({ porcentaje, recaudado, meta }: { porcentaje: number, recaudado: number, meta: number }) {
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-40px' })
  const clampedPct = Math.min(porcentaje, 100)

  return (
    <div ref={ref} className="space-y-3 mt-8 bg-white p-6 rounded-2xl shadow-sm border border-forest-green-dark/10">
      <div className="flex flex-col md:flex-row items-baseline justify-between gap-2">
        <h3 className="text-xl font-bold text-forest-green-dark">Progreso para Liberación</h3>
        <span className="text-forest-green-dark/70 font-medium">
          <strong className="text-quetzal-blue text-2xl">{formatCurrency(recaudado)}</strong> de {formatCurrency(meta)} ({Math.round(clampedPct)}%)
        </span>
      </div>
      <div className="h-6 w-full rounded-full bg-gray-200 overflow-hidden shadow-inner">
        <motion.div
          className="h-full rounded-full relative"
          style={{ background: 'linear-gradient(90deg, #D4A843, #2E86AB)' }}
          initial={{ width: 0 }}
          animate={inView ? { width: `${clampedPct}%` } : { width: 0 }}
          transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
        >
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div className="absolute inset-y-0 w-8 bg-white/30 skew-x-12 animate-[shimmer_2s_infinite]" />
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default function ImpulsaDetalleClient({ tarjeta, actualizaciones }: Props) {
  const [isPadrino, setIsPadrino] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  const porcentaje = tarjeta.meta_monto > 0 ? (tarjeta.monto_recaudado / tarjeta.meta_monto) * 100 : 0

  useEffect(() => {
    async function checkPadrino() {
      try {
        // 1. Check local storage first (for anonymous donors)
        const unlockedStorage = localStorage.getItem('unlocked_cards')
        const unlockedCards: string[] = unlockedStorage ? JSON.parse(unlockedStorage) : []
        
        if (unlockedCards.includes(tarjeta.id)) {
          setIsPadrino(true)
          setLoading(false)
          return
        }

        // 2. Check if there's a session_id in the URL (they just came from checkout)
        const params = new URLSearchParams(window.location.search)
        const sessionId = params.get('session_id')
        if (sessionId) {
          const isSessionValid = await verificarPadrinoPorSession(sessionId, tarjeta.id)
          if (isSessionValid) {
            // Save it to localStorage so they don't need the URL next time
            unlockedCards.push(tarjeta.id)
            localStorage.setItem('unlocked_cards', JSON.stringify(unlockedCards))
            
            // Clean up the URL to prevent sharing the link with the session token
            window.history.replaceState({}, document.title, window.location.pathname)
            
            setIsPadrino(true)
            setLoading(false)
            return
          }
        }

        // 3. Fallback to authenticated user checking
        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()

        if (!user || !user.email) {
          setIsPadrino(false)
          setLoading(false)
          return
        }

        const authOk = await verificarPadrino(user.email, tarjeta.id)
        setIsPadrino(authOk)
      } catch (err) {
        console.error('Error verifying padrino:', err)
        setIsPadrino(false)
      } finally {
        setLoading(false)
      }
    }

    checkPadrino()
  }, [tarjeta.id])

  return (
    <div className="min-h-screen bg-off-white pb-24">
      {/* HERO SECTION */}
      <section className="relative h-[50vh] md:h-[60vh] flex items-end">
        {tarjeta.imagen_url ? (
          <Image
            src={tarjeta.imagen_url}
            alt={tarjeta.nombre_especie}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-forest-green-dark" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        
        <div className="relative z-10 w-full max-w-5xl mx-auto px-4 pb-12">
          <span className="inline-block bg-quetzal-blue text-white text-sm font-bold px-3 py-1.5 rounded-full mb-4 shadow-lg">
            🦅 En camino a la libertad 🗺️
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-2 drop-shadow-md">
            {tarjeta.nombre_animal ? `${tarjeta.nombre_animal} (${tarjeta.nombre_especie})` : tarjeta.nombre_especie}
          </h1>
          {tarjeta.area_protegida && (
            <p className="text-lg md:text-xl text-off-white/90 flex items-center gap-2 drop-shadow-sm font-medium">
              📍 Destino: {tarjeta.area_protegida}
            </p>
          )}
        </div>
      </section>

      {/* CONTENT */}
      <main className="max-w-5xl mx-auto px-4 -mt-8 relative z-20 space-y-12">
        {/* Progress */}
        <ProgressBarBig porcentaje={porcentaje} recaudado={tarjeta.monto_recaudado} meta={tarjeta.meta_monto} />

        {/* Dos columnas: Historia/Info + Mapa */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Col 1: Historia */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-forest-green-dark">Su Historia</h2>
            <div className="prose prose-lg text-forest-green-dark/80">
              <p className="whitespace-pre-wrap">{tarjeta.historia || tarjeta.descripcion}</p>
            </div>
          </div>

          {/* Col 2: Mapa */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold text-forest-green-dark">Sigue el Viaje</h2>
            {loading ? (
              <div className="h-[400px] rounded-2xl bg-gray-200 animate-pulse flex items-center justify-center text-forest-green-dark/50 font-medium">
                Cargando mapa...
              </div>
            ) : isPadrino ? (
              <div className="h-[400px] rounded-2xl overflow-hidden shadow-lg border border-forest-green-dark/10">
                <MapaInteractivo tarjeta={tarjeta} height="100%" />
              </div>
            ) : (
              <div className="relative h-[400px] rounded-2xl overflow-hidden shadow-lg border border-forest-green-dark/10 group">
                <MapaEstaticoConBlur />
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-8 text-center backdrop-blur-[2px]">
                  <div className="bg-white/10 p-4 rounded-full mb-4">
                    <span className="text-4xl">🔒</span>
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2">Mapa Exclusivo</h3>
                  <p className="text-off-white/80 mb-6 max-w-xs">
                    Conviértete en Guardián de {tarjeta.nombre_animal || 'esta especie'} para desbloquear el mapa en tiempo real y seguir su ruta hacia la libertad.
                  </p>
                  <Link
                    href={`/donativos#impulsa-el-vuelo`}
                    className="bg-conservation-gold text-forest-green-dark px-6 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform"
                  >
                    Convertirme en Guardián
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* TIMELINE DE ACTUALIZACIONES */}
        <div className="pt-12 border-t border-forest-green-dark/10">
          <h2 className="text-3xl font-bold text-forest-green-dark mb-8 text-center">Bitácora de Vuelo</h2>
          
          {loading ? (
            <div className="py-12 text-center text-forest-green-dark/50 font-medium">Verificando acceso...</div>
          ) : !isPadrino ? (
            <div className="bg-forest-green-dark/5 border border-forest-green-dark/10 rounded-2xl p-12 text-center max-w-2xl mx-auto">
              <span className="text-5xl mb-4 block">📖</span>
              <h3 className="text-xl font-bold text-forest-green-dark mb-2">🔒 Exclusivo para Guardianes</h3>
              <p className="text-forest-green-dark/70 mb-6">
                Los padrinos reciben actualizaciones detalladas semanales sobre el estado de salud, entrenamiento de vuelo y proceso de adaptación de la especie.
              </p>
              <Link
                href={`/donativos#impulsa-el-vuelo`}
                className="inline-flex items-center gap-2 bg-quetzal-blue text-white px-6 py-3 rounded-xl font-bold shadow-md hover:bg-blue-600 transition-colors"
              >
                <Heart className="w-5 h-5" />
                Apadrinar para leer la bitácora
              </Link>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto relative pl-4 md:pl-0">
              {actualizaciones.length === 0 ? (
                <p className="text-center text-forest-green-dark/60 py-12">No hay actualizaciones aún. ¡Pronto subiremos la primera entrada de la bitácora!</p>
              ) : (
                <div className="space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-forest-green-dark/20 before:to-transparent">
                  {actualizaciones.map((act, index) => {
                    const isEven = index % 2 === 0
                    const dateObj = new Date(act.fecha + 'T12:00:00Z') // Fix timezones
                    const formattedDate = dateObj.toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })
                    
                    return (
                      <div key={act.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                        {/* Icon */}
                        <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-off-white bg-quetzal-blue text-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10">
                          📅
                        </div>
                        
                        {/* Card */}
                        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-6 rounded-2xl shadow-sm border border-forest-green-dark/10 hover:shadow-md transition-shadow">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-bold text-lg text-forest-green-dark">{act.titulo}</h4>
                            <time className="text-xs font-semibold text-quetzal-blue">{formattedDate}</time>
                          </div>
                          <p className="text-forest-green-dark/70 text-sm whitespace-pre-wrap leading-relaxed">{act.descripcion}</p>
                          {act.imagen_url && (
                            <div className="mt-4 relative h-48 w-full rounded-lg overflow-hidden">
                              <Image src={act.imagen_url} alt={act.titulo} fill className="object-cover" />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* FIXED BOTTOM CTA FOR VISITORS */}
      {!loading && !isPadrino && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 shadow-[0_-10px_20px_rgba(0,0,0,0.05)] z-50">
          <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <p className="font-bold text-forest-green-dark">Impulsa el vuelo de {tarjeta.nombre_animal || tarjeta.nombre_especie}</p>
              <p className="text-sm text-forest-green-dark/60">Únete a los guardianes que hacen posible su liberación.</p>
            </div>
            <Link
              href={`/donativos#impulsa-el-vuelo`}
              className="bg-conservation-gold text-forest-green-dark px-8 py-3 rounded-full font-bold shadow-lg hover:scale-105 transition-transform shrink-0 w-full sm:w-auto text-center"
            >
              Apadrinar Especie
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
