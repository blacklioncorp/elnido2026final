'use client'

import React from 'react'

interface TransporteOption {
  nombre: string
  url: string
  icon: React.ReactNode
}

function GoogleMapsIcon() {
  return (
    <svg viewBox="0 0 92 132" className="h-10 w-10 object-contain transition-transform duration-200 group-hover:scale-110">
      <path fill="#1A73E8" d="M46 0C20.6 0 0 20.6 0 46c0 10.9 3.8 20.9 10.2 28.8l35.8 57.2 35.8-57.2C88.2 66.9 92 56.9 92 46c0-25.4-20.6-46-46-46z" />
      <path fill="#EA4335" d="M46 0C20.6 0 0 20.6 0 46c0 12.2 4.8 23.3 12.6 31.5L46 36.8l33.4 40.7C87.2 69.3 92 58.2 92 46c0-25.4-20.6-46-46-46z" />
      <path fill="#FBBC04" d="M12.6 77.5C18.6 86.8 27.5 98.4 46 122.5c8.5-11.1 16.3-21.8 23.2-31.5L46 54.3l-33.4 23.2z" />
      <path fill="#34A853" d="M46 132l4.8-6.4C69.3 98.4 92 73.6 92 46c0-3.3-.4-6.5-1.1-9.6L46 89.2V132z" />
      <circle cx="46" cy="46" r="18" fill="#FFFFFF" />
    </svg>
  )
}

function WazeIcon() {
  return (
    <svg viewBox="0 0 100 100" className="h-10 w-10 object-contain transition-transform duration-200 group-hover:scale-110">
      <path fill="#33CCFF" d="M78 28C67 14 49 14 36 21c-14 8-22 24-19 40l-5 13c-1 3 1 6 4 5l14-3c6 4 13 6 20 6 27 0 49-21 49-47 0-3-.2-5-.5-7z" />
      <circle cx="44" cy="46" r="4.5" fill="#000000" />
      <circle cx="68" cy="46" r="4.5" fill="#000000" />
      <circle cx="32" cy="80" r="7" fill="#1E293B" />
      <circle cx="32" cy="80" r="3.5" fill="#FFFFFF" />
      <circle cx="68" cy="80" r="7" fill="#1E293B" />
      <circle cx="68" cy="80" r="3.5" fill="#FFFFFF" />
      <path d="M50 56c3 4 9 4 12 0" stroke="#000000" strokeWidth="2.5" strokeLinecap="round" fill="none" />
    </svg>
  )
}

function UberIcon() {
  return (
    <svg viewBox="0 0 100 100" className="h-10 w-10 object-contain transition-transform duration-200 group-hover:scale-110">
      <rect width="100" height="100" rx="22" fill="#000000" />
      <text
        x="50"
        y="60"
        fill="#FFFFFF"
        fontFamily="system-ui, -apple-system, sans-serif"
        fontSize="26"
        fontWeight="bold"
        textAnchor="middle"
        letterSpacing="-0.5"
      >
        Uber
      </text>
    </svg>
  )
}

const OPCIONES_TRANSPORTE: TransporteOption[] = [
  {
    nombre: 'Google Maps',
    url: 'https://www.google.com/maps/dir/?api=1&destination=19.3176683,-98.8917283',
    icon: <GoogleMapsIcon />,
  },
  {
    nombre: 'Waze',
    url: 'https://waze.com/ul?ll=19.3176683,-98.8917283&navigate=yes',
    icon: <WazeIcon />,
  },
  {
    nombre: 'Uber',
    url: 'https://m.uber.com/ul/?action=setPickup&pickup=my_location&dropoff[latitude]=19.3176683&dropoff[longitude]=-98.8917283&dropoff[nickname]=El%20Nido%20Aviario',
    icon: <UberIcon />,
  },
]

export default function BotonesTransporte() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
      {OPCIONES_TRANSPORTE.map(({ nombre, icon, url }) => (
        <a
          key={nombre}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex flex-col items-center justify-center gap-2 p-4 bg-off-white border border-forest-green-dark/10 rounded-xl hover:scale-105 hover:shadow-lg transition-all duration-200 text-forest-green-dark group shadow-sm"
        >
          {icon}
          <span className="text-sm font-semibold text-forest-green-dark">
            {nombre}
          </span>
        </a>
      ))}
    </div>
  )
}
