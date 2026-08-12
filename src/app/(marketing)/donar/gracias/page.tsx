'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Home, Heart } from 'lucide-react'
import Link from 'next/link'

function DonarGraciasContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (!sessionId) {
      router.push('/donar')
      return
    }
    setLoading(false)
  }, [searchParams, router])

  if (loading) {
    return (
      <div className="min-h-screen py-32 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-conservation-gold"></div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] py-32 px-4 flex items-center justify-center">
      <div className="max-w-xl mx-auto text-center">
        <div className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full bg-conservation-gold/10 relative">
          <div className="absolute inset-0 rounded-full bg-conservation-gold/20 animate-ping"></div>
          <CheckCircle2 className="h-12 w-12 text-conservation-gold relative z-10" />
        </div>
        
        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-off-white mb-6">
          ¡Gracias por tu donación!
        </h1>
        
        <p className="text-xl text-off-white/80 mb-8 leading-relaxed">
          Tu contribución ayudará enormemente a proteger las especies y hábitats del santuario El Nido.
          Hemos enviado un recibo a tu correo electrónico.
        </p>

        <div className="bg-forest-green-light/30 backdrop-blur-md rounded-2xl p-8 border border-white/10 mb-10 shadow-xl">
          <Heart className="h-10 w-10 text-conservation-gold mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-off-white mb-2">Eres un Guardián</h3>
          <p className="text-off-white/70">
            Cada aporte suma al esfuerzo colectivo por la conservación. ¡Tu ayuda hace la diferencia!
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="flex items-center justify-center gap-2 bg-white/10 hover:bg-white/20 text-off-white px-8 py-4 rounded-xl font-bold transition-all hover:scale-105"
          >
            <Home className="h-5 w-5" />
            Volver al Inicio
          </Link>
          <Link
            href="/donativos"
            className="flex items-center justify-center gap-2 bg-conservation-gold text-forest-green-dark hover:bg-conservation-gold/90 px-8 py-4 rounded-xl font-bold transition-all hover:scale-105 shadow-lg shadow-conservation-gold/20"
          >
            <Heart className="h-5 w-5" />
            Ver Especies para Apadrinar
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function DonarGraciasPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen py-32 px-4 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-conservation-gold"></div>
      </div>
    }>
      <DonarGraciasContent />
    </Suspense>
  )
}
