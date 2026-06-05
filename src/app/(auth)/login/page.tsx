'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { toast } from 'sonner'
import { Eye, EyeOff, LogIn } from 'lucide-react'

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // TODO: await supabase.auth.signInWithPassword({ email, password })
    await new Promise((r) => setTimeout(r, 1200))
    toast.error('Autenticación no configurada. Conecta Supabase para habilitar el login.')
    setLoading(false)
  }

  const handleGoogleLogin = () => {
    // TODO: await supabase.auth.signInWithOAuth({ provider: 'google' })
    toast.info('Login con Google disponible cuando conectes Supabase.')
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel - image */}
      <div className="hidden lg:flex lg:w-1/2 relative">
        <Image
          src="/images/jaguar.png"
          alt="Jaguar en El Nido"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-forest-green-dark" />
        <div className="absolute bottom-12 left-10 right-10">
          <p className="text-conservation-gold font-semibold tracking-widest uppercase text-xs mb-3">El Nido</p>
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Protege la fauna<br />mexicana con nosotros
          </h2>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="mb-10">
            <Link href="/" className="inline-flex items-center gap-2 text-off-white/60 hover:text-off-white transition-colors text-sm mb-8">
              ← Volver al inicio
            </Link>
            <h1 className="text-3xl font-extrabold text-off-white tracking-tight">Iniciar Sesión</h1>
            <p className="text-off-white/50 mt-2">Accede a tu panel de guardián</p>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-off-white font-medium transition-all duration-200 mb-6"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Continuar con Google
          </button>

          <div className="flex items-center gap-3 mb-6">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-off-white/30 text-sm">o con tu correo</span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-off-white/70 mb-1.5">Correo Electrónico</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-conservation-gold focus:outline-none focus:ring-1 focus:ring-conservation-gold text-off-white placeholder-off-white/30 transition-colors"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-sm font-medium text-off-white/70">Contraseña</label>
                <Link href="#" className="text-xs text-conservation-gold hover:underline">¿Olvidaste tu contraseña?</Link>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-12 rounded-xl bg-white/10 border border-white/20 focus:border-conservation-gold focus:outline-none focus:ring-1 focus:ring-conservation-gold text-off-white placeholder-off-white/30 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-off-white/40 hover:text-off-white/80 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-conservation-gold hover:bg-conservation-gold/90 disabled:opacity-60 text-forest-green-dark font-extrabold py-3.5 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              ) : (
                <><LogIn className="h-5 w-5" /> Iniciar Sesión</>
              )}
            </button>
          </form>

          <p className="text-center text-off-white/40 text-sm mt-8">
            ¿Aún no tienes cuenta?{' '}
            <Link href="/apadrinar" className="text-conservation-gold hover:underline">Conviértete en Guardián</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
