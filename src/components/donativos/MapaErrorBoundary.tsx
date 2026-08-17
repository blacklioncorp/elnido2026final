'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import MapaEstaticoConBlur from './MapaEstaticoConBlur'

interface Props {
  children?: ReactNode
}

interface State {
  hasError: boolean
}

export default class MapaErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  }

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Mapbox WebGL Error caught by ErrorBoundary:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="relative w-full h-full rounded-xl overflow-hidden shadow-inner bg-gray-200 group">
          <MapaEstaticoConBlur />
          <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center p-6 text-center">
            <span className="text-3xl mb-3">🗺️</span>
            <h3 className="text-lg font-bold text-white mb-2">Mapa no disponible</h3>
            <p className="text-sm text-off-white/80 max-w-xs">
              Tu navegador no soporta aceleración gráfica (WebGL) requerida para el mapa interactivo.
            </p>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
