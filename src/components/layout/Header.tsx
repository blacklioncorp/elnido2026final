'use client'

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { Ticket, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase';

import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/fauna', label: 'Fauna' },
  // TODO: Reactivar cuando tenga contenido - Diario de Campo
  // { href: '/diario-de-campo', label: 'Diario de Campo' },
  { href: '/grupos', label: 'Grupos 🎓' },
  { href: '/donativos', label: 'Apadrinar 🦜' },
  // TODO: Reactivar cuando tenga contenido - Blog
  // { href: '/blog', label: 'Blog' },
  { href: '/donar', label: 'Donar' },
]

export default function Header() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<{ id: string, name: string } | null>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setUser({ id: data.user.id, name: data.user.user_metadata?.full_name || 'Usuario' })
      }
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, name: session.user.user_metadata?.full_name || 'Usuario' })
      } else {
        setUser(null)
      }
    })
    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/')
  }

  return (
    <header className="fixed top-0 z-50 h-20 w-full bg-forest-green-dark/80 backdrop-blur-xl border-b border-white/10">
      <nav className="container mx-auto flex h-full items-center justify-between px-4">
        <Link href="/" className="flex-shrink-0">
          <Image src="https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/icon-logos/LOGO-ELNIDO-blanco.webp" alt="El Nido" width={120} height={40} className="object-contain" style={{ width: 'auto', height: '36px' }} />
        </Link>
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                pathname === href || pathname.startsWith(href)
                  ? 'bg-white/10 text-off-white'
                  : 'text-off-white/60 hover:text-off-white hover:bg-white/5'
              )}
            >
              {label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {/* TODO: Reactivar cuando se active venta online - Boletos */}
          {/* <Link
            href="/boletos"
            className="flex items-center gap-2 bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-bold text-sm py-2 px-5 rounded-full transition-all duration-200 hover:scale-105"
          >
            <Ticket className="h-4 w-4" />
            Boletos
          </Link> */}
          {user ? (
            <div className="hidden md:flex items-center gap-3 ml-2">
              <span className="text-off-white/80 text-sm font-medium">
                {user.name}
              </span>
              <button
                onClick={handleLogout}
                className="text-off-white/60 hover:text-white transition-colors flex items-center gap-2 bg-white/5 hover:bg-white/10 p-2 rounded-lg"
                title="Cerrar Sesión"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <>
              {/* TODO: Reactivar post-lanzamiento - Iniciar Sesión */}
              {/* <Link
                href="/login"
                className="hidden md:block text-off-white/60 hover:text-off-white text-sm font-medium transition-colors"
              >
                Iniciar Sesión
              </Link> */}
            </>
          )}
          <Link
            href="/donar"
            className="hidden sm:block bg-white/10 hover:bg-white/20 text-off-white font-bold text-sm py-2 px-5 rounded-lg transition-all duration-200 hover:scale-105"
          >
            Donar
          </Link>
        </div>
      </nav>
    </header>
  );
}
