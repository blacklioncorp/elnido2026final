'use client'

import { useState, useTransition, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import {
  Plus, Edit2, Trash2, Eye, EyeOff, X, Upload, Loader2, Bird, Search,
  QrCode, BarChart3, TrendingUp, Sparkles, Smartphone
} from 'lucide-react'
import {
  createFauna, updateFauna, deleteFauna, toggleFaunaActivo, uploadFaunaImagen
} from '@/app/actions/fauna'
import type { FaunaInput } from '@/app/actions/fauna'
import type { Database, FaunaTipo } from '@/lib/database.types'
import { compressImageClient } from '@/lib/client-image-compression'
import dynamic from 'next/dynamic'

const QRModal = dynamic(() => import('@/components/admin/fauna/QRModal'), { ssr: false })

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

interface EstadisticasQR {
  totalMes: number
  totalGlobal: number
  conteoPorEspecie: Record<string, number>
  conteoPorSlug: Record<string, number>
  especieMasEscaneada: { slug: string; total: number } | null
}

interface Props {
  inicial: Especie[]
  estadisticasQR?: EstadisticasQR
}

export default function FaunaAdminClient({
  inicial,
  estadisticasQR = {
    totalMes: 0,
    totalGlobal: 0,
    conteoPorEspecie: {},
    conteoPorSlug: {},
    especieMasEscaneada: null,
  }
}: Props) {
  const [especies, setEspecies] = useState<Especie[]>(inicial)
  const [busqueda, setBusqueda] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editando, setEditando] = useState<Especie | null>(null)
  const [form, setForm] = useState<FaunaInput>(EMPTY_FORM)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [fileName, setFileName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const [qrEspecie, setQrEspecie] = useState<Especie | null>(null)
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

    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!formatosPermitidos.includes(file.type)) {
      toast.error(`❌ Formato no soportado: ${file.type}. Usa JPG, PNG, WebP o GIF.`)
      return
    }
    
    setFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`)
    setUploadingImg(true)
    try {
      const compressed = await compressImageClient(file)
      const fd = new FormData()
      fd.append('file', compressed)
      const res = await uploadFaunaImagen(fd)
      if ('error' in res) { 
        toast.error(res.error)
        return 
      }
      setForm(f => ({ ...f, imagen_url: res.url }))
      toast.success('Imagen subida y optimizada ✓')
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(error.message || 'Error inesperado al subir la imagen.')
    } finally {
      setUploadingImg(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      if (editando) {
        const res = await updateFauna(editando.id, form)
        if ('error' in res) { toast.error(res.error); return }
        setEspecies(prev => prev.map(item => item.id === editando.id ? { ...item, ...form } : item))
        toast.success('Especie actualizada')
      } else {
        const res = await createFauna(form)
        if ('error' in res) { toast.error(res.error); return }
        const nueva: Especie = {
          id: res.id ?? crypto.randomUUID(),
          ...form,
          nombre_cientifico: form.nombre_cientifico ?? null,
          descripcion: form.descripcion ?? null,
          historia: form.historia ?? null,
          imagen_url: form.imagen_url || null,
          galeria: form.galeria ?? [],
          slug: form.slug ?? form.nombre.toLowerCase().replace(/\s+/g, '-'),
          activo: form.activo ?? true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setEspecies(prev => [nueva, ...prev])
        toast.success('Especie creada')
      }
      setPanelOpen(false)
    })
  }

  function handleToggle(id: string, activoActual: boolean) {
    startTransition(async () => {
      const res = await toggleFaunaActivo(id, !activoActual)
      if ('error' in res) { toast.error(res.error); return }
      setEspecies(prev => prev.map(e => e.id === id ? { ...e, activo: !activoActual } : e))
      toast.success(activoActual ? 'Especie desactivada' : 'Especie activada')
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

  // Nombre de la especie más escaneada
  const especieMasEscaneadaNombre = estadisticasQR.especieMasEscaneada
    ? especies.find(e => e.slug === estadisticasQR.especieMasEscaneada?.slug)?.nombre || estadisticasQR.especieMasEscaneada.slug
    : '—'

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-off-white">Catálogo de Fauna</h1>
          <p className="text-off-white/50 text-sm">Gestiona las especies del santuario y sus códigos QR de recinto</p>
        </div>
        <button
          onClick={abrirCrear}
          className="bg-conservation-gold text-forest-green-dark hover:bg-conservation-gold/90 font-bold px-4 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2 text-sm shadow-md"
        >
          <Plus className="h-4 w-4" /> Nueva Especie
        </button>
      </div>

      {/* 📊 Tarjeta de Estadísticas de QR */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-forest-green-light/40 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-quetzal-blue/20 text-quetzal-blue">
            <Smartphone className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-off-white/50 uppercase tracking-wider font-semibold">Escaneos este mes</p>
            <p className="text-2xl font-black text-off-white">{estadisticasQR.totalMes}</p>
          </div>
        </div>

        <div className="bg-forest-green-light/40 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-conservation-gold/20 text-conservation-gold">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs text-off-white/50 uppercase tracking-wider font-semibold">Total Histórico</p>
            <p className="text-2xl font-black text-off-white">{estadisticasQR.totalGlobal}</p>
          </div>
        </div>

        <div className="bg-forest-green-light/40 border border-white/10 rounded-2xl p-4 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-xs text-off-white/50 uppercase tracking-wider font-semibold">Más Escaneada</p>
            <p className="text-lg font-bold text-off-white truncate">{especieMasEscaneadaNombre}</p>
            {estadisticasQR.especieMasEscaneada && (
              <p className="text-xs text-emerald-400/80 font-medium">
                {estadisticasQR.especieMasEscaneada.total} escaneos
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Buscador */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-off-white/40" />
        <input
          value={busqueda}
          onChange={e => setBusqueda(e.target.value)}
          placeholder="Buscar por nombre común o científico…"
          className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-off-white placeholder-off-white/30 text-sm focus:outline-none focus:border-conservation-gold/50"
        />
      </div>

      {/* Tabla */}
      <div className="bg-forest-green-light/20 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-off-white/40 uppercase text-xs tracking-wider">
              <th className="text-left p-4">Especie</th>
              <th className="text-left p-4 hidden md:table-cell">Tipo</th>
              <th className="text-left p-4 hidden lg:table-cell">Nombre Científico</th>
              <th className="text-center p-4">Escaneos QR</th>
              <th className="text-center p-4 hidden sm:table-cell">Estado</th>
              <th className="text-center p-4">Generar QR</th>
              <th className="text-right p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtradas.length === 0 ? (
              <tr><td colSpan={7} className="p-16 text-center text-off-white/30">
                <Bird className="h-10 w-10 mx-auto mb-3 opacity-30" />
                {busqueda ? 'Sin resultados para tu búsqueda' : 'No hay especies. ¡Crea la primera!'}
              </td></tr>
            ) : filtradas.map(e => {
              const escaneos = estadisticasQR.conteoPorEspecie[e.id] || estadisticasQR.conteoPorSlug[e.slug] || 0
              return (
                <tr key={e.id} className="hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-forest-green-light/60 flex-shrink-0">
                        {e.imagen_url
                          ? <Image src={e.imagen_url} alt={e.nombre} fill className="object-cover" />
                          : <Bird className="h-5 w-5 m-auto text-off-white/20" />}
                      </div>
                      <div>
                        <span className="font-medium text-off-white">{e.nombre}</span>
                      </div>
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
                  {/* Escaneos counter */}
                  <td className="p-4 text-center">
                    <span className="inline-flex items-center gap-1 font-bold text-quetzal-blue bg-quetzal-blue/10 px-2.5 py-1 rounded-full text-xs">
                      <Smartphone className="h-3 w-3" />
                      {escaneos}
                    </span>
                  </td>
                  <td className="p-4 text-center hidden sm:table-cell">
                    <button onClick={() => handleToggle(e.id, e.activo)} title={e.activo ? 'Desactivar' : 'Activar'}
                      className={`p-1.5 rounded-lg transition-colors ${e.activo ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-off-white/30 hover:bg-white/10'}`}>
                      {e.activo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                    </button>
                  </td>
                  {/* QR Button */}
                  <td className="p-4 text-center">
                    <button
                      onClick={() => setQrEspecie(e)}
                      title="Ver / Imprimir código QR"
                      className="p-1.5 text-conservation-gold/80 hover:text-conservation-gold hover:bg-conservation-gold/10 rounded-lg transition-colors inline-flex items-center gap-1.5"
                    >
                      <QrCode className="h-4 w-4" />
                      <span className="text-xs font-semibold hidden md:inline">Ver QR</span>
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
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Panel lateral Crear / Editar */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setPanelOpen(false)} />
          <div className="relative w-full max-w-lg bg-forest-green-dark border-l border-white/10 h-full overflow-y-auto p-6 flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-white/10">
                <h2 className="text-lg font-bold text-off-white">{editando ? 'Editar Especie' : 'Nueva Especie'}</h2>
                <button type="button" onClick={() => setPanelOpen(false)} className="text-off-white/40 hover:text-off-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Imagen */}
              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">Foto Principal</label>
                {form.imagen_url && (
                  <div className="relative w-full h-36 rounded-xl overflow-hidden mb-2 bg-black/20">
                    <Image src={form.imagen_url} alt="Preview" fill className="object-cover" />
                    <button type="button" onClick={() => setForm(f => ({ ...f, imagen_url: '' }))}
                      className="absolute top-2 right-2 p-1 bg-black/60 rounded-full text-white hover:bg-black">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                )}
                <input ref={fileRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                <button type="button" onClick={() => fileRef.current?.click()} disabled={uploadingImg}
                  className="w-full border border-dashed border-white/20 hover:border-conservation-gold/50 rounded-xl p-3 text-off-white/60 hover:text-off-white text-xs flex items-center justify-center gap-2 transition-colors">
                  {uploadingImg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {uploadingImg ? 'Optimizando imagen…' : fileName || 'Subir foto (JPG, PNG, WebP)'}
                </button>
              </div>

              {/* Nombre */}
              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">Nombre Común *</label>
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
                  <p className="text-off-white/40 text-xs">Visible en el catálogo público</p>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.activo ? 'bg-conservation-gold' : 'bg-white/20'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.activo ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <button type="submit" disabled={isPending || uploadingImg}
                className="w-full bg-conservation-gold hover:bg-conservation-gold/90 disabled:opacity-50 text-forest-green-dark font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                {uploadingImg ? <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo y optimizando…</> : isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : (editando ? 'Actualizar Especie' : 'Crear Especie')}
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

      {/* Modal QR simplificado */}
      {qrEspecie && (
        <QRModal
          especie={{
            id: qrEspecie.id,
            nombre: qrEspecie.nombre,
            slug: qrEspecie.slug,
            imagen_url: qrEspecie.imagen_url,
          }}
          escaneosCount={
            estadisticasQR.conteoPorEspecie[qrEspecie.id] ||
            estadisticasQR.conteoPorSlug[qrEspecie.slug] ||
            0
          }
          onClose={() => setQrEspecie(null)}
        />
      )}
    </div>
  )
}
