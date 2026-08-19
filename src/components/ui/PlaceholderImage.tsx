import React from 'react'
import { Feather } from 'lucide-react'

export function PlaceholderImage({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center bg-gradient-to-br from-forest-green-dark to-quetzal-blue w-full h-full min-h-[12rem] ${className}`}>
      <div className="text-center p-4">
        <Feather className="h-8 w-8 text-conservation-gold mx-auto" />
        <p className="text-off-white text-sm mt-2">El Nido</p>
      </div>
    </div>
  )
}
