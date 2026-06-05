'use client'

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/fauna', label: 'Fauna' },
  { href: '/diario-de-campo', label: 'Diario de Campo' },
  { href: '/apadrinar', label: 'Apadrinar' },
  { href: '/blog', label: 'Blog' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 z-50 h-20 w-full bg-forest-green-dark/80 backdrop-blur-xl border-b border-white/10">
      <nav className="container mx-auto flex h-full items-center justify-between px-4">
        <Link href="/" className="flex-shrink-0">
          <Image src="/logo.svg" alt="El Nido" width={120} height={40} className="h-9 w-auto" />
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
          <Link
            href="/login"
            className="hidden md:block text-off-white/60 hover:text-off-white text-sm font-medium transition-colors"
          >
            Iniciar Sesión
          </Link>
          <Link
            href="/donar"
            className="bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-bold text-sm py-2 px-5 rounded-lg transition-all duration-200 hover:scale-105"
          >
            Donar
          </Link>
        </div>
      </nav>
    </header>
  );
}
