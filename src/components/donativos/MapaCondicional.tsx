'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { verificarPadrino } from '@/app/actions/liberacion'
import MapaInteractivo from './MapaInteractivo'
import MapaEstaticoConBlur from './MapaEstaticoConBlur'
import type { Database } from '@/lib/database.types'

type TarjetaDonacion = Database['public']['Tables']['tarjetas_donacion']['Row']

interface MapaCondicionalProps {
  tarjeta: TarjetaDonacion
}

export default function MapaCondicional({ tarjeta }: MapaCondicionalProps) {
  const [isPadrino, setIsPadrino] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function checkPadrino() {
      try {
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

  if (loading) {
    return <div className="h-48 rounded-xl bg-gray-200 animate-pulse flex items-center justify-center text-sm text-forest-green-dark/50">Cargando mapa...</div>
  }

  if (isPadrino) {
    return (
      <div className="mt-4">
        <MapaInteractivo tarjeta={tarjeta} height="192px" />
      </div>
    )
  }

  return (
    <div className="relative h-48 rounded-xl overflow-hidden mt-4 shadow-sm border border-forest-green-dark/10">
      <MapaEstaticoConBlur />
      <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center p-4">
        <p className="text-off-white font-bold tracking-wide">🔒 Contenido exclusivo</p>
        <p className="text-xs text-off-white/80 mt-1 text-center max-w-[200px]">Conviértete en Guardián para seguir el viaje y ver el mapa</p>
      </div>
    </div>
  )
}
