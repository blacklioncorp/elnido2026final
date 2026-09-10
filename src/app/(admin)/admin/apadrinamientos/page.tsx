import { getApadrinamientosData } from './actions'
import ApadrinamientosAdminClient from '@/components/admin/apadrinamientos/ApadrinamientosAdminClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Apadrinamientos - El Nido Admin',
}

export default async function ApadrinamientosPage() {
  const data = await getApadrinamientosData()
  return <ApadrinamientosAdminClient initialData={data} />
}
