'use client'

import { useState, useTransition, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PaqueteEducativo, Cotizacion, EstadoCotizacion, NivelEducativo } from '@/types/grupos'
import { createClient } from '@/lib/supabase'
import { toast } from 'sonner'
import { 
  Loader2, Edit2, Trash2, Eye, EyeOff, Plus, X, Upload, Search, 
  Clock, DollarSign, Users, BookOpen, GraduationCap, CheckCircle2, 
  Calendar, Phone, Mail, Building, FileText, ChevronRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import { 
  createPaquete, 
  updatePaquete, 
  deletePaquete, 
  togglePaqueteActivo, 
  uploadPaqueteImagen,
  type PaqueteInput 
} from '@/app/actions/grupos'
import { compressImageClient } from '@/lib/client-image-compression'

interface Props {
  initialPaquetes: PaqueteEducativo[]
  initialCotizaciones: Cotizacion[]
}

type Tab = 'dashboard' | 'paquetes' | 'cotizaciones'

const NIVELES: { value: NivelEducativo; label: string; color: string }[] = [
  { value: 'preescolar', label: 'Preescolar', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { value: 'primaria', label: 'Primaria', color: 'bg-green-500/20 text-green-300 border-green-500/30' },
  { value: 'secundaria', label: 'Secundaria', color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30' },
  { value: 'preparatoria', label: 'Preparatoria', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { value: 'licenciatura', label: 'Licenciatura', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
]

const EMPTY_PAQUETE_FORM: PaqueteInput = {
  nombre: '',
  slug: '',
  nivel: 'primaria',
  duracion_horas: 4,
  precio_por_persona: 250,
  max_personas: 60,
  descripcion_corta: '',
  descripcion_larga: '',
  objetivos: '',
  actividades: [
    { nombre: 'Recorrido guiado por aviarios', duracion: '60 min' },
    { nombre: 'Taller de educación ambiental', duracion: '45 min' }
  ],
  itinerario: [
    { actividad: 'Llegada y bienvenida', duracion: '15 min' },
    { actividad: 'Visita guiada', duracion: '90 min' },
    { actividad: 'Taller interactivo', duracion: '45 min' },
    { actividad: 'Despedida', duracion: '15 min' }
  ],
  instalaciones: 'Área de comida techada, sanitarios, estacionamiento para autobuses',
  alineacion_sep: 'Ciencias Naturales y Conciencia Ecológica',
  imagen_url: '',
  activo: true,
}

export default function GruposAdminClient({ initialPaquetes, initialCotizaciones }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard')
  const [paquetes, setPaquetes] = useState<PaqueteEducativo[]>(initialPaquetes)
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>(initialCotizaciones)

  // Drawer / Form State
  const [panelOpen, setPanelOpen] = useState(false)
  const [editandoPaquete, setEditandoPaquete] = useState<PaqueteEducativo | null>(null)
  const [form, setForm] = useState<PaqueteInput>(EMPTY_PAQUETE_FORM)
  const [uploadingImg, setUploadingImg] = useState(false)
  const [fileName, setFileName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  
  // Detalle Cotización Modal State
  const [cotizacionDetalle, setCotizacionDetalle] = useState<Cotizacion | null>(null)

  // Search and filters
  const [busquedaPaquete, setBusquedaPaquete] = useState('')
  const [filtroNivel, setFiltroNivel] = useState<string>('todos')
  const [filtroEstado, setFiltroEstado] = useState<string>('todos')

  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  // --- KPI Cálculos ---
  const pendientes = cotizaciones.filter(c => c.estado === 'pendiente').length
  const confirmadas = cotizaciones.filter(c => c.estado === 'confirmada').length
  const respondidas = cotizaciones.filter(c => c.estado === 'respondida').length
  const personasTotal = cotizaciones
    .filter(c => c.estado === 'confirmada')
    .reduce((acc, curr) => acc + (curr.numero_personas || 0), 0)

  // --- Handlers para Paquetes ---
  function abrirCrear() {
    setEditandoPaquete(null)
    setForm(EMPTY_PAQUETE_FORM)
    setFileName('')
    setPanelOpen(true)
  }

  function abrirEditar(p: PaqueteEducativo) {
    setEditandoPaquete(p)
    setForm({
      nombre: p.nombre,
      slug: p.slug,
      nivel: p.nivel,
      duracion_horas: p.duracion_horas,
      precio_por_persona: p.precio_por_persona,
      max_personas: p.max_personas || 60,
      descripcion_corta: p.descripcion_corta || '',
      descripcion_larga: p.descripcion_larga || '',
      objetivos: p.objetivos || '',
      actividades: Array.isArray(p.actividades) && p.actividades.length > 0 
        ? p.actividades 
        : [{ nombre: '', duracion: '' }],
      itinerario: Array.isArray(p.itinerario) && p.itinerario.length > 0 
        ? p.itinerario 
        : [{ actividad: '', duracion: '' }],
      instalaciones: p.instalaciones || '',
      alineacion_sep: p.alineacion_sep || '',
      imagen_url: p.imagen_url || '',
      activo: p.activo,
    })
    setFileName('')
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
      const res = await uploadPaqueteImagen(fd)
      if ('error' in res) {
        toast.error(res.error)
        return
      }
      setForm(f => ({ ...f, imagen_url: res.url }))
      toast.success('Imagen subida y optimizada ✓')
    } catch (error: any) {
      console.error('Error uploading image:', error)
      toast.error(error.message || 'Error al subir la imagen')
    } finally {
      setUploadingImg(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function handleSavePaquete(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) {
      toast.error('El nombre del paquete es requerido')
      return
    }
    if (!form.descripcion_corta.trim()) {
      toast.error('La descripción corta es requerida')
      return
    }

    startTransition(async () => {
      if (editandoPaquete) {
        const res = await updatePaquete(editandoPaquete.id, form)
        if ('error' in res) {
          toast.error(res.error)
          return
        }
        setPaquetes(prev => prev.map(p => p.id === editandoPaquete.id ? { ...p, ...form } as PaqueteEducativo : p))
        toast.success('Paquete actualizado con éxito')
      } else {
        const res = await createPaquete(form)
        if ('error' in res) {
          toast.error(res.error)
          return
        }
        toast.success('Paquete educativo creado con éxito')
        window.location.reload()
      }
      setPanelOpen(false)
    })
  }

  function handleToggleActivo(p: PaqueteEducativo) {
    startTransition(async () => {
      const nuevoEstado = !p.activo
      const res = await togglePaqueteActivo(p.id, nuevoEstado)
      if ('error' in res) {
        toast.error(res.error)
        return
      }
      setPaquetes(prev => prev.map(item => item.id === p.id ? { ...item, activo: nuevoEstado } : item))
      toast.success(nuevoEstado ? 'Paquete activado' : 'Paquete desactivado')
    })
  }

  function handleDeletePaquete(id: string) {
    startTransition(async () => {
      const res = await deletePaquete(id)
      if ('error' in res) {
        toast.error(res.error, { duration: 5000 })
        setConfirmDelete(null)
        return
      }
      setPaquetes(prev => prev.filter(p => p.id !== id))
      setConfirmDelete(null)
      toast.success('Paquete eliminado')
    })
  }

  // --- Handlers para Actividades e Itinerario dinámicos ---
  function addActividad() {
    setForm(f => ({
      ...f,
      actividades: [...(f.actividades || []), { nombre: '', duracion: '' }]
    }))
  }

  function removeActividad(index: number) {
    setForm(f => ({
      ...f,
      actividades: f.actividades.filter((_, i) => i !== index)
    }))
  }

  function updateActividad(index: number, campo: 'nombre' | 'duracion', valor: string) {
    setForm(f => ({
      ...f,
      actividades: f.actividades.map((act, i) => i === index ? { ...act, [campo]: valor } : act)
    }))
  }

  function addItinerarioPaso() {
    setForm(f => ({
      ...f,
      itinerario: [...(f.itinerario || []), { actividad: '', duracion: '' }]
    }))
  }

  function removeItinerarioPaso(index: number) {
    setForm(f => ({
      ...f,
      itinerario: (f.itinerario || []).filter((_, i) => i !== index)
    }))
  }

  function updateItinerarioPaso(index: number, campo: 'actividad' | 'duracion', valor: string) {
    setForm(f => ({
      ...f,
      itinerario: (f.itinerario || []).map((paso, i) => i === index ? { ...paso, [campo]: valor } : paso)
    }))
  }

  // --- Cotizaciones Handler ---
  const handleStatusChange = async (id: string, nuevoEstado: EstadoCotizacion) => {
    try {
      const { error } = await supabase
        .from('cotizaciones')
        .update({ estado: nuevoEstado, updated_at: new Date().toISOString() })
        .eq('id', id)

      if (error) throw error

      setCotizaciones(prev => prev.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c))
      toast.success('Estado de cotización actualizado')
    } catch (error) {
      toast.error('Error al actualizar estado')
    }
  }

  // --- Filtrado de Paquetes ---
  const paquetesFiltrados = paquetes.filter(p => {
    const coincideBusqueda = p.nombre.toLowerCase().includes(busquedaPaquete.toLowerCase()) ||
      (p.descripcion_corta || '').toLowerCase().includes(busquedaPaquete.toLowerCase())
    const coincideNivel = filtroNivel === 'todos' || p.nivel === filtroNivel
    return coincideBusqueda && coincideNivel
  })

  // --- Render Functions ---
  const renderDashboard = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="text-off-white/60 text-sm font-medium">Solicitudes Pendientes</span>
            <div className="w-8 h-8 rounded-lg bg-yellow-500/20 text-yellow-400 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-extrabold text-conservation-gold">{pendientes}</p>
          <p className="text-xs text-off-white/40 mt-2">Requieren respuesta por correo o WhatsApp</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="text-off-white/60 text-sm font-medium">Cotizaciones Respondidas</span>
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 text-blue-400 flex items-center justify-center">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-extrabold text-blue-400">{respondidas}</p>
          <p className="text-xs text-off-white/40 mt-2">En proceso de confirmación</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="text-off-white/60 text-sm font-medium">Grupos Confirmados</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-extrabold text-emerald-400">{confirmadas}</p>
          <p className="text-xs text-off-white/40 mt-2">Fechas y paquetes confirmados</p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="text-off-white/60 text-sm font-medium">Total Asistentes (Pax)</span>
            <div className="w-8 h-8 rounded-lg bg-quetzal-blue/20 text-quetzal-blue flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-4xl font-extrabold text-quetzal-blue">{personasTotal}</p>
          <p className="text-xs text-off-white/40 mt-2">En visitas escolares confirmadas</p>
        </div>
      </div>

      {/* Resumen rápido de últimos paquetes */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-off-white flex items-center gap-2">
            <GraduationCap className="w-5 h-5 text-conservation-gold" />
            Paquetes Educativos Activos
          </h3>
          <button 
            onClick={() => setActiveTab('paquetes')} 
            className="text-xs font-semibold text-conservation-gold hover:underline flex items-center gap-1"
          >
            Administrar paquetes <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {paquetes.slice(0, 3).map(p => (
            <div key={p.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex gap-3">
              {p.imagen_url ? (
                <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0">
                  <Image src={p.imagen_url} alt={p.nombre} fill className="object-cover" />
                </div>
              ) : (
                <div className="w-14 h-14 rounded-lg bg-white/10 flex items-center justify-center text-xl flex-shrink-0">🪶</div>
              )}
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-off-white text-sm truncate">{p.nombre}</h4>
                <p className="text-xs text-off-white/50 capitalize">{p.nivel} • {p.duracion_horas}h</p>
                <p className="text-sm font-bold text-conservation-gold mt-1">${p.precio_por_persona} MXN</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderPaquetes = () => (
    <div className="space-y-4">
      {/* Barra superior de acciones y filtros */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
        <div className="flex flex-wrap gap-2 items-center w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-off-white/40" />
            <input 
              type="text"
              placeholder="Buscar paquete..."
              value={busquedaPaquete}
              onChange={e => setBusquedaPaquete(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-off-white placeholder-off-white/40 focus:outline-none focus:border-conservation-gold/50"
            />
          </div>

          <select 
            value={filtroNivel}
            onChange={e => setFiltroNivel(e.target.value)}
            className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-off-white focus:outline-none focus:border-conservation-gold/50"
          >
            <option value="todos" className="bg-forest-green-dark">Todos los niveles</option>
            {NIVELES.map(n => (
              <option key={n.value} value={n.value} className="bg-forest-green-dark">{n.label}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={abrirCrear}
          className="flex items-center gap-2 bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-bold px-4 py-2.5 rounded-xl transition-all shadow-md text-sm whitespace-nowrap"
        >
          <Plus className="w-4 h-4" />
          Nuevo Paquete
        </button>
      </div>

      {/* Tabla de Paquetes */}
      <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-off-white min-w-[800px]">
            <thead className="bg-white/5 border-b border-white/10 text-off-white/60">
              <tr>
                <th className="px-6 py-4 font-medium">Paquete</th>
                <th className="px-6 py-4 font-medium">Nivel</th>
                <th className="px-6 py-4 font-medium">Duración</th>
                <th className="px-6 py-4 font-medium">Precio / Pax</th>
                <th className="px-6 py-4 font-medium">Cupo Máx.</th>
                <th className="px-6 py-4 font-medium text-center">Estado</th>
                <th className="px-6 py-4 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {paquetesFiltrados.map(p => {
                const nivelConfig = NIVELES.find(n => n.value === p.nivel)
                return (
                  <tr key={p.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {p.imagen_url ? (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-white/10">
                            <Image src={p.imagen_url} alt={p.nombre} fill className="object-cover" />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center text-xl flex-shrink-0 border border-white/10">
                            🪶
                          </div>
                        )}
                        <div className="min-w-0 max-w-xs">
                          <p className="font-semibold text-off-white truncate">{p.nombre}</p>
                          <p className="text-xs text-off-white/50 line-clamp-1">{p.descripcion_corta}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-semibold border", nivelConfig?.color)}>
                        {nivelConfig?.label || p.nivel}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center gap-1.5 text-off-white/80">
                        <Clock className="w-3.5 h-3.5 text-conservation-gold" />
                        {p.duracion_horas}h
                      </span>
                    </td>
                    <td className="px-6 py-4 font-bold text-conservation-gold whitespace-nowrap">
                      ${p.precio_por_persona} MXN
                    </td>
                    <td className="px-6 py-4 text-off-white/70">
                      {p.max_personas || 60} pax
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => handleToggleActivo(p)}
                        disabled={isPending}
                        title={p.activo ? 'Desactivar paquete' : 'Activar paquete'}
                        className={cn(
                          "px-3 py-1 rounded-full text-xs font-semibold transition-all inline-flex items-center gap-1.5",
                          p.activo 
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30" 
                            : "bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30"
                        )}
                      >
                        {p.activo ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                        {p.activo ? 'Activo' : 'Inactivo'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <a 
                          href="/grupos" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 text-off-white/50 hover:text-quetzal-blue hover:bg-white/10 rounded-lg transition-colors"
                          title="Ver en página pública"
                        >
                          <Eye className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => abrirEditar(p)}
                          className="p-2 text-off-white/50 hover:text-conservation-gold hover:bg-white/10 rounded-lg transition-colors"
                          title="Editar paquete completo"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => setConfirmDelete(p.id)}
                          className="p-2 text-off-white/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Eliminar paquete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {paquetesFiltrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-off-white/50">
                    No se encontraron paquetes con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )

  const renderCotizaciones = () => {
    const filtradas = cotizaciones.filter(c => filtroEstado === 'todos' || c.estado === filtroEstado)
    
    return (
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          {['todos', 'pendiente', 'respondida', 'confirmada', 'cancelada'].map(est => (
            <button
              key={est}
              onClick={() => setFiltroEstado(est)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-colors border",
                filtroEstado === est
                  ? "bg-conservation-gold text-forest-green-dark border-conservation-gold font-bold"
                  : "bg-white/5 text-off-white/60 border-white/10 hover:bg-white/10 hover:text-off-white"
              )}
            >
              {est}
            </button>
          ))}
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-off-white min-w-[800px]">
              <thead className="bg-white/5 border-b border-white/10 text-off-white/60">
                <tr>
                  <th className="px-6 py-4 font-medium">Fecha Req.</th>
                  <th className="px-6 py-4 font-medium">Institución / Contacto</th>
                  <th className="px-6 py-4 font-medium">Paquete</th>
                  <th className="px-6 py-4 font-medium">Pax</th>
                  <th className="px-6 py-4 font-medium">Lunch</th>
                  <th className="px-6 py-4 font-medium">Estado</th>
                  <th className="px-6 py-4 font-medium text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {filtradas.map(c => (
                  <tr key={c.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-off-white/80">
                      {new Date(c.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-off-white">{c.nombre_institucion || 'Sin institución'}</p>
                      <p className="text-xs text-off-white/50">{c.nombre_contacto} • {c.email_contacto}</p>
                    </td>
                    <td className="px-6 py-4 text-off-white/90">{c.paquetes_educativos?.nombre || 'Paquete general'}</td>
                    <td className="px-6 py-4 font-bold text-quetzal-blue">{c.numero_personas} pax</td>
                    <td className="px-6 py-4">
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded-full font-medium",
                        c.incluye_lunch ? "bg-emerald-500/20 text-emerald-300" : "bg-white/10 text-off-white/40"
                      )}>
                        {c.incluye_lunch ? 'Sí (+$150)' : 'No'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <select
                        value={c.estado}
                        onChange={e => handleStatusChange(c.id, e.target.value as EstadoCotizacion)}
                        className="bg-white/10 border border-white/20 rounded-lg px-2.5 py-1 text-xs text-off-white focus:outline-none focus:ring-1 focus:ring-conservation-gold cursor-pointer"
                      >
                        <option value="pendiente" className="bg-forest-green-dark">Pendiente</option>
                        <option value="respondida" className="bg-forest-green-dark">Respondida</option>
                        <option value="confirmada" className="bg-forest-green-dark">Confirmada</option>
                        <option value="cancelada" className="bg-forest-green-dark">Cancelada</option>
                      </select>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setCotizacionDetalle(c)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-off-white rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                      >
                        <FileText className="w-3.5 h-3.5 text-conservation-gold" />
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))}
                {filtradas.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-off-white/50">
                      No se encontraron cotizaciones con el filtro seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Tabs Principales */}
      <div className="flex gap-2 border-b border-white/10 pb-4">
        {[
          { id: 'dashboard', label: 'Dashboard Resumen' },
          { id: 'paquetes', label: 'Paquetes Educativos' },
          { id: 'cotizaciones', label: 'Cotizaciones Recibidas' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as Tab)}
            className={cn(
              "px-4 py-2 rounded-xl text-sm font-semibold transition-colors",
              activeTab === t.id 
                ? "bg-conservation-gold text-forest-green-dark shadow-md" 
                : "bg-white/5 text-off-white/60 hover:bg-white/10 hover:text-off-white"
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Contenido según pestaña */}
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

      {/* ── PANEL LATERAL / DRAWER CREAR & EDITAR PAQUETE ─────────────────── */}
      {panelOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setPanelOpen(false)} />
          <div className="w-full max-w-2xl bg-forest-green-dark border-l border-white/10 h-full overflow-y-auto shadow-2xl flex flex-col">
            
            {/* Header Drawer */}
            <div className="sticky top-0 bg-forest-green-dark/95 backdrop-blur-md border-b border-white/10 px-6 py-4 flex items-center justify-between z-10">
              <div>
                <h2 className="text-lg font-bold text-off-white">
                  {editandoPaquete ? `Editar: ${editandoPaquete.nombre}` : 'Nuevo Paquete Educativo'}
                </h2>
                <p className="text-xs text-off-white/50">Completa la información pedagógica y comercial</p>
              </div>
              <button 
                onClick={() => setPanelOpen(false)} 
                className="p-1.5 text-off-white/40 hover:text-off-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Formulario */}
            <form onSubmit={handleSavePaquete} className="p-6 space-y-6 flex-1">
              
              {/* Imagen del Paquete */}
              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-2 block">
                  Imagen Principal (Máx 10 MB)
                </label>
                <div 
                  className="relative h-44 bg-forest-green-light/40 rounded-2xl border border-white/10 border-dashed overflow-hidden cursor-pointer hover:border-conservation-gold/50 transition-colors group"
                  onClick={() => fileRef.current?.click()}
                >
                  {form.imagen_url ? (
                    <>
                      <Image src={form.imagen_url} alt="Preview" fill className="object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-2">
                        <Upload className="w-4 h-4" /> Cambiar imagen
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-off-white/40 text-center px-4">
                      <Upload className="h-8 w-8 mb-2 text-conservation-gold/70" />
                      <span className="text-sm font-medium text-off-white/70">
                        {uploadingImg ? `Procesando: ${fileName}...` : 'Haz clic para subir la imagen del paquete'}
                      </span>
                      <span className="text-xs text-off-white/40 mt-1">Formatos: JPG, PNG, WebP o GIF</span>
                    </div>
                  )}

                  {uploadingImg && (
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center">
                      <div className="flex items-center gap-2 text-conservation-gold font-semibold text-sm">
                        <Loader2 className="h-5 w-5 animate-spin" /> Optimizando imagen...
                      </div>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImg} />
              </div>

              {/* Información Básica */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">
                    Nombre del Paquete *
                  </label>
                  <input 
                    value={form.nombre} 
                    onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
                    placeholder="Ej: Guardianes del Bosque y Aves Nativas" 
                    required
                    className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm focus:outline-none focus:border-conservation-gold/50" 
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">
                    Nivel Educativo *
                  </label>
                  <select 
                    value={form.nivel} 
                    onChange={e => setForm(f => ({ ...f, nivel: e.target.value as NivelEducativo }))}
                    className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white text-sm focus:outline-none focus:border-conservation-gold/50"
                  >
                    {NIVELES.map(n => (
                      <option key={n.value} value={n.value} className="bg-forest-green-dark">{n.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">
                    Duración (Horas) *
                  </label>
                  <input 
                    type="number"
                    min={1}
                    max={24}
                    value={form.duracion_horas} 
                    onChange={e => setForm(f => ({ ...f, duracion_horas: Number(e.target.value) }))}
                    className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white text-sm focus:outline-none focus:border-conservation-gold/50" 
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">
                    Precio por Persona (MXN) *
                  </label>
                  <input 
                    type="number"
                    min={0}
                    value={form.precio_por_persona} 
                    onChange={e => setForm(f => ({ ...f, precio_por_persona: Number(e.target.value) }))}
                    className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white font-bold text-conservation-gold text-sm focus:outline-none focus:border-conservation-gold/50" 
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">
                    Cupo Máximo Sugerido (Pax)
                  </label>
                  <input 
                    type="number"
                    min={1}
                    value={form.max_personas} 
                    onChange={e => setForm(f => ({ ...f, max_personas: Number(e.target.value) }))}
                    className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white text-sm focus:outline-none focus:border-conservation-gold/50" 
                  />
                </div>
              </div>

              {/* Descripciones y Objetivos */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">
                    Descripción Corta (Para tarjetas de catálogo) *
                  </label>
                  <textarea 
                    rows={2}
                    value={form.descripcion_corta} 
                    onChange={e => setForm(f => ({ ...f, descripcion_corta: e.target.value }))}
                    placeholder="Breve resumen de 2 líneas sobre la experiencia escolar…"
                    required
                    className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm resize-none focus:outline-none focus:border-conservation-gold/50" 
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">
                    Descripción Detallada (Sobre la experiencia)
                  </label>
                  <textarea 
                    rows={4}
                    value={form.descripcion_larga} 
                    onChange={e => setForm(f => ({ ...f, descripcion_larga: e.target.value }))}
                    placeholder="Explicación completa de lo que aprenderán los alumnos durante el recorrido…"
                    className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm resize-none focus:outline-none focus:border-conservation-gold/50" 
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">
                    Objetivos Pedagógicos
                  </label>
                  <textarea 
                    rows={3}
                    value={form.objetivos} 
                    onChange={e => setForm(f => ({ ...f, objetivos: e.target.value }))}
                    placeholder="Ej: Fomentar el respeto a la biodiversidad y comprender los ecosistemas aviarios…"
                    className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm resize-none focus:outline-none focus:border-conservation-gold/50" 
                  />
                </div>
              </div>

              {/* Actividades Principales Dinámicas */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-conservation-gold uppercase tracking-wider">
                    Actividades Principales ({form.actividades.length})
                  </label>
                  <button 
                    type="button" 
                    onClick={addActividad}
                    className="text-xs font-semibold text-conservation-gold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Actividad
                  </button>
                </div>

                <div className="space-y-2">
                  {form.actividades.map((act, i) => (
                    <div key={i} className="flex gap-2 items-center bg-white/5 p-2 rounded-xl border border-white/5">
                      <input 
                        type="text"
                        placeholder="Nombre de la actividad (ej: Taller de huellas)"
                        value={act.nombre}
                        onChange={e => updateActividad(i, 'nombre', e.target.value)}
                        className="flex-1 bg-transparent px-3 py-1.5 text-sm text-off-white placeholder-off-white/30 focus:outline-none"
                      />
                      <input 
                        type="text"
                        placeholder="45 min"
                        value={act.duracion || ''}
                        onChange={e => updateActividad(i, 'duracion', e.target.value)}
                        className="w-24 bg-white/10 rounded-lg px-2.5 py-1.5 text-xs text-off-white text-center placeholder-off-white/30 focus:outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => removeActividad(i)}
                        className="p-1.5 text-off-white/40 hover:text-red-400 rounded-lg hover:bg-white/10"
                        title="Quitar actividad"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Itinerario Dinámico */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-conservation-gold uppercase tracking-wider">
                    Itinerario Sugerido ({(form.itinerario || []).length} pasos)
                  </label>
                  <button 
                    type="button" 
                    onClick={addItinerarioPaso}
                    className="text-xs font-semibold text-conservation-gold hover:underline flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Agregar Paso
                  </button>
                </div>

                <div className="space-y-2">
                  {(form.itinerario || []).map((paso, i) => (
                    <div key={i} className="flex gap-2 items-center bg-white/5 p-2 rounded-xl border border-white/5">
                      <input 
                        type="text"
                        placeholder="Paso / Actividad (ej: Registro y recepción)"
                        value={paso.actividad}
                        onChange={e => updateItinerarioPaso(i, 'actividad', e.target.value)}
                        className="flex-1 bg-transparent px-3 py-1.5 text-sm text-off-white placeholder-off-white/30 focus:outline-none"
                      />
                      <input 
                        type="text"
                        placeholder="30 min"
                        value={paso.duracion || ''}
                        onChange={e => updateItinerarioPaso(i, 'duracion', e.target.value)}
                        className="w-24 bg-white/10 rounded-lg px-2.5 py-1.5 text-xs text-off-white text-center placeholder-off-white/30 focus:outline-none"
                      />
                      <button 
                        type="button"
                        onClick={() => removeItinerarioPaso(i)}
                        className="p-1.5 text-off-white/40 hover:text-red-400 rounded-lg hover:bg-white/10"
                        title="Quitar paso"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Instalaciones y Alineación SEP */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                <div>
                  <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">
                    Instalaciones Incluidas
                  </label>
                  <input 
                    value={form.instalaciones || ''} 
                    onChange={e => setForm(f => ({ ...f, instalaciones: e.target.value }))}
                    placeholder="Comedor, baños, estacionamiento..." 
                    className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm focus:outline-none focus:border-conservation-gold/50" 
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">
                    Alineación SEP / Materias
                  </label>
                  <input 
                    value={form.alineacion_sep || ''} 
                    onChange={e => setForm(f => ({ ...f, alineacion_sep: e.target.value }))}
                    placeholder="Ciencias Naturales, Biología..." 
                    className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm focus:outline-none focus:border-conservation-gold/50" 
                  />
                </div>
              </div>

              {/* Switch Paquete Activo */}
              <div className="flex items-center justify-between py-4 border-t border-white/10">
                <div>
                  <p className="text-off-white font-semibold text-sm">Paquete Activo</p>
                  <p className="text-off-white/50 text-xs">Visible en el cotizador y catálogo público para escuelas</p>
                </div>
                <button 
                  type="button" 
                  onClick={() => setForm(f => ({ ...f, activo: !f.activo }))}
                  className={cn(
                    "relative w-12 h-6 rounded-full transition-colors",
                    form.activo ? "bg-conservation-gold" : "bg-white/20"
                  )}
                >
                  <span 
                    className={cn(
                      "absolute top-0.5 left-0.5 w-5 h-5 bg-forest-green-dark rounded-full shadow transition-transform",
                      form.activo ? "translate-x-6 bg-forest-green-dark" : "translate-x-0 bg-white"
                    )} 
                  />
                </button>
              </div>

              {/* Botones de acción */}
              <div className="sticky bottom-0 bg-forest-green-dark/95 backdrop-blur-md pt-4 pb-2 border-t border-white/10 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setPanelOpen(false)}
                  className="flex-1 bg-white/10 hover:bg-white/20 text-off-white font-semibold py-3 rounded-xl transition-colors text-sm"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  disabled={isPending || uploadingImg}
                  className="flex-2 w-full bg-conservation-gold hover:bg-conservation-gold/90 disabled:opacity-50 text-forest-green-dark font-bold py-3 rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 text-sm"
                >
                  {isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Guardando paquete...</>
                  ) : editandoPaquete ? (
                    'Guardar Cambios'
                  ) : (
                    'Crear Paquete'
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ── MODAL DETALLE DE COTIZACIÓN ───────────────────────────────────── */}
      {cotizacionDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCotizacionDetalle(null)} />
          <div className="relative bg-forest-green-dark border border-white/10 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex justify-between items-start border-b border-white/10 pb-4">
              <div>
                <span className="text-xs font-bold text-conservation-gold uppercase tracking-wider">
                  Detalle de Solicitud #{cotizacionDetalle.id.slice(0, 8)}
                </span>
                <h3 className="text-xl font-bold text-off-white mt-1">
                  {cotizacionDetalle.nombre_institucion || 'Sin Institución'}
                </h3>
              </div>
              <button onClick={() => setCotizacionDetalle(null)} className="text-off-white/40 hover:text-off-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 text-off-white/80">
                <GraduationCap className="w-4 h-4 text-conservation-gold" />
                <span><strong>Paquete:</strong> {cotizacionDetalle.paquetes_educativos?.nombre || 'General'}</span>
              </div>
              <div className="flex items-center gap-3 text-off-white/80">
                <Users className="w-4 h-4 text-conservation-gold" />
                <span><strong>Asistentes:</strong> {cotizacionDetalle.numero_personas} personas</span>
              </div>
              <div className="flex items-center gap-3 text-off-white/80">
                <Calendar className="w-4 h-4 text-conservation-gold" />
                <span><strong>Fecha deseada:</strong> {cotizacionDetalle.fecha_deseada || 'Por definir'}</span>
              </div>
              <div className="flex items-center gap-3 text-off-white/80">
                <Mail className="w-4 h-4 text-conservation-gold" />
                <span><strong>Email:</strong> <a href={`mailto:${cotizacionDetalle.email_contacto}`} className="text-quetzal-blue underline">{cotizacionDetalle.email_contacto}</a></span>
              </div>
              {cotizacionDetalle.telefono_contacto && (
                <div className="flex items-center gap-3 text-off-white/80">
                  <Phone className="w-4 h-4 text-conservation-gold" />
                  <span><strong>Teléfono:</strong> <a href={`https://wa.me/${cotizacionDetalle.telefono_contacto.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="text-emerald-400 underline">{cotizacionDetalle.telefono_contacto}</a></span>
                </div>
              )}
              <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                <p className="text-xs text-off-white/50 mb-1 font-semibold">Mensaje o comentarios del solicitante:</p>
                <p className="text-off-white/90 italic">{cotizacionDetalle.mensaje || 'Sin comentarios adicionales.'}</p>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <a 
                href={`mailto:${cotizacionDetalle.email_contacto}?subject=Cotización El Nido - ${cotizacionDetalle.nombre_institucion || ''}`}
                className="flex-1 bg-conservation-gold text-forest-green-dark font-bold py-2.5 rounded-xl hover:bg-conservation-gold/90 text-center transition-colors text-sm flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" /> Responder por Email
              </a>
              <button 
                onClick={() => setCotizacionDetalle(null)}
                className="px-5 py-2.5 bg-white/10 text-off-white rounded-xl hover:bg-white/20 text-sm font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL CONFIRMACIÓN ELIMINAR PAQUETE ────────────────────────────── */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-forest-green-dark border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
            <h3 className="text-lg font-bold text-off-white mb-2">¿Eliminar paquete educativo?</h3>
            <p className="text-off-white/60 text-sm mb-6">
              Esta acción no se puede deshacer. Si el paquete ya cuenta con cotizaciones asociadas, el sistema te solicitará desactivarlo en lugar de borrarlo.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setConfirmDelete(null)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-off-white font-medium py-2.5 rounded-xl transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={() => handleDeletePaquete(confirmDelete)} 
                disabled={isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors text-sm flex items-center justify-center gap-2"
              >
                {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
