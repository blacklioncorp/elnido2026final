import { getTarjetasDonacion, getSuscripcionesActivas } from './actions'
import DonativosAdminClient from './DonativosAdminClient'

export default async function AdminDonativosPage() {
  const [tarjetas, suscripciones] = await Promise.all([
    getTarjetasDonacion(),
    getSuscripcionesActivas()
  ])
  return <DonativosAdminClient tarjetas={tarjetas} suscripciones={suscripciones} />
}
