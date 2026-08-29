'use client'

import { useMemo } from 'react'
import Map, { Marker, Source, Layer } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Database } from '@/lib/database.types'
import MapaErrorBoundary from './MapaErrorBoundary'

type TarjetaDonacion = Database['public']['Tables']['tarjetas_donacion']['Row']

interface MapaInteractivoProps {
  tarjeta: TarjetaDonacion
  height?: string
}

export default function MapaInteractivo({ tarjeta, height = '200px' }: MapaInteractivoProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  const progreso = tarjeta.meta_monto > 0 ? Math.min(tarjeta.monto_recaudado / tarjeta.meta_monto, 1) : 0

  const latOrigen = tarjeta.latitud_origen || 19.3332
  const lngOrigen = tarjeta.longitud_origen || -98.9109
  
  const latDestino = tarjeta.latitud_destino || 16.1437
  const lngDestino = tarjeta.longitud_destino || -91.0772

  const latActual = tarjeta.latitud_actual || (latOrigen + (latDestino - latOrigen) * progreso)
  const lngActual = tarjeta.longitud_actual || (lngOrigen + (lngDestino - lngOrigen) * progreso)

  const viewState = useMemo(() => {
    // Basic bounds calculation
    const lats = [latOrigen, latDestino, latActual]
    const lngs = [lngOrigen, lngDestino, lngActual]
    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    return {
      longitude: (minLng + maxLng) / 2,
      latitude: (minLat + maxLat) / 2,
      zoom: 4.5
    }
  }, [latOrigen, latDestino, latActual, lngOrigen, lngDestino, lngActual])

  const routeSource = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: [
        [lngOrigen, latOrigen],
        [lngDestino, latDestino]
      ]
    }
  }

  const progressSource = {
    type: 'Feature' as const,
    properties: {},
    geometry: {
      type: 'LineString' as const,
      coordinates: [
        [lngOrigen, latOrigen],
        [lngActual, latActual]
      ]
    }
  }

  if (!token) return <div className="bg-gray-200 w-full flex items-center justify-center text-sm text-forest-green-dark" style={{ height }}>Token Mapbox no configurado</div>

  return (
    <div className="w-full relative rounded-xl overflow-hidden shadow-inner bg-[#F7F3E8]" style={{ height }}>
      <MapaErrorBoundary>
        <Map
          mapboxAccessToken={token}
          initialViewState={viewState}
          mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
          attributionControl={false}
        >
          <Source id="route" type="geojson" data={routeSource}>
            <Layer 
              id="route-line" 
              type="line" 
              paint={{
                'line-color': '#FFFFFF',
                'line-width': 2,
                'line-dasharray': [2, 2]
              }} 
            />
          </Source>
          
          <Source id="progress" type="geojson" data={progressSource}>
            <Layer 
              id="progress-line" 
              type="line" 
              paint={{
                'line-color': '#D4A843', // conservation-gold
                'line-width': 4
              }} 
            />
          </Source>

          {/* Origen */}
          <Marker longitude={lngOrigen} latitude={latOrigen} anchor="bottom">
            <div className="text-2xl drop-shadow-md">🟢</div>
          </Marker>

          {/* Destino */}
          <Marker longitude={lngDestino} latitude={latDestino} anchor="bottom">
            <div className="text-2xl drop-shadow-md">🏁</div>
          </Marker>

          {/* Actual */}
          <Marker longitude={lngActual} latitude={latActual} anchor="bottom">
            <div className="text-2xl animate-bounce drop-shadow-md">📍</div>
          </Marker>
        </Map>
      </MapaErrorBoundary>
    </div>
  )
}
