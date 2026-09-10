'use client'

import { useState } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox'
import 'mapbox-gl/dist/mapbox-gl.css'
import MapaErrorBoundary from '@/components/donativos/MapaErrorBoundary'

export default function MapaVisitanos() {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  const [showPopup, setShowPopup] = useState(true)

  const coordenadas = {
    latitude: 19.3176683,
    longitude: -98.8917283,
  }

  if (!token) {
    return (
      <div className="w-full h-80 md:h-[420px] rounded-2xl bg-forest-green-dark/60 flex flex-col items-center justify-center p-6 text-center text-off-white">
        <span className="text-4xl mb-3">📍</span>
        <h3 className="text-lg font-bold">El Nido - Santuario de Aves</h3>
        <p className="text-sm text-off-white/70 mt-1">C. Progreso S/N, Santa Barbara, 56538 Ixtapaluca, Méx.</p>
      </div>
    )
  }

  return (
    <div className="relative w-full h-80 md:h-[420px] rounded-2xl overflow-hidden shadow-inner bg-[#F7F3E8]">
      <MapaErrorBoundary>
        <Map
          mapboxAccessToken={token}
          initialViewState={{
            latitude: coordenadas.latitude,
            longitude: coordenadas.longitude,
            zoom: 14,
          }}
          style={{ width: '100%', height: '100%' }}
          mapStyle="mapbox://styles/mapbox/outdoors-v12"
          attributionControl={false}
        >
          <NavigationControl position="top-right" />

          {/* Marcador personalizado de Guacamaya */}
          <Marker
            latitude={coordenadas.latitude}
            longitude={coordenadas.longitude}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setShowPopup((prev) => !prev)
            }}
          >
            <div
              className="w-12 h-12 bg-conservation-gold rounded-full flex items-center justify-center shadow-lg border-2 border-off-white cursor-pointer hover:scale-110 transition-transform text-2xl select-none"
              title="El Nido - Santuario de Aves"
            >
              🦜
            </div>
          </Marker>

          {/* Popup interactivo */}
          {showPopup && (
            <Popup
              latitude={coordenadas.latitude}
              longitude={coordenadas.longitude}
              anchor="bottom"
              offset={28}
              onClose={() => setShowPopup(false)}
              closeOnClick={false}
              className="z-10"
            >
              <div className="p-2 text-center text-forest-green-dark max-w-[220px]">
                <h4 className="font-extrabold text-sm text-forest-green-dark">
                  El Nido - Santuario de Aves
                </h4>
                <p className="text-xs text-stone-600 mt-1 leading-snug">
                  C. Progreso S/N, Santa Barbara, 56538 Ixtapaluca, Méx.
                </p>
                <div className="mt-2 pt-2 border-t border-stone-200">
                  <span className="inline-block text-[11px] font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                    Santuario Abierto
                  </span>
                </div>
              </div>
            </Popup>
          )}
        </Map>
      </MapaErrorBoundary>
    </div>
  )
}
