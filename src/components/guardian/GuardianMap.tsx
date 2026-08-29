'use client'

import { useMemo, useState } from 'react'
import Map, { Marker, Source, Layer, Popup } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { Database } from '@/lib/database.types'
import { Bird, MapPin } from 'lucide-react'
import Image from 'next/image'

type TarjetaDonacion = Database['public']['Tables']['tarjetas_donacion']['Row']

interface TarjetaConGeolocalizacion extends TarjetaDonacion {
  latitud_origen?: number | null
  longitud_origen?: number | null
  latitud_destino?: number | null
  longitud_destino?: number | null
  latitud_actual?: number | null
  longitud_actual?: number | null
  lugar_destino?: string | null
}

interface GuardianMapProps {
  tarjetas: (TarjetaDonacion | TarjetaConGeolocalizacion)[]
  height?: string
}

const SPECIES_COLORS = [
  '#D4A843', // gold
  '#2E86AB', // quetzal blue
  '#10B981', // emerald
  '#F59E0B', // amber
  '#EC4899', // pink
  '#8B5CF6', // purple
]

export default function GuardianMap({ tarjetas, height = '400px' }: GuardianMapProps) {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const [selectedTarjeta, setSelectedTarjeta] = useState<TarjetaConGeolocalizacion | null>(null)

  // Calculate center and zoom from all coordinates
  const viewState = useMemo(() => {
    if (!tarjetas.length) {
      return { longitude: -98.9109, latitude: 19.3332, zoom: 5 }
    }

    const lats: number[] = []
    const lngs: number[] = []

    tarjetas.forEach(t => {
      const tGeo = t as TarjetaConGeolocalizacion
      const latOr = tGeo.latitud_origen || 19.3332
      const lngOr = tGeo.longitud_origen || -98.9109
      const latDes = tGeo.latitud_destino || 16.1437
      const lngDes = tGeo.longitud_destino || -91.0772
      const prog = t.meta_monto > 0 ? Math.min(t.monto_recaudado / t.meta_monto, 1) : 0
      const latAct = tGeo.latitud_actual || (latOr + (latDes - latOr) * prog)
      const lngAct = tGeo.longitud_actual || (lngOr + (lngDes - lngOr) * prog)

      lats.push(latOr, latDes, latAct)
      lngs.push(lngOr, lngDes, lngAct)
    })

    const minLat = Math.min(...lats)
    const maxLat = Math.max(...lats)
    const minLng = Math.min(...lngs)
    const maxLng = Math.max(...lngs)

    return {
      longitude: (minLng + maxLng) / 2,
      latitude: (minLat + maxLat) / 2,
      zoom: tarjetas.length === 1 ? 5.2 : 4.5
    }
  }, [tarjetas])

  if (!token) {
    return (
      <div className="bg-forest-green-light/20 border border-white/10 rounded-2xl w-full flex flex-col items-center justify-center text-sm text-off-white/60 p-8" style={{ height }}>
        <MapPin className="w-8 h-8 text-conservation-gold mb-2" />
        <p>Configura NEXT_PUBLIC_MAPBOX_TOKEN para visualizar el mapa satelital.</p>
      </div>
    )
  }

  return (
    <div className="w-full relative rounded-2xl overflow-hidden shadow-2xl border border-white/10" style={{ height }}>
      <Map
        mapboxAccessToken={token}
        initialViewState={viewState}
        mapStyle="mapbox://styles/mapbox/satellite-streets-v12"
        attributionControl={false}
      >
        {tarjetas.map((tarjeta, idx) => {
          const tGeo = tarjeta as TarjetaConGeolocalizacion
          const latOr = tGeo.latitud_origen || 19.3332
          const lngOr = tGeo.longitud_origen || -98.9109
          const latDes = tGeo.latitud_destino || 16.1437
          const lngDes = tGeo.longitud_destino || -91.0772
          const prog = tarjeta.meta_monto > 0 ? Math.min(tarjeta.monto_recaudado / tarjeta.meta_monto, 1) : 0
          const latAct = tGeo.latitud_actual || (latOr + (latDes - latOr) * prog)
          const lngAct = tGeo.longitud_actual || (lngOr + (lngDes - lngOr) * prog)
          const color = SPECIES_COLORS[idx % SPECIES_COLORS.length]

          const routeSource = {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: [[lngOr, latOr], [lngDes, latDes]]
            }
          }

          const progressSource = {
            type: 'Feature' as const,
            properties: {},
            geometry: {
              type: 'LineString' as const,
              coordinates: [[lngOr, latOr], [lngAct, latAct]]
            }
          }

          return (
            <div key={tarjeta.id}>
              {/* Ruta completa planeada */}
              <Source id={`route-${tarjeta.id}`} type="geojson" data={routeSource}>
                <Layer
                  id={`route-line-${tarjeta.id}`}
                  type="line"
                  paint={{
                    'line-color': '#FFFFFF',
                    'line-width': 2,
                    'line-dasharray': [2, 2],
                    'line-opacity': 0.6
                  }}
                />
              </Source>

              {/* Tramo de progreso recorrido */}
              <Source id={`progress-${tarjeta.id}`} type="geojson" data={progressSource}>
                <Layer
                  id={`progress-line-${tarjeta.id}`}
                  type="line"
                  paint={{
                    'line-color': color,
                    'line-width': 4
                  }}
                />
              </Source>

              {/* Marcador de Origen */}
              <Marker longitude={lngOr} latitude={latOr} anchor="bottom">
                <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center text-[10px]" title="El Nido (Origen)">
                  🏠
                </div>
              </Marker>

              {/* Marcador de Destino */}
              <Marker longitude={lngDes} latitude={latDes} anchor="bottom">
                <div className="w-6 h-6 rounded-full bg-red-500 border-2 border-white shadow-lg flex items-center justify-center text-xs" title={`Destino: ${tGeo.lugar_destino || 'Área de liberación'}`}>
                  🏁
                </div>
              </Marker>

              {/* Marcador Actual de la Especie */}
              <Marker 
                longitude={lngAct} 
                latitude={latAct} 
                anchor="bottom"
                onClick={(e) => {
                  e.originalEvent.stopPropagation()
                  setSelectedTarjeta(tGeo)
                }}
              >
                <div 
                  className="cursor-pointer group relative flex flex-col items-center animate-bounce"
                >
                  <div 
                    className="w-10 h-10 rounded-full border-2 border-white shadow-2xl overflow-hidden relative flex items-center justify-center"
                    style={{ backgroundColor: color }}
                  >
                    {tarjeta.imagen_url ? (
                      <Image src={tarjeta.imagen_url} alt={tarjeta.nombre_especie} fill className="object-cover" />
                    ) : (
                      <Bird className="w-5 h-5 text-forest-green-dark" />
                    )}
                  </div>
                  <span 
                    className="px-2 py-0.5 rounded-full text-[10px] font-bold text-forest-green-dark shadow-md whitespace-nowrap mt-1 border border-white/50"
                    style={{ backgroundColor: color }}
                  >
                    {tarjeta.nombre_animal || tarjeta.nombre_especie}
                  </span>
                </div>
              </Marker>
            </div>
          )
        })}

        {/* Popup interactivo al hacer clic */}
        {selectedTarjeta && (
          <Popup
            longitude={selectedTarjeta.longitud_actual || selectedTarjeta.longitud_origen || -98.9109}
            latitude={selectedTarjeta.latitud_actual || selectedTarjeta.latitud_origen || 19.3332}
            anchor="top"
            onClose={() => setSelectedTarjeta(null)}
            closeOnClick={false}
            className="guardian-mapbox-popup"
          >
            <div className="p-3 text-forest-green-dark max-w-xs">
              <div className="flex items-center gap-2 mb-2">
                {selectedTarjeta.imagen_url && (
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0">
                    <Image src={selectedTarjeta.imagen_url} alt={selectedTarjeta.nombre_especie} fill className="object-cover" />
                  </div>
                )}
                <div>
                  <h4 className="font-bold text-sm leading-tight text-forest-green-dark">
                    {selectedTarjeta.nombre_especie}
                  </h4>
                  {selectedTarjeta.nombre_animal && (
                    <p className="text-xs text-quetzal-blue font-semibold italic">
                      &quot;{selectedTarjeta.nombre_animal}&quot;
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1 text-xs border-t border-forest-green-dark/10 pt-2">
                <p className="text-forest-green-dark/70">
                  <strong>Progreso de viaje:</strong> {Math.round((selectedTarjeta.monto_recaudado / (selectedTarjeta.meta_monto || 1)) * 100)}%
                </p>
                <p className="text-forest-green-dark/70">
                  <strong>Destino:</strong> {selectedTarjeta.lugar_destino || 'Reserva Natural Protegida'}
                </p>
              </div>

              <a 
                href={`/impulsa-el-vuelo/${selectedTarjeta.id}`} 
                className="mt-3 block text-center bg-forest-green-dark text-white text-xs font-bold py-1.5 rounded-lg hover:bg-forest-green-light transition-colors"
              >
                Ver Bitácora Completa →
              </a>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
