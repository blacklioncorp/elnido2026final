import { getFauna, getEstadisticasQR } from '@/app/actions/fauna'
import FaunaAdminClient from './FaunaAdminClient'
import type { Database } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

type Especie = Database['public']['Tables']['fauna']['Row']

export default async function AdminFaunaPage() {
  let especies: Especie[] = []
  let estadisticasQR = {
    totalMes: 0,
    totalGlobal: 0,
    conteoPorEspecie: {} as Record<string, number>,
    conteoPorSlug: {} as Record<string, number>,
    especieMasEscaneada: null as { slug: string; total: number } | null,
  }

  try {
    const [faunaData, qrStats] = await Promise.all([
      getFauna(),
      getEstadisticasQR(),
    ])
    especies = faunaData
    estadisticasQR = qrStats
  } catch { /* DB no configurada aún */ }

  return (
    <FaunaAdminClient
      inicial={especies}
      estadisticasQR={estadisticasQR}
    />
  )
}
