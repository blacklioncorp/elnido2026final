'use client'

import { useState, useTransition, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Eye, EyeOff, X, Upload, Loader2, Bird, Search } from 'lucide-react'
import {
  createFauna, updateFauna, deleteFauna, toggleFaunaActivo, uploadFaunaImagen
} from '@/app/actions/fauna'
import type { FaunaInput } from '@/app/actions/fauna'
import type { Database, FaunaTipo } from '@/lib/database.types'

type Especie = Database['public']['Tables']['fauna']['Row']

const TIPO_LABELS: Record<FaunaTipo, string> = {
  ave: 'Ave', mamifero: 'Mamífero', reptil: 'Reptil',
  felino: 'Felino', primate: 'Primate', otro: 'Otro',
}
const TIPO_COLORS: Record<FaunaTipo, string> = {
  ave:      'bg-sky-500/20 text-sky-300 border-sky-500/30',
  mamifero: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  reptil:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  felino:   'bg-orange-500/20 text-orange-300 border-orange-500/30',
  primate:  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  otro:     'bg-white/10 text-off-white/60 border-white/10',
}

const EMPTY_FORM: FaunaInput = {
  nombre: '', nombre_cientifico: '', tipo: 'ave',
  descripcion: '', historia: '', imagen_url: '', galeria: [], activo: true,
}

interface Props { inicial: Especie[] }

