'use client'

import { useState } from 'react'
import { usePOSStore } from '@/store/pos-store'
import { validarCajaAcceso } from './actions'
import POSVenta from '@/components/admin/POSVenta'

export default function CajaClient({ cajas, productos }: { cajas: any[], productos: any[] }) {
  const cajaId = usePOSStore(s => s.cajaId)
  const setCaja = usePOSStore(s => s.setCaja)
  
  const [selectedCaja, setSelectedCaja] = useState<string>('')
  const [nip, setNip] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleAbrirCaja = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedCaja || !nip) {
      setError('Selecciona una caja e ingresa el NIP')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      const valido = await validarCajaAcceso(selectedCaja, nip)
      if (valido) {
        const cajaInfo = cajas.find(c => c.id === selectedCaja)
        if (cajaInfo) {
          setCaja(cajaInfo.id, cajaInfo.nombre, cajaInfo.tipo)
        }
      } else {
        setError('NIP incorrecto o caja inactiva')
        setNip('')
      }
    } catch (err) {
      setError('Error al conectar con el servidor')
    } finally {
      setLoading(false)
    }
  }

  // Si ya hay una caja abierta en el store, mostrar la interfaz de venta
  if (cajaId) {
    return <POSVenta productosCat={productos} />
  }

  return (
    <div className="flex-1 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-forest-green-dark/10 w-full max-w-md">
        <h1 className="text-2xl font-bold text-forest-green-dark mb-6 text-center">Abrir Punto de Venta</h1>
        
        <form onSubmit={handleAbrirCaja} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-forest-green-dark mb-1">Caja</label>
            <select
              value={selectedCaja}
              onChange={(e) => setSelectedCaja(e.target.value)}
              className="text-black bg-white font-semibold w-full rounded-lg border border-forest-green-dark/20 p-2.5 focus:border-conservation-gold focus:ring-1 focus:ring-conservation-gold outline-none"
            >
              <option value="">Selecciona una caja...</option>
              {cajas.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.tipo})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-forest-green-dark mb-1">NIP de Acceso</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={nip}
              onChange={(e) => setNip(e.target.value.replace(/[^0-9]/g, ''))}
              className="text-black bg-white font-semibold w-full rounded-lg border border-forest-green-dark/20 p-2.5 text-center text-xl tracking-[0.5em] focus:border-conservation-gold focus:ring-1 focus:ring-conservation-gold outline-none"
              placeholder="••••"
            />
          </div>

          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

          <button
            type="submit"
            disabled={loading || !selectedCaja || nip.length !== 4}
            className="w-full bg-forest-green-dark text-white rounded-lg p-3 font-semibold hover:bg-forest-green-dark/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-4"
          >
            {loading ? 'Validando...' : 'Abrir Caja'}
          </button>
        </form>
      </div>
    </div>
  )
}
