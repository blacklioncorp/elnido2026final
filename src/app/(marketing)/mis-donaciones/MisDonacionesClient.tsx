'use client'

import { useState } from 'react'
import { DonacionActiva, cancelarDonacion, pausarDonacion, reanudarDonacion, cambiarMonto } from '@/app/actions/portal-donaciones'
import { Bird, PauseCircle, PlayCircle, XCircle, Edit3, Loader2 } from 'lucide-react'

interface Props {
  email: string
  initialDonaciones: DonacionActiva[]
}

export default function MisDonacionesClient({ email, initialDonaciones }: Props) {
  const [donaciones, setDonaciones] = useState<DonacionActiva[]>(initialDonaciones)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  
  // Modal state para cambiar monto
  const [modalMontoOpen, setModalMontoOpen] = useState(false)
  const [selectedSubId, setSelectedSubId] = useState<string | null>(null)
  const [nuevoMonto, setNuevoMonto] = useState<string>('')
  const [montoError, setMontoError] = useState('')

  const handleCancelar = async (subId: string, nombreEspecie: string) => {
    if (!confirm(`¿Seguro que deseas cancelar tu donación a ${nombreEspecie}?`)) return
    
    setLoadingId(subId)
    const res = await cancelarDonacion(subId, email)
    if (res.success) {
      setDonaciones(prev => prev.map(d => d.stripe_subscription_id === subId ? { ...d, estado_suscripcion: 'cancelada' } : d))
    } else {
      alert(res.error)
    }
    setLoadingId(null)
  }

  const handlePausar = async (subId: string) => {
    if (!confirm(`¿Pausar tu donación por 1 mes?`)) return
    
    setLoadingId(subId)
    const res = await pausarDonacion(subId, email)
    if (res.success) {
      setDonaciones(prev => prev.map(d => d.stripe_subscription_id === subId ? { ...d, estado_suscripcion: 'pausada' } : d))
    } else {
      alert(res.error)
    }
    setLoadingId(null)
  }

  const handleReanudar = async (subId: string) => {
    setLoadingId(subId)
    const res = await reanudarDonacion(subId, email)
    if (res.success) {
      setDonaciones(prev => prev.map(d => d.stripe_subscription_id === subId ? { ...d, estado_suscripcion: 'activa' } : d))
    } else {
      alert(res.error)
    }
    setLoadingId(null)
  }

  const openMontoModal = (subId: string, currentMonto: number) => {
    setSelectedSubId(subId)
    setNuevoMonto(currentMonto.toString())
    setMontoError('')
    setModalMontoOpen(true)
  }

  const handleCambiarMonto = async () => {
    if (!selectedSubId) return
    const montoNum = parseFloat(nuevoMonto)
    if (isNaN(montoNum) || montoNum < 50) {
      setMontoError('El monto mínimo es de $50 MXN')
      return
    }

    setLoadingId('modal')
    setMontoError('')
    
    const res = await cambiarMonto(selectedSubId, montoNum, email)
    if (res.success) {
      setDonaciones(prev => prev.map(d => d.stripe_subscription_id === selectedSubId ? { ...d, monto: montoNum } : d))
      setModalMontoOpen(false)
    } else {
      setMontoError(res.error || 'Error al cambiar monto')
    }
    setLoadingId(null)
  }

  if (donaciones.length === 0) {
    return (
      <div className="bg-white p-8 rounded-3xl shadow-xl shadow-forest-green-dark/5 text-center">
        <Bird className="w-16 h-16 text-forest-green-light/20 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-forest-green-dark mb-2">No tienes donaciones activas</h2>
        <p className="text-forest-green-light/80">Parece que no hay suscripciones activas asociadas a este correo.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-forest-green-dark mb-4">Tus donaciones activas:</h2>
      
      {donaciones.map((d) => (
        <div key={d.id} className="bg-white rounded-3xl p-6 shadow-xl shadow-forest-green-dark/5 border border-forest-green-light/10">
          <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
            
            <div>
              <h3 className="text-lg font-bold text-forest-green-dark flex items-center gap-2">
                <Bird className="w-5 h-5 text-conservation-gold" />
                {d.nombre_animal ? `${d.nombre_animal} (${d.nombre_especie})` : (d.nombre_especie || 'Donativo General')}
              </h3>
              <p className="text-forest-green-light mt-1 font-medium">
                ${d.monto} MXN / mes
                <span className="mx-2 opacity-50">•</span>
                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                  d.estado_suscripcion === 'activa' || d.estado_suscripcion === 'active' ? 'bg-green-100 text-green-700' :
                  d.estado_suscripcion === 'pausada' || d.estado_suscripcion === 'paused' ? 'bg-yellow-100 text-yellow-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {d.estado_suscripcion.toUpperCase()}
                </span>
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              {(d.estado_suscripcion === 'activa' || d.estado_suscripcion === 'active' || d.estado_suscripcion === 'pausada' || d.estado_suscripcion === 'paused') && (
                <button
                  onClick={() => openMontoModal(d.stripe_subscription_id, d.monto)}
                  disabled={loadingId === d.stripe_subscription_id}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-bold text-forest-green-dark bg-conservation-gold hover:brightness-105 rounded-lg transition-all shadow-sm"
                >
                  <Edit3 className="w-4 h-4" />
                  Cambiar monto
                </button>
              )}

              {(d.estado_suscripcion === 'activa' || d.estado_suscripcion === 'active') && (
                <button
                  onClick={() => handlePausar(d.stripe_subscription_id)}
                  disabled={loadingId === d.stripe_subscription_id}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-forest-green-dark bg-forest-green-light/10 hover:bg-forest-green-light/20 rounded-lg transition-colors"
                >
                  {loadingId === d.stripe_subscription_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PauseCircle className="w-4 h-4" />}
                  Pausar
                </button>
              )}

              {(d.estado_suscripcion === 'pausada' || d.estado_suscripcion === 'paused') && (
                <button
                  onClick={() => handleReanudar(d.stripe_subscription_id)}
                  disabled={loadingId === d.stripe_subscription_id}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-forest-green hover:bg-forest-green-dark rounded-lg transition-colors"
                >
                  {loadingId === d.stripe_subscription_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <PlayCircle className="w-4 h-4" />}
                  Reanudar
                </button>
              )}

              {(d.estado_suscripcion !== 'cancelada' && d.estado_suscripcion !== 'canceled') && (
                <button
                  onClick={() => handleCancelar(d.stripe_subscription_id, d.nombre_especie || 'este donativo')}
                  disabled={loadingId === d.stripe_subscription_id}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                >
                  {loadingId === d.stripe_subscription_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Cancelar
                </button>
              )}
            </div>

          </div>
        </div>
      ))}

      {/* Modal Cambiar Monto */}
      {modalMontoOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl relative">
            <button 
              onClick={() => setModalMontoOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <XCircle className="w-6 h-6" />
            </button>
            <h3 className="text-xl font-bold text-forest-green-dark mb-4">Cambiar monto</h3>
            <label className="block text-sm font-medium text-forest-green-dark mb-2">Nuevo monto mensual (MXN)</label>
            <div className="relative mb-4">
              <span className="absolute left-4 top-3 text-forest-green-light/50">$</span>
              <input 
                type="number"
                value={nuevoMonto}
                onChange={(e) => setNuevoMonto(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-off-white/50 border border-forest-green-light/20 rounded-xl focus:ring-2 focus:ring-conservation-gold text-forest-green-dark"
                min="50"
                step="10"
              />
            </div>
            {montoError && <p className="text-red-500 text-sm mb-4">{montoError}</p>}
            <button
              onClick={handleCambiarMonto}
              disabled={loadingId === 'modal'}
              className="w-full py-3 bg-conservation-gold text-forest-green-dark font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-conservation-gold/20"
            >
              {loadingId === 'modal' ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Guardar cambios'}
            </button>
          </div>
        </div>
      )}

    </div>
  )
}
