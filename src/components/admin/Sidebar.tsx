'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Bird, BookOpen, Users, Heart,
  BookMarked, Settings, LogOut, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/fauna', label: 'Fauna', icon: Bird },
  { href: '/admin/blog', label: 'Blog', icon: BookOpen },
  { href: '/admin/apadrinamientos', label: 'Apadrinamientos', icon: Heart },
  { href: '/admin/usuarios', label: 'Usuarios', icon: Users },
  { href: '/admin/bitacora', label: 'Bitácora', icon: BookMarked },
  { href: '/admin/configuracion', label: 'Configuración', icon: Settings },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 min-h-screen bg-forest-green-light/80 backdrop-blur-xl border-r border-white/10 flex flex-col">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-white/10">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-8 h-8 bg-conservation-gold rounded-lg flex items-center justify-center">
            <Bird className="h-5 w-5 text-forest-green-dark" />
          </div>
          <div>
            <p className="text-off-white font-bold leading-none">El Nido</p>
            <p className="text-off-white/40 text-xs">Panel Admin</p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 space-y-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                active
                  ? 'bg-conservation-gold text-forest-green-dark shadow-md shadow-conservation-gold/20'
                  : 'text-off-white/70 hover:text-off-white hover:bg-white/10'
              )}
            >
              <div className="flex items-center gap-3">
                <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                {label}
              </div>
              {active && <ChevronRight className="h-4 w-4" />}
            </Link>
          )
        })}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-quetzal-blue/40 flex items-center justify-center text-xs font-bold text-white">
            AD
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-off-white text-sm font-medium truncate">Administrador</p>
            <p className="text-off-white/40 text-xs truncate">admin@elnido.mx</p>
          </div>
        </div>
        <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-off-white/60 hover:text-off-white hover:bg-white/10 transition-all duration-200">
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  )
}
