import { notFound } from 'next/navigation'
import { getTarjetaById, getActualizaciones } from '@/app/actions/liberacion'
import ImpulsaDetalleClient from './ImpulsaDetalleClient'

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const tarjeta = await getTarjetaById(resolvedParams.id)
  
  if (!tarjeta) {
    return {
      title: 'Especie no encontrada — El Nido',
    }
  }

  return {
    title: `Impulsa el Vuelo: ${tarjeta.nombre_animal || tarjeta.nombre_especie} — El Nido`,
    description: tarjeta.descripcion,
  }
}

export default async function ImpulsaElVueloPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = await params
  const tarjeta = await getTarjetaById(resolvedParams.id)
  
  if (!tarjeta || tarjeta.seccion !== 'impulsa_vuelo') {
    notFound()
  }

  const actualizaciones = await getActualizaciones(resolvedParams.id)

  return <ImpulsaDetalleClient tarjeta={tarjeta} actualizaciones={actualizaciones || []} />
}
