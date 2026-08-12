import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server'
import SidebarClient from './SidebarClient'

export default async function Sidebar() {
  let userName = 'Administrador'
  let userEmail = 'admin@elnido.mx'
  let adminRole: string | null = null

  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      userEmail = user.email ?? userEmail
      const adminClient = await createAdminSupabaseClient()
      const { data: profile } = await adminClient
        .from('profiles')
        .select('full_name, email, role, admin_role')
        .eq('id', user.id)
        .single()


      if (profile) {
        userName = profile.full_name ?? userName
        adminRole = profile.admin_role ?? null

        if (!adminRole && (profile.role === 'super_admin' || profile.role === 'admin')) {
          adminRole = 'superadmin'
        }
      }

    }
  } catch (err) {
    console.error('Error en SidebarServer:', err)
  }

  return (
    <SidebarClient
      userName={userName}
      userEmail={userEmail}
      adminRole={adminRole}
    />
  )
}
