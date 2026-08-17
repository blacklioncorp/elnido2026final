'use client'

import { useState, useTransition } from 'react'
import Image from 'next/image'
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, Eye, X, Loader2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/lib/database.types'
import {
  createTarjetaDonacion,
  updateTarjetaDonacion,
  toggleTarjetaActiva,
  deleteTarjetaDonacion,
  uploadEspecieImagen,
  reiniciarMetasProgramadas,
  type TarjetaInput,
} from './actions'
import { createStripeProductForCard } from '@/app/actions/donaciones'
import AdministrarActualizacionesModal from './AdministrarActualizacionesModal'

type TarjetaDonacionRow = Database['public']['Tables']['tarjetas_donacion']['Row']

const TIPO_LABELS = {
  especie: 'Especie',
  animal_individual: 'Animal',
  familia: 'Familia',
} as const

const FILTROS = ['todas', 'activas', 'inactivas', 'meta_cumplida'] as const
type Filtro = (typeof FILTROS)[number]

function formatCurrency(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(n)
}

// ── FORM ──────────────────────────────────────────────────────────────────────
function TarjetaForm({
  initial,
  tarjetasActivas,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: Partial<TarjetaDonacionRow>
  tarjetasActivas: number
  onSubmit: (data: TarjetaInput) => void
  onCancel: () => void
  loading: boolean
}) {
  const [form, setForm] = useState<TarjetaInput>({
    nombre_especie: initial?.nombre_especie ?? '',
    nombre_animal: initial?.nombre_animal ?? null,
    tipo: (initial?.tipo as TarjetaInput['tipo']) ?? 'especie',
    descripcion: initial?.descripcion ?? '',
    historia: initial?.historia ?? null,
    imagen_url: initial?.imagen_url ?? null,
    meta_tipo: (initial?.meta_tipo as TarjetaInput['meta_tipo']) ?? 'unica',
    meta_monto: initial?.meta_monto ?? 0,
    activa: initial?.activa ?? false,
    seccion: (initial?.seccion as TarjetaInput['seccion']) ?? 'amigos',
    latitud_origen: initial?.latitud_origen ?? null,
    longitud_origen: initial?.longitud_origen ?? null,
    latitud_destino: initial?.latitud_destino ?? null,
    longitud_destino: initial?.longitud_destino ?? null,
    latitud_actual: initial?.latitud_actual ?? null,
    longitud_actual: initial?.longitud_actual ?? null,
    area_protegida: initial?.area_protegida ?? null,
    liberada: initial?.liberada ?? false,
  })
  const [uploadingImg, setUploadingImg] = useState(false)
  const [uploadDetails, setUploadDetails] = useState<string | null>(null)

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const sizeMB = file.size / (1024 * 1024)
    if (sizeMB > 10) {
      toast.error('La imagen no debe superar 10 MB. Comprímela en squoosh.app')
      e.target.value = ''
      return
    }

    setUploadDetails(`${file.name} (${sizeMB.toFixed(1)} MB)`)
    setUploadingImg(true)
    
    const fd = new FormData()
    fd.append('file', file)
    const result = await uploadEspecieImagen(fd)
    if ('error' in result) {
      toast.error(result.error)
      setUploadDetails(null)
    } else {
      setForm((f) => ({ ...f, imagen_url: result.url }))
      toast.success('Imagen subida')
    }
    setUploadingImg(false)
  }

  const inputCls = 'w-full px-3 py-2 border border-forest-green-dark/20 rounded-lg focus:border-quetzal-blue focus:outline-none text-sm text-forest-green-dark'
  const labelCls = 'block text-xs font-semibold text-forest-green-dark/60 uppercase tracking-wider mb-1'

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Nombre de la especie *</label>
          <input className={inputCls} value={form.nombre_especie}
            onChange={(e) => setForm({ ...form, nombre_especie: e.target.value })} />
        </div>
        <div>
          <label className={labelCls}>Nombre del animal (opcional)</label>
          <input className={inputCls} value={form.nombre_animal ?? ''}
            placeholder="Ej: Guacamole"
            onChange={(e) => setForm({ ...form, nombre_animal: e.target.value || null })} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Tipo</label>
          <select className={inputCls} value={form.tipo}
            onChange={(e) => setForm({ ...form, tipo: e.target.value as TarjetaInput['tipo'] })}>
            <option value="especie">Especie</option>
            <option value="animal_individual">Animal Individual</option>
            <option value="familia">Familia</option>
          </select>
        </div>
        <div>
          <label className={labelCls}>Tipo de meta</label>
          <select className={inputCls} value={form.meta_tipo}
            onChange={(e) => setForm({ ...form, meta_tipo: e.target.value as TarjetaInput['meta_tipo'] })}>
            <option value="unica">Meta Única</option>
            <option value="mensual">Meta Mensual</option>
            <option value="anual">Meta Anual</option>
          </select>
        </div>
      </div>

      <div>
        <label className={labelCls}>Monto de la meta (MXN) *</label>
        <input type="number" className={inputCls} value={form.meta_monto}
          onChange={(e) => setForm({ ...form, meta_monto: Number(e.target.value) })} />
      </div>

      <div>
        <label className={labelCls}>Descripción (breve, para la tarjeta) *</label>
        <textarea rows={2} className={inputCls} value={form.descripcion}
          onChange={(e) => setForm({ ...form, descripcion: e.target.value })} />
      </div>

      <div>
        <label className={labelCls}>Historia completa (para &quot;Leer más...&quot;)</label>
        <textarea rows={4} className={inputCls} value={form.historia ?? ''}
          onChange={(e) => setForm({ ...form, historia: e.target.value || null })} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelCls}>Sección</label>
          <select className={inputCls} value={form.seccion}
            onChange={(e) => setForm({ ...form, seccion: e.target.value as TarjetaInput['seccion'] })}>
            <option value="amigos">Amigos de El Nido</option>
            <option value="impulsa_vuelo">Impulsa el Vuelo</option>
          </select>
        </div>
      </div>

      {form.seccion === 'impulsa_vuelo' && (
        <div className="p-4 bg-quetzal-blue/5 border border-quetzal-blue/20 rounded-xl space-y-4">
          <h3 className="font-bold text-forest-green-dark">🗺️ Datos de Liberación (Impulsa el Vuelo)</h3>
          
          <div>
            <label className={labelCls}>Área Protegida de Destino</label>
            <input className={inputCls} value={form.area_protegida ?? ''}
              placeholder="Ej: Reserva de la Biosfera Los Tuxtlas"
              onChange={(e) => setForm({ ...form, area_protegida: e.target.value || null })} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Latitud Origen (El Nido)</label>
              <input type="number" step="any" className={inputCls} value={form.latitud_origen ?? ''}
                onChange={(e) => setForm({ ...form, latitud_origen: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div>
              <label className={labelCls}>Longitud Origen</label>
              <input type="number" step="any" className={inputCls} value={form.longitud_origen ?? ''}
                onChange={(e) => setForm({ ...form, longitud_origen: e.target.value ? Number(e.target.value) : null })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Latitud Destino</label>
              <input type="number" step="any" className={inputCls} value={form.latitud_destino ?? ''}
                onChange={(e) => setForm({ ...form, latitud_destino: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div>
              <label className={labelCls}>Longitud Destino</label>
              <input type="number" step="any" className={inputCls} value={form.longitud_destino ?? ''}
                onChange={(e) => setForm({ ...form, longitud_destino: e.target.value ? Number(e.target.value) : null })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelCls}>Latitud Actual (GPS)</label>
              <input type="number" step="any" className={inputCls} value={form.latitud_actual ?? ''}
                onChange={(e) => setForm({ ...form, latitud_actual: e.target.value ? Number(e.target.value) : null })} />
            </div>
            <div>
              <label className={labelCls}>Longitud Actual (GPS)</label>
              <input type="number" step="any" className={inputCls} value={form.longitud_actual ?? ''}
                onChange={(e) => setForm({ ...form, longitud_actual: e.target.value ? Number(e.target.value) : null })} />
            </div>
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={form.liberada}
                onChange={(e) => setForm({ ...form, liberada: e.target.checked })}
                className="h-4 w-4 accent-quetzal-blue" />
              <span className="text-sm font-medium text-forest-green-dark">¿Especie liberada con éxito?</span>
            </label>
          </div>
        </div>
      )}

      <div>
        <label className={labelCls}>Imagen de la especie</label>
        <div className="flex items-center gap-3">
          {form.imagen_url && (
            <div className="relative w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
              <Image src={form.imagen_url} alt="Preview" fill className="object-cover" />
            </div>
          )}
          <label className="flex items-center gap-2 cursor-pointer bg-forest-green-dark/5 hover:bg-forest-green-dark/10 border border-forest-green-dark/20 text-forest-green-dark/70 text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            {uploadingImg ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
            {uploadingImg ? 'Procesando...' : 'Subir imagen (Max 10MB)'}
            <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
          </label>
          {uploadDetails && (
            <span className="text-xs text-forest-green-dark/60">{uploadDetails}</span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={form.activa}
            onChange={(e) => {
              if (e.target.checked && tarjetasActivas >= 5 && !initial?.activa) {
                toast.warning(`Ya hay ${tarjetasActivas} tarjetas activas. Tendrás ${tarjetasActivas + 1} si activas esta.`)
              }
              setForm({ ...form, activa: e.target.checked })
            }}
            className="h-4 w-4 accent-quetzal-blue" />
          <span className="text-sm font-medium text-forest-green-dark">Tarjeta activa (visible en /donativos)</span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          onClick={() => onSubmit(form)}
          disabled={loading}
          className="flex-1 bg-forest-green-dark text-white font-bold py-2.5 rounded-xl hover:bg-forest-green-light transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          {initial ? 'Guardar cambios' : 'Crear tarjeta'}
        </button>
        <button onClick={onCancel}
          className="px-5 py-2.5 rounded-xl text-forest-green-dark/60 hover:text-forest-green-dark hover:bg-forest-green-dark/5 transition-colors font-medium text-sm">
          Cancelar
        </button>
      </div>
    </div>
  )
}

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
export default function DonativosAdminClient({
  tarjetas: initialTarjetas,
  suscripciones: initialSuscripciones = [],
}: {
  tarjetas: TarjetaDonacionRow[]
  suscripciones?: any[]
}) {
  const [tarjetas, setTarjetas] = useState(initialTarjetas)
  const [suscripciones] = useState(initialSuscripciones)
  const [activeTab, setActiveTab] = useState<'tarjetas' | 'suscripciones'>('tarjetas')
  const [suscripcionesFiltro, setSuscripcionesFiltro] = useState<'activas' | 'canceladas' | 'todas'>('activas')
  const [filtro, setFiltro] = useState<Filtro>('todas')
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState<TarjetaDonacionRow | null>(null)
  const [administrandoActualizaciones, setAdministrandoActualizaciones] = useState<{ id: string, nombre: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const tarjetasActivas = tarjetas.filter((t) => t.activa).length

  const filtradas = tarjetas.filter((t) => {
    if (filtro === 'activas') return t.activa
    if (filtro === 'inactivas') return !t.activa && !t.meta_cumplida
    if (filtro === 'meta_cumplida') return t.meta_cumplida
    return true
  })

  const handleCreate = (data: TarjetaInput) => {
    startTransition(async () => {
      const res = await createTarjetaDonacion(data)
      if ('error' in res) { toast.error(res.error); return }
      toast.success('Tarjeta creada')
      
      if (res.id) {
        // Run async without blocking UI reload
        createStripeProductForCard(res.id, data.nombre_especie).then((productRes) => {
          if ('error' in productRes) {
            toast.error(`Error al crear producto en Stripe: ${productRes.error}`)
          } else {
            toast.success('Producto de Stripe creado exitosamente')
          }
        })
      }
      
      setShowForm(false)
      // Refresh list
      window.location.reload()
    })
  }

  const handleUpdate = (data: TarjetaInput) => {
    if (!editando) return
    startTransition(async () => {
      const res = await updateTarjetaDonacion(editando.id, data)
      if ('error' in res) { toast.error(res.error); return }
      toast.success('Tarjeta actualizada')
      setEditando(null)
      window.location.reload()
    })
  }

  const handleToggle = (id: string, activa: boolean) => {
    startTransition(async () => {
      const res = await toggleTarjetaActiva(id, activa)
      if ('error' in res) { toast.error(res.error); return }
      setTarjetas((prev) => prev.map((t) => t.id === id ? { ...t, activa } : t))
      toast.success(activa ? 'Tarjeta activada' : 'Tarjeta desactivada')
    })
  }

  const handleDelete = (id: string) => {
    startTransition(async () => {
      const res = await deleteTarjetaDonacion(id)
      if ('error' in res) { toast.error(res.error); return }
      setTarjetas((prev) => prev.filter((t) => t.id !== id))
      setConfirmDelete(null)
      toast.success('Tarjeta eliminada')
    })
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-forest-green-dark/10 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-forest-green-dark">Donativos</h1>
          <div className="flex gap-4 mt-4">
            <button 
              onClick={() => setActiveTab('tarjetas')}
              className={`font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'tarjetas' ? 'border-forest-green-dark text-forest-green-dark' : 'border-transparent text-forest-green-dark/50 hover:text-forest-green-dark'}`}
            >
              Tarjetas de Donación
            </button>
            <button 
              onClick={() => setActiveTab('suscripciones')}
              className={`font-semibold pb-2 border-b-2 transition-colors ${activeTab === 'suscripciones' ? 'border-forest-green-dark text-forest-green-dark' : 'border-transparent text-forest-green-dark/50 hover:text-forest-green-dark'}`}
            >
              Suscripciones Activas
            </button>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {activeTab === 'tarjetas' && (
            <>
              <button
                onClick={() => {
                  if (confirm('¿Estás seguro de querer reiniciar las metas programadas mensuales y anuales?')) {
                    startTransition(async () => {
                      const res = await reiniciarMetasProgramadas()
                      if ('error' in res) toast.error(res.error)
                      else {
                        toast.success('Metas reiniciadas correctamente')
                        window.location.reload()
                      }
                    })
                  }
                }}
                disabled={isPending}
                className="flex items-center gap-2 bg-white text-forest-green-dark border border-white font-bold px-4 py-2.5 rounded-xl hover:bg-gray-200 transition-colors shadow-sm disabled:opacity-50 text-sm"
              >
                Reiniciar metas programadas
              </button>
              <button
                onClick={() => { setShowForm(true); setEditando(null) }}
                className="flex items-center gap-2 bg-forest-green-dark text-white font-bold px-5 py-2.5 rounded-xl hover:bg-forest-green-light transition-colors shadow-sm"
              >
                <Plus className="h-5 w-5" />
                Nueva Tarjeta
              </button>
            </>
          )}
        </div>
      </div>

      {activeTab === 'tarjetas' ? (
        <>
          {/* Create Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-forest-green-dark/10 shadow-sm p-6">
          <h2 className="text-lg font-bold text-forest-green-dark mb-5">Nueva Tarjeta de Donación</h2>
          <TarjetaForm
            tarjetasActivas={tarjetasActivas}
            onSubmit={handleCreate}
            onCancel={() => setShowForm(false)}
            loading={isPending}
          />
        </div>
      )}

      {/* Edit Form */}
      {editando && (
        <div className="bg-white rounded-2xl border border-quetzal-blue/30 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-forest-green-dark">Editando: {editando.nombre_especie}</h2>
            <button onClick={() => setEditando(null)}><X className="h-5 w-5 text-forest-green-dark/50" /></button>
          </div>
          <TarjetaForm
            initial={editando}
            tarjetasActivas={tarjetasActivas}
            onSubmit={handleUpdate}
            onCancel={() => setEditando(null)}
            loading={isPending}
          />
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS.map((f) => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
              filtro === f
                ? 'bg-forest-green-dark text-white'
                : 'bg-forest-green-dark/5 text-forest-green-dark/60 hover:bg-forest-green-dark/10'
            }`}>
            {f === 'todas' ? 'Todas' : f === 'activas' ? 'Activas' : f === 'inactivas' ? 'Inactivas' : 'Meta Cumplida'}
            {f === 'activas' && ` (${tarjetasActivas})`}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-forest-green-dark/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead>
              <tr className="bg-forest-green-dark/5 border-b border-forest-green-dark/10 text-xs font-bold text-forest-green-dark/60 uppercase tracking-wider">
                <th className="p-4">Especie</th>
                <th className="p-4">Tipo</th>
                <th className="p-4">Meta</th>
                <th className="p-4">Recaudado</th>
                <th className="p-4 w-32">Progreso</th>
                <th className="p-4 text-center">Activa</th>
                <th className="p-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-green-dark/5 text-sm">
              {filtradas.length === 0 && (
                <tr><td colSpan={7} className="p-8 text-center text-forest-green-dark/40">No hay tarjetas en esta categoría.</td></tr>
              )}
              {filtradas.map((t) => {
                const pct = t.meta_monto > 0 ? Math.min((t.monto_recaudado / t.meta_monto) * 100, 100) : 0
                return (
                  <tr key={t.id} className="hover:bg-forest-green-dark/2 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {t.imagen_url ? (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0">
                            <Image src={t.imagen_url} alt={t.nombre_especie} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-forest-green-dark/10 flex items-center justify-center text-xl">🦎</div>
                        )}
                        <div>
                          <p className="font-semibold text-forest-green-dark">{t.nombre_especie}</p>
                          {t.nombre_animal && <p className="text-xs text-quetzal-blue italic">&ldquo;{t.nombre_animal}&rdquo;</p>}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-conservation-gold/20 text-conservation-gold text-xs font-bold px-2 py-0.5 rounded-full">
                        {TIPO_LABELS[t.tipo]}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-forest-green-dark">{formatCurrency(t.meta_monto)}</td>
                    <td className="p-4 font-medium text-quetzal-blue">{formatCurrency(t.monto_recaudado)}</td>
                    <td className="p-4">
                      <div className="space-y-1">
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full bg-gradient-to-r from-quetzal-blue to-conservation-gold"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-forest-green-dark/50">{Math.round(pct)}%</p>
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => handleToggle(t.id, !t.activa)}
                        disabled={t.meta_cumplida || isPending}
                        title={t.meta_cumplida ? 'Meta cumplida — desactivada automáticamente' : undefined}
                        className="disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {t.activa
                          ? <ToggleRight className="h-7 w-7 text-emerald-500" />
                          : <ToggleLeft className="h-7 w-7 text-forest-green-dark/30" />}
                      </button>
                      {t.meta_cumplida && (
                        <p className="text-xs text-emerald-600 font-bold">✅ Meta</p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {t.seccion === 'impulsa_vuelo' && (
                          <button onClick={() => setAdministrandoActualizaciones({ id: t.id, nombre: t.nombre_animal || t.nombre_especie })}
                            className="p-1.5 text-forest-green-dark/40 hover:text-quetzal-blue transition-colors" title="Bitácora de Vuelo">
                            📖
                          </button>
                        )}
                        <a href={`/donativos`} target="_blank" rel="noopener noreferrer"
                          className="p-1.5 text-forest-green-dark/40 hover:text-quetzal-blue transition-colors" title="Ver en /donativos">
                          <Eye className="h-4 w-4" />
                        </a>
                        <button onClick={() => { setEditando(t); setShowForm(false) }}
                          className="p-1.5 text-forest-green-dark/40 hover:text-conservation-gold transition-colors" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setConfirmDelete(t.id)}
                          className="p-1.5 text-forest-green-dark/40 hover:text-red-500 transition-colors" title="Eliminar">
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
      </div>
        </>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-white p-6 rounded-2xl border border-forest-green-dark/10 shadow-sm">
            <div>
              <h2 className="text-xl font-bold text-forest-green-dark">Resumen de Suscripciones</h2>
              <p className="text-sm text-forest-green-dark/60">Total mensual estimado (solo activas)</p>
            </div>
            <div className="text-3xl font-extrabold text-quetzal-blue">
              {formatCurrency(suscripciones.filter(s => s.estado_suscripcion === 'activa').reduce((acc, curr) => acc + Number(curr.monto), 0))}
            </div>
          </div>
          
          <div className="flex gap-2 mb-4">
            {['activas', 'canceladas', 'todas'].map(f => (
              <button key={f} onClick={() => setSuscripcionesFiltro(f as any)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium capitalize transition-all ${
                  suscripcionesFiltro === f
                    ? 'bg-forest-green-dark text-white'
                    : 'bg-forest-green-dark/5 text-forest-green-dark/60 hover:bg-forest-green-dark/10'
                }`}>
                {f}
              </button>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-forest-green-dark/10 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-forest-green-dark/5 text-xs font-bold text-forest-green-dark/60 uppercase">
                  <th className="p-4">Donante</th>
                  <th className="p-4">Especie</th>
                  <th className="p-4">Monto Mensual</th>
                  <th className="p-4">Fecha Inicio</th>
                  <th className="p-4 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-green-dark/5 text-sm">
                {suscripciones
                  .filter(s => suscripcionesFiltro === 'todas' || s.estado_suscripcion === suscripcionesFiltro)
                  .length === 0 && (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-forest-green-dark/40">No hay suscripciones en esta categoría.</td>
                    </tr>
                )}
                {suscripciones
                  .filter(s => suscripcionesFiltro === 'todas' || s.estado_suscripcion === suscripcionesFiltro)
                  .map(s => (
                  <tr key={s.id} className="hover:bg-forest-green-dark/2">
                    <td className="p-4 font-semibold">{s.donante_username || s.donante_nombre}</td>
                    <td className="p-4">{s.tarjeta?.nombre_especie || 'Donativo General'}</td>
                    <td className="p-4 font-bold text-quetzal-blue">{formatCurrency(s.monto)}</td>
                    <td className="p-4">{new Date(s.created_at).toLocaleDateString()}</td>
                    <td className="p-4 text-center">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${s.estado_suscripcion === 'activa' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {s.estado_suscripcion?.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full shadow-xl">
            <h3 className="font-bold text-forest-green-dark text-lg mb-2">¿Eliminar tarjeta?</h3>
            <p className="text-forest-green-dark/60 text-sm mb-5">
              Esta acción no se puede deshacer. Las donaciones asociadas se mantendrán.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(confirmDelete)}
                disabled={isPending}
                className="flex-1 bg-red-500 text-white font-bold py-2.5 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {isPending ? 'Eliminando...' : 'Sí, eliminar'}
              </button>
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-forest-green-dark/5 text-forest-green-dark font-medium py-2.5 rounded-xl hover:bg-forest-green-dark/10 transition-colors">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bitácora */}
      {administrandoActualizaciones && (
        <AdministrarActualizacionesModal
          tarjetaId={administrandoActualizaciones.id}
          tarjetaNombre={administrandoActualizaciones.nombre}
          onClose={() => setAdministrandoActualizaciones(null)}
        />
      )}
    </div>
  )
}
