import { getCajasBasico } from './actions'
import ReportesClient from './ReportesClient'

export const metadata = {
  title: 'Reportes y Métricas - El Nido',
}

export default async function ReportesPage() {
  const cajas = await getCajasBasico()
  return <ReportesClient cajas={cajas} />
}
