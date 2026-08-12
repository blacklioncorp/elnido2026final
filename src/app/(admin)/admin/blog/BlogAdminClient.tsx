'use client'

import { useState, useTransition, useRef } from 'react'
import Image from 'next/image'
import { toast } from 'sonner'
import { Plus, Edit2, Trash2, Eye, EyeOff, X, Upload, Loader2, FileText, Search, Bold, Italic, Link as LinkIcon } from 'lucide-react'
import { createPost, updatePost, deletePost, toggleBlogPublicado, uploadBlogImagen } from '@/app/actions/blog'
import type { BlogInput } from '@/app/actions/blog'
import type { Database } from '@/lib/database.types'
import { formatDate } from '@/lib/utils'

type BlogPost = Database['public']['Tables']['blog']['Row']

const EMPTY_FORM: BlogInput = {
  titulo: '', contenido: '', excerpt: '', imagen_url: '', publicado: false,
}

interface Props { inicial: BlogPost[] }

export default function BlogAdminClient({ inicial }: Props) {
  const [posts, setPosts] = useState<BlogPost[]>(inicial)
  const [busqueda, setBusqueda] = useState('')
  const [panelOpen, setPanelOpen] = useState(false)
  const [editando, setEditando] = useState<BlogPost | null>(null)
  const [form, setForm] = useState<BlogInput>(EMPTY_FORM)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [fileName, setFileName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const filtrados = posts.filter(p =>
    p.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.excerpt ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  function abrirCrear() {
    setEditando(null)
    setForm(EMPTY_FORM)
    setPanelOpen(true)
  }

  function abrirEditar(p: BlogPost) {
    setEditando(p)
    setForm({ titulo: p.titulo, slug: p.slug, contenido: p.contenido, excerpt: p.excerpt ?? '', imagen_url: p.imagen_url ?? '', publicado: p.publicado })
    setPanelOpen(true)
  }

  function insertFormat(tag: string) {
    const ta = textareaRef.current
    if (!ta) return
    const start = ta.selectionStart
    const end = ta.selectionEnd
    const sel = ta.value.slice(start, end)
    const wrapped = `**${sel}**`.replace('****', tag === 'bold' ? '**texto**' : '')
    const newVal = ta.value.slice(0, start) + (tag === 'bold' ? `**${sel || 'texto'}**` : `_${sel || 'texto'}_`) + ta.value.slice(end)
    setForm(f => ({ ...f, contenido: newVal }))
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
    const res = await uploadBlogImagen(fd)
    setUploadingImg(false)
    if ('error' in res) { toast.error(res.error); return }
    setForm(f => ({ ...f, imagen_url: res.url }))
    toast.success('Imagen subida ✓')
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      let res
      if (editando) {
        res = await updatePost(editando.id, form)
      } else {
        res = await createPost(form)
      }
      if ('error' in res) { toast.error(res.error); return }
      toast.success(editando ? 'Post actualizado ✓' : 'Post creado ✓')
      setPanelOpen(false)
      const { getPosts } = await import('@/app/actions/blog')
      setPosts(await getPosts())
    })
  }

  function handleTogglePublicado(id: string, publicado: boolean) {
    startTransition(async () => {
      const res = await toggleBlogPublicado(id, !publicado)
      if ('error' in res) { toast.error(res.error); return }
      setPosts(prev => prev.map(p => p.id === id ? { ...p, publicado: !publicado } : p))
      toast.success(!publicado ? 'Post publicado ✓' : 'Post despublicado')
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deletePost(id)
      if ('error' in res) { toast.error(res.error); return }
      setPosts(prev => prev.filter(p => p.id !== id))
      setConfirmDelete(null)
      toast.success('Post eliminado')
    })
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-off-white tracking-tight">Blog</h1>
          <p className="text-off-white/50 mt-1">{posts.length} entrada{posts.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={abrirCrear}
          className="flex items-center gap-2 bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-105">
          <Plus className="h-4 w-4" /> Nuevo Post
        </button>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-off-white/30" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar posts…"
          className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-off-white placeholder-off-white/30 text-sm focus:outline-none focus:border-conservation-gold/50" />
      </div>

      <div className="bg-forest-green-light/30 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-off-white/40 uppercase text-xs tracking-wider">
              <th className="text-left p-4">Título</th>
              <th className="text-left p-4 hidden md:table-cell">Extracto</th>
              <th className="text-left p-4 hidden lg:table-cell">Fecha</th>
              <th className="text-center p-4">Estado</th>
              <th className="text-right p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtrados.length === 0 ? (
              <tr><td colSpan={5} className="p-16 text-center text-off-white/30">
                <FileText className="h-10 w-10 mx-auto mb-3 opacity-30" />
                {busqueda ? 'Sin resultados' : 'No hay posts. ¡Crea el primero!'}
              </td></tr>
            ) : filtrados.map(p => (
              <tr key={p.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-forest-green-light/60 flex-shrink-0">
                      {p.imagen_url
                        ? <Image src={p.imagen_url} alt={p.titulo} fill className="object-cover" />
                        : <FileText className="h-4 w-4 m-auto text-off-white/20" />}
                    </div>
                    <span className="font-medium text-off-white line-clamp-1">{p.titulo}</span>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell text-off-white/50 line-clamp-1 max-w-[200px]">{p.excerpt ?? '—'}</td>
                <td className="p-4 hidden lg:table-cell text-off-white/40 text-xs">{formatDate(p.created_at)}</td>
                <td className="p-4 text-center">
                  <button onClick={() => handleTogglePublicado(p.id, p.publicado)} title={p.publicado ? 'Despublicar' : 'Publicar'}
                    className={`p-1.5 rounded-lg transition-colors ${p.publicado ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-off-white/30 hover:bg-white/10'}`}>
                    {p.publicado ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button onClick={() => abrirEditar(p)} className="p-1.5 text-off-white/50 hover:text-off-white hover:bg-white/10 rounded-lg transition-colors"><Edit2 className="h-4 w-4" /></button>
                    <button onClick={() => setConfirmDelete(p.id)} className="p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Panel lateral */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setPanelOpen(false)} />
          <div className="w-full max-w-xl bg-forest-green-dark border-l border-white/10 h-full overflow-y-auto">
            <div className="sticky top-0 bg-forest-green-dark border-b border-white/10 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-off-white">{editando ? 'Editar Post' : 'Nuevo Post'}</h2>
              <button onClick={() => setPanelOpen(false)} className="text-off-white/40 hover:text-off-white transition-colors"><X className="h-5 w-5" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
              {/* Imagen */}
              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-2 block">Imagen de Portada</label>
                <div className="relative h-36 bg-forest-green-light/40 rounded-xl border border-white/10 border-dashed overflow-hidden cursor-pointer hover:border-conservation-gold/50 transition-colors" onClick={() => fileRef.current?.click()}>
                  {form.imagen_url
                    ? <Image src={form.imagen_url} alt="Preview" fill className="object-cover" />
                    : <div className="flex flex-col items-center justify-center h-full text-off-white/30 px-4 text-center"><Upload className="h-7 w-7 mb-1" /><span className="text-xs">{uploadingImg ? `Procesando: ${fileName}...` : 'Subir imagen (Max 10MB)'}</span></div>}
                  {uploadingImg && <div className="absolute inset-0 bg-black/50 flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-conservation-gold" /></div>}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
              </div>

              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">Título *</label>
                <input value={form.titulo} onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))} placeholder="Título del artículo" required
                  className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm focus:outline-none focus:border-conservation-gold/50" />
              </div>

              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">Extracto</label>
                <textarea value={form.excerpt ?? ''} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} rows={2} placeholder="Breve resumen para listados…"
                  className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm resize-none focus:outline-none focus:border-conservation-gold/50" />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider">Contenido *</label>
                  <div className="flex gap-1">
                    <button type="button" onClick={() => insertFormat('bold')} className="p-1.5 text-off-white/40 hover:text-off-white hover:bg-white/10 rounded transition-colors" title="Negrita"><Bold className="h-3.5 w-3.5" /></button>
                    <button type="button" onClick={() => insertFormat('italic')} className="p-1.5 text-off-white/40 hover:text-off-white hover:bg-white/10 rounded transition-colors" title="Cursiva"><Italic className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
                <textarea ref={textareaRef} value={form.contenido} onChange={e => setForm(f => ({ ...f, contenido: e.target.value }))} rows={10} placeholder="Escribe el contenido del artículo aquí... (Markdown soportado)" required
                  className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm font-mono resize-none focus:outline-none focus:border-conservation-gold/50" />
              </div>

              <div className="flex items-center justify-between py-3 border-t border-white/10">
                <div>
                  <p className="text-off-white font-medium text-sm">Publicar</p>
                  <p className="text-off-white/40 text-xs">Visible en el sitio público</p>
                </div>
                <button type="button" onClick={() => setForm(f => ({ ...f, publicado: !f.publicado }))}
                  className={`relative w-11 h-6 rounded-full transition-colors ${form.publicado ? 'bg-conservation-gold' : 'bg-white/20'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${form.publicado ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>

              <button type="submit" disabled={isPending || uploadingImg}
                className="w-full bg-conservation-gold hover:bg-conservation-gold/90 disabled:opacity-50 text-forest-green-dark font-bold py-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2">
                {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Guardando…</> : (editando ? 'Actualizar Post' : 'Crear Post')}
              </button>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-forest-green-dark border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-off-white mb-2">¿Eliminar post?</h3>
            <p className="text-off-white/60 text-sm mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-white/10 hover:bg-white/20 text-off-white font-medium py-2.5 rounded-xl transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={isPending} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors">{isPending ? 'Eliminando…' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
