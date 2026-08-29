import { Metadata } from 'next'
import { getGuardianData } from '@/app/actions/guardian'
import GuardianDashboardClient from './GuardianDashboardClient'

export const metadata: Metadata = {
  title: 'Mi Panel Guardián — Santuario El Nido',
  description: 'Panel de control de impacto, seguimiento satelital de especies y gestión de apadrinamientos.',
}

export const dynamic = 'force-dynamic'

interface Props {
  searchParams: Promise<{
    token?: string
    session_id?: string
    email?: string
  }>
}

export default async function GuardianPage({ searchParams }: Props) {
  const params = await searchParams
  const token = params.token || params.session_id || params.email

  const data = await getGuardianData(token)

  return <GuardianDashboardClient initialData={data} />
}
