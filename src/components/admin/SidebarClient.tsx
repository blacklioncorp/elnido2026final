'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard, Bird, BookOpen, Users, Heart,
  BookMarked, Settings, LogOut, ChevronRight, GraduationCap,
  Store, Package, Wallet, BarChart3, Leaf, CalendarClock,
  Menu, X
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { adminCanAccess, getAdminRoleBadgeColor, ADMIN_ROLES, type AdminRole } from '@/lib/roles'
import { createBrowserClient } from '@supabase/ssr'

// Mapa de módulo → configuración nav item
const ALL_ITEMS = [
  // siempre visible
  { href: '/admin',              label: 'Dashboard',           icon: LayoutDashboard, modulo: null,            group: 'General' },
  { href: '/admin/fauna',        label: 'Fauna',               icon: Bird,            modulo: 'fauna',         group: 'General' },
  // TODO: Reactivar cuando se tenga contenido
  // { href: '/admin/blog',         label: 'Blog',                icon: BookOpen,        modulo: 'blog',          group: 'General' },
  { href: '/admin/apadrinamientos', label: 'Apadrinamientos',  icon: Heart,           modulo: 'donativos',     group: 'General' },
  { href: '/admin/usuarios',     label: 'Usuarios',            icon: Users,           modulo: 'usuarios',      group: 'General' },
  // TODO: Reactivar cuando se tenga contenido
  // { href: '/admin/bitacora',     label: 'Bitácora',            icon: BookMarked,      modulo: 'bitacora',      group: 'General' },
  { href: '/admin/configuracion',label: 'Configuración',       icon: Settings,        modulo: 'configuracion', group: 'General' },
  { href: '/admin/grupos',       label: 'Paquetes Educativos', icon: GraduationCap,   modulo: 'grupos',        group: 'Educación' },
  { href: '/admin/donativos',    label: 'Tarjetas de Donación',icon: Leaf,            modulo: 'donativos',     group: 'Donativos' },
  { href: '/admin/caja',         label: 'Punto de Venta',      icon: Store,           modulo: 'pos',           group: 'Operaciones' },
  { href: '/admin/caja/productos',label: 'Catálogo POS',       icon: Package,         modulo: 'pos',           group: 'Operaciones' },
  // TODO: Reactivar cuando se active venta online
  // { href: '/admin/cupo',         label: 'Cupo Diario',         icon: CalendarClock,   modulo: 'boletos',       group: 'Operaciones' },
  { href: '/admin/cajas',        label: 'Cajas',               icon: Wallet,          modulo: 'cajas',         group: 'Administración' },
  { href: '/admin/reportes',     label: 'Reportes',            icon: BarChart3,       modulo: 'reportes',      group: 'Administración' },
]

const GROUP_ORDER = ['General', 'Educación', 'Donativos', 'Operaciones', 'Administración']

interface Props {
  userName: string
  userEmail: string
  adminRole: string | null
}

export default function SidebarClient({ userName, userEmail, adminRole }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  // Filtrar items según rol
  const visibleItems = ALL_ITEMS.filter(item =>
    item.modulo === null || adminCanAccess(adminRole as AdminRole, item.modulo)
  )

  // Agrupar
  const groups = GROUP_ORDER.map(groupName => ({
    title: groupName,
    items: visibleItems.filter(i => i.group === groupName),
  })).filter(g => g.items.length > 0)

  async function handleLogout() {
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      await supabase.auth.signOut()
      router.push('/login')
      router.refresh()
    } catch { router.push('/login') }
  }

  const initials = userName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()
  const roleBadge = adminRole ? getAdminRoleBadgeColor(adminRole) : ''
  const roleLabel = adminRole ? (ADMIN_ROLES[adminRole as AdminRole] ?? adminRole) : 'Sin rol'

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-forest-green-dark border-b border-white/10 z-40 flex items-center justify-between px-4">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center bg-off-white">
            <Image
              src="https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/icon-logos/LOGO-ELNIDO-blanco.webp"
              alt="Icono" width={24} height={24} className="object-cover"
            />
          </div>
          <span className="text-off-white font-bold leading-none text-sm">El Nido Admin</span>
        </Link>
        <button onClick={() => setIsOpen(true)} className="text-off-white/80 hover:text-white p-1">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-[45]"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 min-h-screen bg-forest-green-light/80 backdrop-blur-xl border-r border-white/10 flex flex-col transition-transform duration-300 md:relative md:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Logo */}
        <div className="px-6 py-6 border-b border-white/10 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3" onClick={() => setIsOpen(false)}>
            <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center bg-off-white">
              <Image
                src="https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/icon-logos/LOGO-ELNIDO-blanco.webp"
                alt="Icono" width={32} height={32} className="object-cover"
              />
            </div>
            <div>
              <p className="text-off-white font-bold leading-none">El Nido</p>
              <p className="text-off-white/40 text-xs">Panel Admin</p>
            </div>
          </Link>
          <button onClick={() => setIsOpen(false)} className="md:hidden text-off-white/50 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-6 overflow-y-auto space-y-6">
        {groups.map((group, idx) => (
          <div key={idx} className="space-y-1">
            <h3 className="px-3 text-xs font-bold text-off-white/40 uppercase tracking-wider mb-2">
              {group.title}
            </h3>
            {group.items.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || (href !== '/admin' && pathname.startsWith(href))
              return (
                <Link
                  key={href} href={href}
                  onClick={() => setIsOpen(false)}
                  className={cn(
                    'flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group',
                    active
                      ? 'bg-conservation-gold text-forest-green-dark shadow-md shadow-conservation-gold/20'
                      : 'text-off-white/70 hover:text-off-white hover:bg-white/10'
                  )}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 flex-shrink-0" />
                    {label}
                  </div>
                  {active && <ChevronRight className="h-4 w-4" />}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* User + logout */}
      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-quetzal-blue/40 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
            {initials || 'AD'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-off-white text-sm font-medium truncate">{userName}</p>
            {adminRole && (
              <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full border ${roleBadge}`}>
                {roleLabel}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-off-white/60 hover:text-off-white hover:bg-white/10 transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          Cerrar Sesión
        </button>
      </div>
      </aside>
    </>
  )
}
