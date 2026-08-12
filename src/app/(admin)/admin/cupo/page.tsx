import { getCupoRangoCompleto } from './actions'
import CupoAdminClient from './CupoAdminClient'

export default async function AdminCupoPage() {
  const registros = await getCupoRangoCompleto()
  return <CupoAdminClient registros={registros} />
}
