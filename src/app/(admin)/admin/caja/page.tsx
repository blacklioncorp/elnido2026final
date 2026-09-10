import { getCajasActivas, getProductosPOS } from './actions'
import CajaClient from './CajaClient'

export const metadata = {
  title: 'Punto de Venta - El Nido',
}

export default async function CajaPage() {
  const cajas = await getCajasActivas()
  const productos = await getProductosPOS()

  return <CajaClient cajas={cajas} productos={productos} />
}