export default function FaunaAdminClient({ inicial }: Props) {
  const [especies, setEspecies] = useState<Especie[]>(inicial)
  const [busqueda, setBusqueda] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editando, setEditando] = useState<Especie | null>(null)
  const [form, setForm] = useState<FaunaInput>(EMPTY_FORM)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [fileName, setFileName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const filtradas = especies.filter(e =>
    e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (e.nombre_cientifico ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  function abrirCrear() {
    setEditando(null)
    setForm(EMPTY_FORM)
    setPanelOpen(true)
  }

  function abrirEditar(e: Especie) {
    setEditando(e)
    setForm({
      nombre: e.nombre, nombre_cientifico: e.nombre_cientifico ?? '',
      tipo: e.tipo as FaunaTipo, descripcion: e.descripcion ?? '',
      historia: e.historia ?? '', imagen_url: e.imagen_url ?? '',
      galeria: e.galeria ?? [], activo: e.activo, slug: e.slug,
    })
    setPanelOpen(true)
  }

  async function handleImageUpload(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { 
      toast.error('La imagen no debe superar 10 MB. Comprímela en squoosh.app')
      return 
    }
    
    setFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`)
    setUploadingImg(true)
    const fd = new FormData(); fd.append('file', file)
    try {
      const res = await uploadFaunaImagen(fd)
      if ('error' in res) { 
        toast.error(res.error)
        return 
      }
      setForm(f => ({ ...f, imagen_url: res.url }))
      toast.success('Imagen subida ✓')
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(error.message || 'Error inesperado al subir la imagen. Verifica tu conexión y el tamaño.')
    } finally {
      setUploadingImg(false)
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      let res
      if (editando) {
        res = await updateFauna(editando.id, form)
      } else {
        res = await createFauna(form)
      }
      if ('error' in res) { toast.error(res.error); return }
      toast.success(editando ? 'Especie actualizada ✓' : 'Especie creada ✓')
      setPanelOpen(false)
      // Refrescar lista
      const { getFauna } = await import('@/app/actions/fauna')
      setEspecies(await getFauna())
    })
  }

  function handleToggle(id: string, activo: boolean) {
    startTransition(async () => {
      const res = await toggleFaunaActivo(id, !activo)
      if ('error' in res) { toast.error(res.error); return }
      setEspecies(prev => prev.map(e => e.id === id ? { ...e, activo: !activo } : e))
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteFauna(id)
      if ('error' in res) { toast.error(res.error); return }
      setEspecies(prev => prev.filter(e => e.id !== id))
      setConfirmDelete(null)
      toast.success('Especie eliminada')
    })
  }

  return (
    <div className="p-6 md:p-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-off-white tracking-tight">Gestión de Fauna</h1>
          <p className="text-off-white/50 mt-1">{especies.length} especie{especies.length !== 1 ? 's' : ''} registrada{especies.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-105">
          <Plus className="h-4 w-4" /> Nueva Especie
        </button>
      </div>

      {/* Búsqueda */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-off-white/30" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar especie…"
          className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-off-white placeholder-off-white/30 text-sm focus:outline-none focus:border-conservation-gold/50" />
      </div>

      {/* Tabla */}
      <div className="bg-forest-green-light/30 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-off-white/40 uppercase text-xs tracking-wider">
              <th className="text-left p-4">Especie</th>
              <th className="text-left p-4 hidden md:table-cell">Tipo</th>
              <th className="text-left p-4 hidden lg:table-cell">Nombre Científico</th>
              <th className="text-center p-4">Estado</th>
              <th className="text-right p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtradas.length === 0 ? (
              <tr><td colSpan={5} className="p-16 text-center text-off-white/30">
                <Bird className="h-10 w-10 mx-auto mb-3 opacity-30" />
                {busqueda ? 'Sin resultados para tu búsqueda' : 'No hay especies. ¡Crea la primera!'}
              </td></tr>
            ) : filtradas.map(e => (
              <tr key={e.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-forest-green-light/60 flex-shrink-0">
                      {e.imagen_url
                        ? <Image src={e.imagen_url} alt={e.nombre} fill className="object-cover" />
                        : <Bird className="h-5 w-5 m-auto text-off-white/20" />}
                    </div>
                    <span className="font-medium text-off-white">{e.nombre}</span>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold border ${TIPO_COLORS[e.tipo as FaunaTipo]}`}>
                    {TIPO_LABELS[e.tipo as FaunaTipo]}
                  </span>
                </td>
                <td className="p-4 hidden lg:table-cell text-off-white/50 italic">
                  {e.nombre_cientifico ?? '—'}
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => handleToggle(e.id, e.activo)} title={e.activo ? 'Desactivar' : 'Activar'}
                    className={`p-1.5 rounded-lg transition-colors ${e.activo ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-off-white/30 hover:bg-white/10'}`}>
                    {e.activo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => abrirEditar(e)}
                      className="p-1.5 text-off-white/50 hover:text-off-white hover:bg-white/10 rounded-lg transition-colors">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button onClick={() => setConfirmDelete(e.id)}
                      className="p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Panel lateral crear/editar */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setPanelOpen(false)} />
          <div className="w-full max-w-lg bg-forest-green-dark border-l border-white/10 h-full overflow-y-auto">
            <div className="sticky top-0 bg-forest-green-dark border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-off-white">{editando ? 'Editar Especie' : 'Nueva Especie'}</h2>
              <button onClick={() => setPanelOpen(false)} className="text-off-white/40 hover:text-off-white transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Imagen */}
              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-2 block">Imagen Principal</label>
                <div className="relative h-40 bg-forest-green-light/40 rounded-xl border border-white/10 border-dashed overflow-hidden cursor-pointer hover:border-conservation-gold/50 transition-colors" onClick={() => fileRef.current?.click()}>
                  {form.imagen_url
                    ? <Image src={form.imagen_url} alt="Preview" fill className="object-cover" />
                    : <div className="flex flex-col items-center justify-center h-full text-off-white/30 text-center px-4">
                        <Upload className="h-8 w-8 mb-2" />
                        <span className="text-sm">
                          {uploadingImg ? `Procesando: ${fileName}...` : 'Haz clic para subir (Max 10MB)'}
                        </span>
                      </div>}
                  {uploadingImg && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-conservation-gold" /></div>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
              </div>

              {/* Nombre */}
              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">Nombre *</label>
                <input value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                  placeholder="Ej: Quetzal Resplandeciente" required
                  className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm focus:outline-none focus:border-conservation-gold/50" />
              </div>

              {/* Nombre científico */}
              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">Nombre Científico</label>
                <input value={form.nombre_cientifico ?? ''} onChange={e => setForm(f => ({ ...f, nombre_cientifico: e.target.value }))}
                  placeholder="Ej: Pharomachrus mocinno"
                  className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm italic focus:outline-none focus:border-conservation-gold/50" />
              </div>

              {/* Tipo */}
              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">Tipo *</label>
                <select value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value as FaunaTipo }))}
                  className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white text-sm focus:outline-none focus:border-conservation-gold/50">
                  {Object.entries(TIPO_LABELS).map(([val, label]) => (
                    <option key={val} value={val}>{label}</option>
                  ))}
                </select>
              </div>

              {/* Descripción */}
              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">Descripción</label>
                <textarea value={form.descripcion ?? ''} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
                  rows={3} placeholder="Breve descripción de la especie…"
                  className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm resize-none focus:outline-none focus:border-conservation-gold/50" />
              </div>

              {/* Historia */}
              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">Historia / Contexto</label>
                <textarea value={form.historia ?? ''} onChange={e => setForm(f => ({ ...f, historia: e.target.value }))}
                  rows={5} placeholder="Historia de conservación, datos interesantes…"
                  className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm resize-none focus:outline-none focus:border-conservation-gold/50" />
              </div>

              {/* Activo toggle */}
              <div className="flex items-center justify-between py-3 border-t border-white/10">
                <div>
                  <p className="text-off-white font-medium text-sm">Especie activa</p>
                  <p className="text-off-white/40 text-xs">Visible en el sitio público</p>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.activo ? 'bg-conservation-gold' : 'bg-white/20'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.activo ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <button type="submit" disabled={isPending || uploadingImg}
                className="w-full bg-conservation-gold hover:bg-conservation-gold/90 disabled:opacity-50 text-forest-green-dark font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : (editando ? 'Actualizar Especie' : 'Crear Especie')}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Modal confirmación eliminar */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-forest-green-dark border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-off-white mb-2">¿Eliminar especie?</h3>
            <p className="text-off-white/60 text-sm mb-6">Esta acción no se puede deshacer. Las entradas de bitácora asociadas se desvinculan.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-off-white font-medium py-2.5 rounded-xl transition-colors">
                Cancelar
              </button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors">
                {isPending ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
