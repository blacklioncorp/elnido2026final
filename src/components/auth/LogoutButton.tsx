'use client'

import { createClient } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

export default function LogoutButton({ className }: { className?: string }) {
  const router = useRouter()

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <button
      onClick={handleLogout}
      className={className ?? "flex items-center gap-2 text-off-white/50 hover:text-off-white text-sm transition-colors"}
    >
      <LogOut className="h-4 w-4" />
      Cerrar sesión
    </button>
  )
}
