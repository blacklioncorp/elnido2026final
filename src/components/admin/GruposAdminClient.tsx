'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PaqueteEducativo, Cotizacion, EstadoCotizacion } from '@/types/grupos'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { Loader2, Edit, Save, X, Search, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Props {
  initialPaquetes: PaqueteEducativo[]
  initialCotizaciones: Cotizacion[]
}

type Tab = 'dashboard' | 'paquetes' | 'cotizaciones'

export default function GruposAdminClient({ initialPaquetes, initialCotizaciones }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [paquetes, setPaquetes] = useState(initialPaquetes)
  const [cotizaciones, setCotizaciones] = useState(initialCotizaciones)
  
  // Edit Paquete State
  const [editingPaqueteId, setEditingPaqueteId] = useState<string | null>(null)
  const [editFormData, setEditFormData] = useState<Partial<PaqueteEducativo>>({})
  const [isSaving, setIsSaving] = useState(false)

  // Cotizaciones Filter State
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  const supabase = createClient()

  // --- KPI Cálculos ---
  const pendientes = cotizaciones.filter(c => c.estado === 'pendiente').length
  const confirmadas = cotizaciones.filter(c => c.estado === 'confirmada').length
  const personasTotal = cotizaciones
    .filter(c => c.estado === 'confirmada')
    .reduce((acc, curr) => acc + curr.personas, 0)

  // --- Handlers ---
  const handleEditClick = (paquete: PaqueteEducativo) => {
    setEditingPaqueteId(paquete.id)
    setEditFormData({
      precio_por_persona: paquete.precio_por_persona,
      activo: paquete.activo,
      imagen_url: paquete.imagen_url || ''
    })
  }

  const handleSavePaquete = async (id: string) => {
    setIsSaving(true)
    try {
      const { error } = await supabase
        .from('paquetes_educativos')
        .update({
          precio_por_persona: editFormData.precio_por_persona,
          activo: editFormData.activo,
          imagen_url: editFormData.imagen_url || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)

      if (error) throw error

      setPaquetes(prev => prev.map(p => p.id === id ? { ...p, ...editFormData } as PaqueteEducativo : p))
      toast.success('Paquete actualizado')
      setEditingPaqueteId(null)
    } catch (error) {
      toast.error('Error al actualizar paquete')
    } finally {
      setIsSaving(false)
    }
  }

  const handleStatusChange = async (id: string, nuevoEstado: EstadoCotizacion) => {
    try {
      const { error } = await supabase
        .from('cotizaciones')
        .update({ estado: nuevoEstado })
        .eq('id', id)

      if (error) throw error

      setCotizaciones(prev => prev.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c))
      toast.success('Estado actualizado')

      if (nuevoEstado === 'confirmada') {
        toast('Puedes enviar un link de pago (Stripe) al cliente manualmente o implementarlo aquí en el futuro.', { icon: '💳' })
      }
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }

  // --- Render Functions ---
  const renderDashboard = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-off-white/60 text-sm font-medium mb-2">Solicitudes Pendientes</h3>
        <p className="text-4xl font-bold text-conservation-gold">{pendientes}</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-off-white/60 text-sm font-medium mb-2">Grupos Confirmados</h3>
        <p className="text-4xl font-bold text-green-400">{confirmadas}</p>
      </div>
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <h3 className="text-off-white/60 text-sm font-medium mb-2">Personas (Grupos)</h3>
        <p className="text-4xl font-bold text-quetzal-blue">{personasTotal}</p>
      </div>
    </div>
  )

  const renderPaquetes = () => (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <table className="w-full text-left text-sm text-off-white">
        <thead className="bg-white/5 border-b border-white/10 text-off-white/60">
          <tr>
            <th className="px-6 py-4 font-medium">Nombre</th>
            <th className="px-6 py-4 font-medium">Nivel</th>
            <th className="px-6 py-4 font-medium">Duración</th>
            <th className="px-6 py-4 font-medium">Precio (MXN)</th>
            <th className="px-6 py-4 font-medium">Estado</th>
            <th className="px-6 py-4 font-medium text-right">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/10">
          {paquetes.map(p => {
            const isEditing = editingPaqueteId === p.id
            return (
              <tr key={p.id} className="hover:bg-white/5 transition-colors">
                <td className="px-6 py-4 font-medium">{p.nombre}</td>
                <td className="px-6 py-4 capitalize">{p.nivel}</td>
                <td className="px-6 py-4">{p.duracion_horas}h</td>
                <td className="px-6 py-4">
                  {isEditing ? (
                    <input 
                      type="number" 
                      value={editFormData.precio_por_persona || 0}
                      onChange={e => setEditFormData({...editFormData, precio_por_persona: Number(e.target.value)})}
                      className="w-24 bg-white/10 border border-white/20 rounded px-2 py-1 text-off-white focus:outline-none"
                    />
                  ) : (
                    `$${p.precio_por_persona}`
                  )}
                </td>
                <td className="px-6 py-4">
                  {isEditing ? (
                    <select
                      value={editFormData.activo ? 'true' : 'false'}
                      onChange={e => setEditFormData({...editFormData, activo: e.target.value === 'true'})}
                      className="bg-white/10 border border-white/20 rounded px-2 py-1 text-off-white focus:outline-none"
                    >
                      <option value="true">Activo</option>
                      <option value="false">Inactivo</option>
                    </select>
                  ) : (
                    <span className={cn("px-2 py-1 rounded-full text-xs font-semibold", p.activo ? "bg-green-500/20 text-green-400" : "bg-red-500/20 text-red-400")}>
                      {p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-right">
                  {isEditing ? (
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingPaqueteId(null)} className="p-1.5 hover:bg-white/10 rounded-lg text-off-white/60 hover:text-off-white">
                        <X className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleSavePaquete(p.id)} disabled={isSaving} className="p-1.5 bg-conservation-gold hover:bg-conservation-gold/90 rounded-lg text-forest-green-dark">
                        {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => handleEditClick(p)} className="p-1.5 hover:bg-white/10 rounded-lg text-conservation-gold transition-colors">
                      <Edit className="w-4 h-4" />
                    </button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )

  const renderCotizaciones = () => {
    const filtradas = cotizaciones.filter(c => filtroEstado === 'todos' || c.estado === filtroEstado)
    
    return (
      <div className="space-y-4">
        <div className="flex gap-2">
          {['todos', 'pendiente', 'respondida', 'confirmada', 'cancelada'].map(est => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors border",
                filtroEstado === est
                  ? "bg-conservation-gold text-forest-green-dark border-conservation-gold"
                  : "bg-white/5 text-off-white/60 border-white/10 hover:bg-white/10 hover:text-off-white"
              )}
            >
              {est}
            </button>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm text-off-white">
            <thead className="bg-white/5 border-b border-white/10 text-off-white/60">
              <tr>
                <th className="px-6 py-4 font-medium">Fecha Req.</th>
                <th className="px-6 py-4 font-medium">Institución</th>
                <th className="px-6 py-4 font-medium">Paquete</th>
                <th className="px-6 py-4 font-medium">Pax</th>
                <th className="px-6 py-4 font-medium">Estado</th>
                <th className="px-6 py-4 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filtradas.map(c => (
                <tr key={c.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(c.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <p className="font-medium">{c.escuela}</p>
                    <p className="text-xs text-off-white/50">{c.cliente_nombre}</p>
                  </td>
                  <td className="px-6 py-4">{c.paquetes_educativos?.nombre}</td>
                  <td className="px-6 py-4">{c.personas}</td>
                  <td className="px-6 py-4">
                    <span className={cn("px-2 py-1 rounded-full text-xs font-semibold capitalize", 
                      c.estado === 'pendiente' && 'bg-yellow-500/20 text-yellow-400',
                      c.estado === 'respondida' && 'bg-blue-500/20 text-blue-400',
                      c.estado === 'confirmada' && 'bg-green-500/20 text-green-400',
                      c.estado === 'cancelada' && 'bg-red-500/20 text-red-400',
                    )}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <select
                      value={c.estado}
                      onChange={e => handleStatusChange(c.id, e.target.value as EstadoCotizacion)}
                      className="bg-white/5 border border-white/10 rounded px-2 py-1 text-xs text-off-white focus:outline-none focus:ring-1 focus:ring-conservation-gold cursor-pointer"
                    >
                      <option value="pendiente" className="bg-forest-green-dark">Pendiente</option>
                      <option value="respondida" className="bg-forest-green-dark">Respondida</option>
                      <option value="confirmada" className="bg-forest-green-dark">Confirmada</option>
                      <option value="cancelada" className="bg-forest-green-dark">Cancelada</option>
                    </select>
                  </td>
                </tr>
              ))}
              {filtradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-off-white/50">
                    No se encontraron cotizaciones.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {[
          { id: 'dashboard', label: 'Dashboard' },
          { id: 'paquetes', label: 'Paquetes Educativos' },
          { id: 'cotizaciones', label: 'Cotizaciones' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as Tab)}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-semibold transition-colors",
              activeTab === t.id 
                ? "bg-conservation-gold text-forest-green-dark" 
                : "bg-white/5 text-off-white/60 hover:bg-white/10 hover:text-off-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'dashboard' && renderDashboard()}
          {activeTab === 'paquetes' && renderPaquetes()}
          {activeTab === 'cotizaciones' && renderCotizaciones()}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
