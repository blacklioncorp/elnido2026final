'use client'

import Image from 'next/image'

export default function MapaEstaticoConBlur() {
  return (
    <div className="absolute inset-0 bg-gray-200 overflow-hidden">
      {/* We can use a Mapbox static image or just a generic placeholder for the blurred background */}
      <div 
        className="absolute inset-0 blur-[6px] scale-110"
        style={{
          backgroundImage: 'url("https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/auto/600x300@2x?access_token=")',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundColor: '#e5e7eb' // fallback color
        }}
      />
      {/* A generic map pattern just in case Mapbox token is missing for the static image */}
      <div className="absolute inset-0 opacity-20" style={{
        backgroundImage: 'radial-gradient(#115e59 1px, transparent 1px)',
        backgroundSize: '20px 20px'
      }} />
    </div>
  )
}
