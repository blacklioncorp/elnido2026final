import { getEntradasBitacora } from '@/app/actions/bitacora'
import { getFauna } from '@/app/actions/fauna'
import { createServerSupabaseClient } from '@/lib/supabase-server'
import BitacoraAdminClient from './BitacoraAdminClient'
import type { Database } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

type Entrada = Database['public']['Tables']['bitacora']['Row'] & {
  fauna?: { nombre: string; slug: string } | null
}
type Fauna = Pick<Database['public']['Tables']['fauna']['Row'], 'id' | 'nombre'>

export default async function AdminBitacoraPage() {
  let entradas: Entrada[] = []
  let faunaList: Fauna[] = []
  let userId = ''
  let adminRole: string | null = null

  try {
    const supabase = await createServerSupabaseClient()
    const { data: { user } } = await supabase.auth.getUser()
    userId = user?.id ?? ''

    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('admin_role')
        .eq('id', userId)
        .single()
      adminRole = profile?.admin_role ?? null
    }

    entradas = await getEntradasBitacora()
    faunaList = (await getFauna(true)).map(f => ({ id: f.id, nombre: f.nombre }))
  } catch { /* DB no configurada aún */ }

  return (
    <BitacoraAdminClient
      inicial={entradas}
      faunaList={faunaList}
      userId={userId}
      adminRole={adminRole}
    />
  )
}
