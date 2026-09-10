import { getTodasLasCajas } from './actions'
import CajasClient from './CajasClient'

export const metadata = {
  title: 'Administración de Cajas - El Nido',
}

export default async function CajasPage() {
  const cajas = await getTodasLasCajas()
  return <CajasClient cajasIniciales={cajas} />
}
