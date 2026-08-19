'use client'

import { useState, useTransition, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Plus, Check, X, Clock, Eye, BookOpen, AlertCircle, ChevronDown, Upload, Loader2, Search, Send, RotateCcw } from 'lucide-react'
import {
  crearEntradaBitacora, aprobarEntradaBitacora, rechazarEntradaBitacora,
  reenviarARevision, uploadBitacoraImagen
} from '@/app/actions/bitacora'
import type { BitacoraInput } from '@/app/actions/bitacora'
import type { Database, BitacoraEstado, BitacoraVisibilidad } from '@/lib/database.types'
import { formatDate } from '@/lib/utils'

type Entrada = Database['public']['Tables']['bitacora']['Row'] & {
  fauna?: { nombre: string; slug: string } | null
}
type Fauna = Pick<Database['public']['Tables']['fauna']['Row'], 'id' | 'nombre'>

const ESTADO_CONFIG: Record<BitacoraEstado, { label: string; color: string; icon: React.ReactNode }> = {
  borrador:   { label: 'Borrador',  color: 'text-off-white/40 bg-white/5 border-white/10', icon: <Clock className="h-3 w-3" /> },
  revision:   { label: 'Revisión',  color: 'text-amber-400 bg-amber-500/10 border-amber-500/20', icon: <AlertCircle className="h-3 w-3" /> },
  publicado:  { label: 'Publicado', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', icon: <Eye className="h-3 w-3" /> },
  rechazado:  { label: 'Rechazado', color: 'text-red-400 bg-red-500/10 border-red-500/20', icon: <X className="h-3 w-3" /> },
}

interface Props {
  inicial: Entrada[]
  faunaList: Fauna[]
  userId: string
  adminRole: string | null
}

export default function BitacoraAdminClient({ inicial, faunaList, userId, adminRole }: Props) {
  const isEditor = adminRole === 'editor' || adminRole === 'superadmin'
  const [entradas, setEntradas] = useState<Entrada[]>(inicial)
  const [tabActiva, setTabActiva] = useState<'mis_entradas' | 'revision' | 'publicadas' | 'rechazadas'>('mis_entradas')
  const [busqueda, setBusqueda] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [rechazarModal, setRechazarModal] = useState<{ id: string } | null>(null)
  const [comentarioRechazo, setComentarioRechazo] = useState('')
  const [form, setForm] = useState<BitacoraInput & { fauna_id?: string }>({
    titulo: '', contenido: '', imagen_url: '', video_url: '', visibilidad: 'publico', fauna_id: undefined,
  })
  const [uploadingImg, setUploadingImg] = useState(false)
  const [fileName, setFileName] = useState('')
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  // Tabs
  const misEntradas = entradas.filter(e => e.autor_id === userId)
  const pendientes = entradas.filter(e => e.estado === 'revision')
  const publicadas = entradas.filter(e => e.estado === 'publicado')
  const rechazadas = entradas.filter(e => e.estado === 'rechazado')

  const displayList = (() => {
    const list = tabActiva === 'mis_entradas' ? misEntradas
      : tabActiva === 'revision' ? pendientes
      : tabActiva === 'publicadas' ? publicadas
      : rechazadas
    return list.filter(e =>
      e.titulo.toLowerCase().includes(busqueda.toLowerCase())
    )
  })()

  async function handleImageUpload(ev: React.ChangeEvent<HTMLInputElement>) {
    const file = ev.target.files?.[0]; if (!file) return
    if (file.size > 10 * 1024 * 1024) { 
      toast.error(`❌ ${file.name} pesa ${(file.size / 1024 / 1024).toFixed(2)} MB. Máximo: 10 MB.`)
      return 
    }

    const formatosPermitidos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!formatosPermitidos.includes(file.type)) {
      toast.error(`❌ Formato no soportado: ${file.type}. Usa JPG, PNG, WebP o GIF.`)
      return
    }
    
    setFileName(`${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`)
    setUploadingImg(true)
    const fd = new FormData(); fd.append('file', file)
    const res = await uploadBitacoraImagen(fd)
    setUploadingImg(false)
    if ('error' in res) { toast.error(res.error); return }
    setForm(f => ({ ...f, imagen_url: res.url }))
    toast.success('Imagen subida ✓')
  }

  function handleCrear(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const { fauna_id, ...rest } = form
      const res = await crearEntradaBitacora({ ...rest, fauna_id: fauna_id || null }, userId)
      if ('error' in res) { toast.error(res.error); return }
      toast.success('Entrada enviada a revisión ✓')
      setPanelOpen(false)
      setForm({ titulo: '', contenido: '', imagen_url: '', video_url: '', visibilidad: 'publico', fauna_id: undefined })
      const { getEntradasBitacora } = await import('@/app/actions/bitacora')
      setEntradas(await getEntradasBitacora())
    })
  }

  function handleAprobar(id: string) {
    startTransition(async () => {
      const res = await aprobarEntradaBitacora(id, userId)
      if ('error' in res) { toast.error(res.error); return }
      setEntradas(prev => prev.map(e => e.id === id ? { ...e, estado: 'publicado' as BitacoraEstado } : e))
      toast.success('Entrada publicada ✓')
    })
  }

  function handleRechazar() {
    if (!rechazarModal || !comentarioRechazo.trim()) { toast.error('Agrega un comentario de revisión'); return }
    startTransition(async () => {
      const res = await rechazarEntradaBitacora(rechazarModal.id, userId, comentarioRechazo)
      if ('error' in res) { toast.error(res.error); return }
      setEntradas(prev => prev.map(e => e.id === rechazarModal.id
        ? { ...e, estado: 'rechazado' as BitacoraEstado, comentario_revision: comentarioRechazo }
        : e
      ))
      setRechazarModal(null); setComentarioRechazo('')
      toast.success('Entrada rechazada con comentario')
    })
  }

  function handleReenviar(id: string) {
    startTransition(async () => {
      const res = await reenviarARevision(id)
      if ('error' in res) { toast.error(res.error); return }
      setEntradas(prev => prev.map(e => e.id === id ? { ...e, estado: 'revision' as BitacoraEstado } : e))
      toast.success('Entrada reenviada a revisión')
    })
  }

  const tabs = [
    { id: 'mis_entradas', label: 'Mis Entradas', count: misEntradas.length },
    ...(isEditor ? [
      { id: 'revision',   label: '🔔 Pendientes', count: pendientes.length },
      { id: 'publicadas', label: 'Publicadas',    count: publicadas.length },
      { id: 'rechazadas', label: 'Rechazadas',    count: rechazadas.length },
    ] : []),
  ] as const

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-off-white tracking-tight">Bitácora de Campo</h1>
          <p className="text-off-white/50 mt-1">{entradas.length} entrada{entradas.length !== 1 ? 's' : ''} en total</p>
        </div>
        <button onClick={() => setPanelOpen(true)}
          className="flex items-center gap-2 bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-105">
          <Plus className="h-4 w-4" /> Nueva Entrada
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-forest-green-light/30 p-1 rounded-xl w-fit overflow-x-auto">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setTabActiva(tab.id as typeof tabActiva)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-200 ${tabActiva === tab.id ? 'bg-conservation-gold text-forest-green-dark' : 'text-off-white/60 hover:text-off-white hover:bg-white/10'}`}>
            {tab.label}
            {tab.count > 0 && <span className={`px-1.5 py-0.5 rounded-full text-xs font-bold ${tabActiva === tab.id ? 'bg-forest-green-dark/20' : 'bg-white/10'}`}>{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-off-white/30" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar entradas…"
          className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-off-white placeholder-off-white/30 text-sm focus:outline-none focus:border-conservation-gold/50" />
      </div>

      {/* Lista */}
      <div className="space-y-3">
        {displayList.length === 0 ? (
          <div className="bg-forest-green-light/30 border border-white/10 rounded-2xl p-16 text-center">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-20 text-off-white" />
            <p className="text-off-white/40">
              {tabActiva === 'revision' ? 'No hay entradas pendientes de revisión' : 'No hay entradas aquí aún'}
            </p>
          </div>
        ) : displayList.map(e => {
          const cfg = ESTADO_CONFIG[e.estado as BitacoraEstado] ?? ESTADO_CONFIG.borrador
          return (
            <div key={e.id} className="bg-forest-green-light/30 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    {e.fauna && <span className="text-conservation-gold text-xs font-medium">{e.fauna.nombre}</span>}
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${
                      e.visibilidad === 'publico' ? 'text-sky-400 bg-sky-500/10 border-sky-500/20'
                      : e.visibilidad === 'padrinos' ? 'text-purple-400 bg-purple-500/10 border-purple-500/20'
                      : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                    }`}>{e.visibilidad}</span>
                  </div>
                  <h3 className="text-off-white font-bold text-base mb-1 line-clamp-1">{e.titulo}</h3>
                  <p className="text-off-white/50 text-sm line-clamp-2">{e.contenido.slice(0, 150)}…</p>
                  {e.comentario_revision && (
                    <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 text-xs font-semibold mb-1">Comentario del revisor:</p>
                      <p className="text-red-300 text-sm">{e.comentario_revision}</p>
                    </div>
                  )}
                  <p className="text-off-white/30 text-xs mt-2">{formatDate(e.created_at)}</p>
                </div>

                {/* Acciones según rol y estado */}
                <div className="flex flex-row sm:flex-col gap-2 shrink-0">
                  {isEditor && e.estado === 'revision' && (
                    <>
                      <button onClick={() => handleAprobar(e.id)} disabled={isPending}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50">
                        <Check className="h-3 w-3" /> Aprobar
                      </button>
                      <button onClick={() => setRechazarModal({ id: e.id })}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 font-semibold text-xs rounded-lg transition-colors">
                        <X className="h-3 w-3" /> Rechazar
                      </button>
                    </>
                  )}
                  {e.estado === 'rechazado' && e.autor_id === userId && (
                    <button onClick={() => handleReenviar(e.id)} disabled={isPending}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 font-semibold text-xs rounded-lg transition-colors disabled:opacity-50">
                      <RotateCcw className="h-3 w-3" /> Reenviar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Panel nueva entrada */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setPanelOpen(false)} />
          <div className="w-full max-w-lg bg-forest-green-dark border-l border-white/10 h-full overflow-y-auto">
            <div className="sticky top-0 bg-forest-green-dark border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-off-white">Nueva Entrada de Bitácora</h2>
              <button onClick={() => setPanelOpen(false)} className="text-off-white/40 hover:text-off-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleCrear} className="p-6 space-y-5">
              {/* Especie */}
              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">Especie Relacionada</label>
                <select value={form.fauna_id ?? ''} onChange={e => setForm(f => ({ ...f, fauna_id: e.target.value || undefined }))}
                  className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white text-sm focus:outline-none focus:border-conservation-gold/50">
                  <option value="">— Sin especie específica —</option>
                  {faunaList.map(f => <option key={f.id} value={f.id}>{f.nombre}</option>)}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">Título *</label>
                <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Título de la observación" required
                  className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm focus:outline-none focus:border-conservation-gold/50" />
              </div>

              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">Contenido *</label>
                <textarea value={form.contenido} onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))} rows={8} placeholder="Describe la observación, mediciones, comportamiento…" required
                  className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm resize-none focus:outline-none focus:border-conservation-gold/50" />
              </div>

              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-2 block">Imagen</label>
                <div className="relative h-32 bg-forest-green-light/40 rounded-xl border border-white/10 border-dashed overflow-hidden cursor-pointer hover:border-conservation-gold/50 transition-colors" onClick={() => fileRef.current?.click()}>
                  {form.imagen_url
                    ? <Image src={form.imagen_url} alt="Preview" fill className="object-cover" />
                    : <div className="flex flex-col items-center justify-center h-full text-off-white/30 px-4 text-center"><Upload className="h-6 w-6 mb-1" /><span className="text-xs">{uploadingImg ? `Procesando: ${fileName}...` : 'Subir imagen (Max 10MB)'}</span></div>}
                  {uploadingImg && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-conservation-gold" /></div>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
              </div>

              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">URL de Video (YouTube/Vimeo)</label>
                <input value={form.video_url ?? ''} onChange={e => setForm(f => ({ ...f, video_url: e.target.value }))} placeholder="https://youtube.com/…" type="url"
                  className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm focus:outline-none focus:border-conservation-gold/50" />
              </div>

              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">Visibilidad</label>
                <select value={form.visibilidad} onChange={e => setForm(f => ({ ...f, visibilidad: e.target.value as BitacoraVisibilidad }))}
                  className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white text-sm focus:outline-none focus:border-conservation-gold/50">
                  <option value="publico">🌍 Público — visible para todos</option>
                  <option value="padrinos">🔒 Solo Padrinos — requiere membresía activa</option>
                  <option value="mixto">✂️ Mixto — resumen público + detalle para padrinos</option>
                </select>
              </div>

              <div className="pt-2 border-t border-white/10">
                <p className="text-off-white/40 text-xs mb-3 flex items-center gap-1.5">
                  <Send className="h-3 w-3" /> Al guardar, la entrada pasa a revisión del editor
                </p>
                <button type="submit" disabled={isPending || uploadingImg}
                  className="w-full bg-conservation-gold hover:bg-conservation-gold/90 disabled:opacity-50 text-forest-green-dark font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                  {uploadingImg ? <><Loader2 className="h-4 w-4 animate-spin" /> Subiendo y optimizando…</> : isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : 'Enviar a Revisión'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal rechazar con comentario */}
      {rechazarModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRechazarModal(null)} />
          <div className="relative bg-forest-green-dark border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-off-white mb-2">Rechazar entrada</h3>
            <p className="text-off-white/60 text-sm mb-4">El cuidador verá este comentario para mejorar la entrada.</p>
            <textarea value={comentarioRechazo} onChange={e => setComentarioRechazo(e.target.value)} rows={4} placeholder="Explica por qué se rechaza y qué debe mejorar…"
              className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm resize-none focus:outline-none focus:border-red-500/50 mb-4" />
            <div className="flex gap-3">
              <button onClick={() => setRechazarModal(null)} className="flex-1 bg-white/10 hover:bg-white/20 text-off-white font-medium py-2.5 rounded-xl transition-colors">Cancelar</button>
              <button onClick={handleRechazar} disabled={isPending} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors">{isPending ? 'Rechazando…' : 'Rechazar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
