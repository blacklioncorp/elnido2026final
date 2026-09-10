import { getConfiguracion } from './actions'
import ConfiguracionClient from './ConfiguracionClient'

export default async function ConfiguracionPage() {
  const config = await getConfiguracion()
  return <ConfiguracionClient config={config} />
}
