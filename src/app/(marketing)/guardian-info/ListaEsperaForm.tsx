'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Bell, Check, Loader2, Send } from 'lucide-react'
import { unirseListaEspera } from '@/app/actions/membresias'

export default function ListaEsperaForm() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [registered, setRegistered] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim() || !email.includes('@')) {
      toast.error('Por favor ingresa un correo electrónico válido')
      return
    }

    setLoading(true)
    try {
      const res = await unirseListaEspera(email.trim())

      if (res.ya_registrado) {
        toast.info('¡Ya estás en la lista de espera! Te avisaremos en cuanto lancemos.')
        setRegistered(true)
      } else if (res.success) {
        toast.success('¡Listo! Te avisaremos cuando estén disponibles')
        setRegistered(true)
        setEmail('')
      } else {
        toast.error(res.error || 'Ocurrió un error al registrarte')
      }
    } catch (err: any) {
      toast.error('No se pudo completar el registro. Inténtalo nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  if (registered) {
    return (
      <div className="bg-conservation-gold/10 border border-conservation-gold/30 rounded-2xl p-6 text-center max-w-md mx-auto">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-conservation-gold/20 text-forest-green-dark mb-3">
          <Check className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-bold text-forest-green-dark mb-1">¡Gracias por tu interés!</h4>
        <p className="text-sm text-forest-green-dark/80">
          Hemos registrado tu correo. Serás de los primeros en conocer el lanzamiento oficial del Programa de Membresías y Beneficios.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-md mx-auto">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="tu-correo@ejemplo.com"
            disabled={loading}
            required
            className="w-full px-4 py-3 rounded-full bg-white border border-forest-green-dark/20 text-forest-green-dark placeholder:text-forest-green-dark/40 focus:outline-none focus:ring-2 focus:ring-conservation-gold focus:border-transparent transition-all text-sm shadow-sm"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border-2 border-conservation-gold bg-transparent text-forest-green-dark font-bold text-sm hover:bg-conservation-gold hover:text-forest-green-dark active:scale-95 transition-all duration-200 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Guardando...</span>
            </>
          ) : (
            <>
              <Bell className="w-4 h-4 text-forest-green-dark" />
              <span>Avísame cuando estén disponibles</span>
            </>
          )}
        </button>
      </div>
    </form>
  )
}
