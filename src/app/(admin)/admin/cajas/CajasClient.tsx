'use client'

import { useState } from 'react'
import { guardarCaja, cambiarEstadoCaja, regenerarNipCaja } from './actions'
import { Plus, X, ShieldAlert, KeyRound, Power, PowerOff } from 'lucide-react'

export default function CajasClient({ cajasIniciales }: { cajasIniciales: any[] }) {
  const [cajas, setCajas] = useState(cajasIniciales)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    nombre: '',
    tipo: 'taquilla',
    nip: ''
  })

  const generarNipAleatorio = () => {
    return Math.floor(1000 + Math.random() * 9000).toString()
  }

  const openModal = () => {
    setForm({ nombre: '', tipo: 'taquilla', nip: generarNipAleatorio() })
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.nip.length !== 4) return alert('El NIP debe tener 4 dígitos')
    setSaving(true)
    try {
      await guardarCaja({ ...form, activa: true })
      window.location.reload()
    } catch (err) {
      alert('Error al guardar la caja')
    } finally {
      setSaving(false)
    }
  }

  const handleRegenerarNip = async (id: string) => {
    if (confirm('¿Seguro que deseas regenerar el NIP? Los cajeros actuales no podrán usar el NIP anterior.')) {
      const nuevoNip = await regenerarNipCaja(id)
      setCajas(cajas.map(c => c.id === id ? { ...c, nip: nuevoNip } : c))
      alert(`El nuevo NIP es: ${nuevoNip}`)
    }
  }

  const handleToggleEstado = async (caja: any) => {
    const nuevaActiva = !caja.activa
    if (!nuevaActiva) {
      if (!confirm(`¿Seguro que deseas desactivar la caja "${caja.nombre}"? No podrá usarse para cobrar hasta reactivarla.`)) {
        return
      }
    }
    
    await cambiarEstadoCaja(caja.id, nuevaActiva)
    setCajas(cajas.map(c => c.id === caja.id ? { ...c, activa: nuevaActiva } : c))
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-forest-green-dark">Cajas y Terminales</h1>
          <p className="text-forest-green-dark/60 mt-1">Administra los puntos de cobro físicos del santuario.</p>
        </div>
        <button 
          onClick={openModal}
          className="flex items-center gap-2 bg-conservation-gold text-forest-green-dark px-4 py-2 rounded-xl font-bold hover:bg-[#D4A373] transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5" /> Nueva Caja
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-forest-green-dark/10 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-forest-green-dark/5 border-b border-forest-green-dark/10 text-sm font-semibold text-forest-green-dark/80">
              <th className="p-4">Nombre</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">NIP (4 dígitos)</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest-green-dark/5 text-sm text-forest-green-dark">
            {cajas.map(c => (
              <tr key={c.id} className={`transition-colors ${!c.activa ? 'bg-gray-50 opacity-60' : 'hover:bg-forest-green-dark/5'}`}>
                <td className="p-4 font-bold">{c.nombre}</td>
                <td className="p-4">
                  <span className="bg-quetzal-blue/10 text-quetzal-blue px-2.5 py-1 rounded-full text-xs font-semibold capitalize">
                    {c.tipo}
                  </span>
                </td>
                <td className="p-4 font-mono text-lg tracking-widest text-forest-green-dark/60">
                  {c.activa ? '••••' : c.nip} {/* Mostrar NIP solo si está inactiva como demo o mejor siempre oculto */}
                  {/* Para mayor seguridad, nunca enviamos el NIP real a la tabla, pero como el usuario lo pidió: */}
                  <span className="ml-2 text-xs tracking-normal font-sans text-forest-green-dark/40 cursor-pointer" onClick={() => alert(`NIP Actual: ${c.nip}`)}>ver</span>
                </td>
                <td className="p-4">
                  {c.activa ? (
                    <span className="flex items-center gap-1.5 text-green-600 font-semibold text-xs">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span> Operativa
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-red-500 font-semibold text-xs">
                      <span className="w-2 h-2 rounded-full bg-red-500"></span> Inactiva
                    </span>
                  )}
                </td>
                <td className="p-4 flex items-center justify-end gap-2">
                  <button onClick={() => handleRegenerarNip(c.id)} title="Regenerar NIP" className="p-2 text-forest-green-dark/60 hover:text-conservation-gold hover:bg-conservation-gold/10 rounded-lg transition-colors">
                    <KeyRound className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleToggleEstado(c)} title={c.activa ? 'Desactivar' : 'Activar'} className={`p-2 rounded-lg transition-colors ${c.activa ? 'text-forest-green-dark/60 hover:text-red-500 hover:bg-red-50' : 'text-forest-green-dark/60 hover:text-green-600 hover:bg-green-50'}`}>
                    {c.activa ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                  </button>
                </td>
              </tr>
            ))}
            {cajas.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-forest-green-dark/50">No hay cajas creadas. Crea la primera taquilla.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-forest-green-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-forest-green-dark/10 flex items-center justify-between">
              <h3 className="font-bold text-xl text-forest-green-dark">Registrar Nueva Caja</h3>
              <button onClick={() => setModalOpen(false)} className="text-forest-green-dark/40 hover:text-forest-green-dark">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-forest-green-dark mb-1">Nombre (ej. Taquilla 1, Cafetería Principal)</label>
                <input required type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="text-black bg-white font-semibold w-full border border-forest-green-dark/20 rounded-xl p-2.5 focus:border-conservation-gold focus:ring-1 focus:ring-conservation-gold outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-green-dark mb-1">Tipo de Caja</label>
                <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} className="text-black bg-white font-semibold w-full border border-forest-green-dark/20 rounded-xl p-2.5 focus:border-conservation-gold focus:ring-1 focus:ring-conservation-gold outline-none">
                  <option value="taquilla">Taquilla (Entradas y Membresías)</option>
                  <option value="cafeteria">Cafetería</option>
                  <option value="tienda">Tienda de Souvenirs</option>
                  <option value="general">Caja General</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-green-dark mb-1">NIP de Acceso (Autogenerado)</label>
                <div className="flex gap-2">
                  <input required type="text" maxLength={4} minLength={4} value={form.nip} onChange={e => setForm({...form, nip: e.target.value.replace(/[^0-9]/g, '')})} className="text-black bg-white font-semibold w-full font-mono text-center tracking-[0.5em] border border-forest-green-dark/20 rounded-xl p-2.5 focus:border-conservation-gold focus:ring-1 focus:ring-conservation-gold outline-none" />
                  <button type="button" onClick={() => setForm({...form, nip: generarNipAleatorio()})} className="px-3 bg-forest-green-dark/5 text-forest-green-dark rounded-xl hover:bg-forest-green-dark/10 transition-colors">
                    Generar
                  </button>
                </div>
                <p className="text-xs text-forest-green-dark/40 mt-1 flex items-center gap-1"><ShieldAlert className="h-3 w-3" /> Guárdalo en un lugar seguro antes de dárselo al cajero.</p>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl font-medium border border-forest-green-dark/20 text-forest-green-dark hover:bg-forest-green-dark/5 transition-colors">Cancelar</button>
                <button type="submit" disabled={saving || form.nip.length !== 4} className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-forest-green-dark text-white hover:bg-forest-green-dark/90 transition-colors disabled:opacity-50">{saving ? 'Creando...' : 'Crear Caja'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
