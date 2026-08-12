import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export default async function CajaLayout({ children }: { children: ReactNode }) {
  const supabase = await createServerSupabaseClient()
  const { data: { session } } = await supabase.auth.getSession()

  // Simulación de roles: en un entorno real se verificaría el rol en la DB
  // Por ahora, asumimos que si está autenticado y tiene acceso a /admin, puede usar la caja.
  // Si no hay sesión, puedes redirigir al login. Para este MVP, si no hay sesión, 
  // podríamos permitirlo o redirigir a /admin. 
  // Dejaremos la validación de la sesión para el futuro o si hay sesión, pasa.

  return (
    <div className="flex-1 flex flex-col h-full bg-off-white">
      {children}
    </div>
  )
}
