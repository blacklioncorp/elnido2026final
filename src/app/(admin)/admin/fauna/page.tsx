import { getFauna } from '@/app/actions/fauna'
import FaunaAdminClient from './FaunaAdminClient'
import type { Database } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

type Especie = Database['public']['Tables']['fauna']['Row']

export default async function AdminFaunaPage() {
  let especies: Especie[] = []
  try {
    especies = await getFauna()
  } catch { /* DB no configurada aún */ }

  return <FaunaAdminClient inicial={especies} />
}
