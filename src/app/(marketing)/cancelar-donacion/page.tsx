'use client'

import { useState } from 'react'
import { solicitarMagicLink } from '@/app/actions/portal-donaciones'
import { Heart, Mail, ArrowRight, Loader2 } from 'lucide-react'

export default function CancelarDonacionPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setLoading(true)
    setMessage('')
    setError('')

    const res = await solicitarMagicLink(email)
    
    if (res.error) {
      setError(res.error)
    } else if (res.success) {
      setMessage(res.success)
    }
    
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-off-white pt-32 pb-20 px-4">
      <div className="max-w-md mx-auto">
        
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-forest-green-dark/5 overflow-hidden">
          
          {/* Header */}
          <div className="bg-forest-green-dark px-8 py-10 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-[url('/textures/noise.png')] opacity-10 mix-blend-overlay"></div>
            <Heart className="w-12 h-12 text-conservation-gold mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-off-white font-display">Gestiona tu donación</h1>
            <p className="text-off-white/80 mt-2 text-sm">
              Accede a tu portal seguro sin contraseñas
            </p>
          </div>

          {/* Body */}
          <div className="p-8">
            {message ? (
              <div className="text-center py-6">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8" />
                </div>
                <h3 className="text-lg font-bold text-forest-green-dark mb-2">Revisa tu correo</h3>
                <p className="text-forest-green-light/80 text-sm">
                  {message}
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-forest-green-dark mb-2">
                    Ingresa el email con el que donaste
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-forest-green-light/40" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="tu@email.com"
                      className="block w-full pl-11 pr-4 py-3 bg-off-white/50 border border-forest-green-light/10 rounded-xl text-forest-green-dark placeholder-forest-green-light/40 focus:ring-2 focus:ring-conservation-gold focus:border-conservation-gold transition-all"
                    />
                  </div>
                </div>

                {error && (
                  <p className="text-red-500 text-sm bg-red-50 p-3 rounded-lg border border-red-100">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 bg-conservation-gold hover:bg-conservation-gold-dark text-forest-green-dark font-bold py-3.5 px-4 rounded-xl transition-all disabled:opacity-70 shadow-lg shadow-conservation-gold/20"
                >
                  {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Enviar link de acceso
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
                
                <p className="text-xs text-center text-forest-green-light/60 mt-4 flex items-center justify-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Te enviaremos un enlace mágico que expira en 30 minutos
                </p>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  )
}
