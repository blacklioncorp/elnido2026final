import { validarToken, getDonacionesActivas } from '@/app/actions/portal-donaciones'
import MisDonacionesClient from './MisDonacionesClient'
import { AlertCircle } from 'lucide-react'

export const metadata = {
  title: 'Mis Donaciones | El Nido',
}

export default async function MisDonacionesPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const params = await searchParams
  const token = params.token

  if (!token) {
    return (
      <div className="min-h-screen bg-off-white pt-32 pb-20 px-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-forest-green-dark mb-2">Enlace no válido</h1>
          <p className="text-forest-green-light/80">No se proporcionó un token de acceso válido.</p>
        </div>
      </div>
    )
  }

  const valid = await validarToken(token)
  
  if (valid.error || !valid.email) {
    return (
      <div className="min-h-screen bg-off-white pt-32 pb-20 px-4 flex items-center justify-center">
        <div className="bg-white p-8 rounded-3xl shadow-xl max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-forest-green-dark mb-2">Enlace expirado o inválido</h1>
          <p className="text-forest-green-light/80">{valid.error}</p>
        </div>
      </div>
    )
  }

  const donaciones = await getDonacionesActivas(valid.email)

  return (
    <div className="min-h-screen bg-off-white pt-32 pb-20 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-display font-bold text-forest-green-dark">Hola 👋</h1>
          <p className="text-forest-green-light mt-1">{valid.email}</p>
        </div>
        
        <MisDonacionesClient email={valid.email} initialDonaciones={donaciones.data || []} />
      </div>
    </div>
  )
}
