'use client'

import { useState, useEffect, useTransition } from 'react'
import Image from 'next/image'
import { X, Loader2, Upload, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/lib/database.types'
import { uploadEspecieImagen, createActualizacion, deleteActualizacion, type ActualizacionInput } from './actions'
import { getActualizaciones } from '@/app/actions/liberacion'

type ActualizacionRow = Database['public']['Tables']['actualizaciones_liberacion']['Row']

export default function AdministrarActualizacionesModal({
  tarjetaId,
  tarjetaNombre,
  onClose
}: {
  tarjetaId: string
  tarjetaNombre: string
  onClose: () => void
}) {
  const [actualizaciones, setActualizaciones] = useState<ActualizacionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [isPending, startTransition] = useTransition()

  const [form, setForm] = useState<Partial<ActualizacionInput>>({
    tarjeta_id: tarjetaId,
    titulo: '',
    descripcion: '',
    fecha: new Date().toISOString().split('T')[0],
    imagen_url: null,
  })
  const [uploadingImg, setUploadingImg] = useState(false)

  const loadData = async () => {
    setLoading(true)
    const data = await getActualizaciones(tarjetaId)
    setActualizaciones(data || [])
    setLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [tarjetaId])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImg(true)
    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadEspecieImagen(fd)
    if ('error' in result) {
      toast.error(result.error)
    } else {
      setForm((f) => ({ ...f, imagen_url: result.url }))
      toast.success('Imagen subida')
    }
    setUploadingImg(false)
  }

  const handleSubmit = () => {
    if (!form.titulo || !form.descripcion || !form.fecha) {
      toast.error('Completa los campos obligatorios')
      return
    }

    startTransition(async () => {
      const res = await createActualizacion(form as ActualizacionInput)
      if ('error' in res) {
        toast.error(res.error)
      } else {
        toast.success('Actualización agregada')
        setShowForm(false)
        setForm({
          tarjeta_id: tarjetaId,
          titulo: '',
          descripcion: '',
          fecha: new Date().toISOString().split('T')[0],
          imagen_url: null,
        })
        loadData()
      }
    })
  }

  const handleDelete = (id: string) => {
    if (!confirm('¿Eliminar esta actualización?')) return
    startTransition(async () => {
      const res = await deleteActualizacion(id)
      if ('error' in res) {
        toast.error(res.error)
      } else {
        toast.success('Actualización eliminada')
        loadData()
      }
    })
  }

  const inputCls = 'w-full px-3 py-2 border border-forest-green-dark/20 rounded-lg focus:border-quetzal-blue focus:outline-none text-sm text-forest-green-dark'
  const labelCls = 'block text-xs font-semibold text-forest-green-dark/60 uppercase tracking-wider mb-1'

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <div>
            <h2 className="text-xl font-bold text-forest-green-dark">Bitácora de Vuelo</h2>
            <p className="text-sm text-forest-green-dark/60">Especie: {tarjetaNombre}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <X className="w-5 h-5 text-forest-green-dark/50" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-off-white">
          {!showForm ? (
            <button
              onClick={() => setShowForm(true)}
              className="flex items-center gap-2 bg-quetzal-blue text-white font-bold px-4 py-2 rounded-xl hover:bg-blue-600 transition-colors text-sm"
            >
              <Plus className="w-4 h-4" /> Agregar Actualización
            </button>
          ) : (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm space-y-4">
              <h3 className="font-bold text-forest-green-dark">Nueva Actualización</h3>
              
              <div>
                <label className={labelCls}>Título *</label>
                <input className={inputCls} value={form.titulo} onChange={e => setForm({...form, titulo: e.target.value})} placeholder="Ej: Semana 1: Adaptación al nuevo espacio" />
              </div>

              <div>
                <label className={labelCls}>Descripción *</label>
                <textarea rows={3} className={inputCls} value={form.descripcion} onChange={e => setForm({...form, descripcion: e.target.value})} />
              </div>

              <div>
                <label className={labelCls}>Fecha *</label>
                <input type="date" className={inputCls} value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})} />
              </div>

              <div>
                <label className={labelCls}>Imagen</label>
                <div className="flex items-center gap-3">
                  {form.imagen_url && (
                    <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                      <Image src={form.imagen_url} alt="Preview" fill className="object-cover" />
                    </div>
                  )}
                  <label className="flex items-center gap-2 cursor-pointer bg-forest-green-dark/5 hover:bg-forest-green-dark/10 border border-forest-green-dark/20 text-forest-green-dark/70 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                    {uploadingImg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                    {uploadingImg ? 'Subiendo...' : 'Subir imagen'}
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
                  </label>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={handleSubmit} disabled={isPending} className="bg-forest-green-dark text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-forest-green-light transition-colors">
                  {isPending && <Loader2 className="w-4 h-4 animate-spin" />} Guardar
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm font-medium text-forest-green-dark/60 hover:bg-gray-100 transition-colors">
                  Cancelar
                </button>
              </div>
            </div>
          )}

          {/* Listado */}
          <div className="space-y-4">
            {loading ? (
              <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-quetzal-blue" /></div>
            ) : actualizaciones.length === 0 ? (
              <p className="text-center text-forest-green-dark/40 py-8 text-sm">No hay actualizaciones registradas.</p>
            ) : (
              actualizaciones.map(act => (
                <div key={act.id} className="bg-white p-4 rounded-xl border border-gray-200 flex gap-4">
                  {act.imagen_url && (
                    <div className="relative w-20 h-20 rounded-lg overflow-hidden shrink-0">
                      <Image src={act.imagen_url} alt={act.titulo} fill className="object-cover" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <h4 className="font-bold text-forest-green-dark truncate">{act.titulo}</h4>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs text-forest-green-dark/50 bg-gray-100 px-2 py-1 rounded-md">{act.fecha}</span>
                        <button onClick={() => handleDelete(act.id)} disabled={isPending} className="text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-forest-green-dark/70 mt-1 line-clamp-2">{act.descripcion}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
