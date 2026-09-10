'use client'

import { useState, useMemo, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Heart, 
  Users, 
  DollarSign, 
  Repeat, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  ChevronLeft, 
  ChevronRight, 
  Sparkles,
  MessageSquare,
  Bird
} from 'lucide-react'
import Image from 'next/image'
import MetricCard from '@/components/admin/MetricCard'
import PadrinoDetalleModal from './PadrinoDetalleModal'
import { cn } from '@/lib/utils'
import type { ApadrinamientoRow, ApadrinamientosKPIs, EspecieOpcion } from '@/app/(admin)/admin/apadrinamientos/actions'

const PAGE_SIZE = 15

interface ApadrinamientosAdminClientProps {
  initialData: {
    apadrinamientos: ApadrinamientoRow[]
    kpis: ApadrinamientosKPIs
    especies: EspecieOpcion[]
  }
}

export default function ApadrinamientosAdminClient({ initialData }: ApadrinamientosAdminClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  // Filtros y búsqueda
  const [busqueda, setBusqueda] = useState('')
  const [filtroEstado, setFiltroEstado] = useState('todos')
  const [filtroEspecie, setFiltroEspecie] = useState('todas')

  // Paginación
  const [currentPage, setCurrentPage] = useState(1)

  // Modal
  const [selectedApadrinamiento, setSelectedApadrinamiento] = useState<ApadrinamientoRow | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const handleRefresh = () => {
    startTransition(() => {
      router.refresh()
    })
  }

  // Filtrado reactivo
  const apadrinamientosFiltrados = useMemo(() => {
    return initialData.apadrinamientos.filter((item) => {
      // Búsqueda por texto
      if (busqueda.trim()) {
        const query = busqueda.toLowerCase()
        const matchNombre = item.donante_nombre.toLowerCase().includes(query)
        const matchEmail = item.donante_email.toLowerCase().includes(query)
        const matchUsername = item.donante_username?.toLowerCase().includes(query) || false
        const matchEspecie = item.tarjeta?.nombre_especie.toLowerCase().includes(query) || false
        const matchAnimal = item.tarjeta?.nombre_animal?.toLowerCase().includes(query) || false

        if (!matchNombre && !matchEmail && !matchUsername && !matchEspecie && !matchAnimal) {
          return false
        }
      }

      // Filtro por Estado
      if (filtroEstado !== 'todos') {
        if (filtroEstado === 'unicos' && item.es_recurrente) return false
        if (filtroEstado === 'recurrentes' && !item.es_recurrente) return false
        if (filtroEstado === 'activa' && item.estado_suscripcion !== 'activa') return false
        if (filtroEstado === 'pausada' && item.estado_suscripcion !== 'pausada') return false
        if (filtroEstado === 'cancelada' && item.estado_suscripcion !== 'cancelada') return false
      }

      // Filtro por Especie
      if (filtroEspecie !== 'todas') {
        if (item.tarjeta_id !== filtroEspecie) return false
      }

      return true
    })
  }, [initialData.apadrinamientos, busqueda, filtroEstado, filtroEspecie])

  // Reset page when filters change
  const handleSearchChange = (val: string) => {
    setBusqueda(val)
    setCurrentPage(1)
  }

  const handleEstadoChange = (val: string) => {
    setFiltroEstado(val)
    setCurrentPage(1)
  }

  const handleEspecieChange = (val: string) => {
    setFiltroEspecie(val)
    setCurrentPage(1)
  }

  // Paginación calculada
  const totalPages = Math.max(1, Math.ceil(apadrinamientosFiltrados.length / PAGE_SIZE))
  const paginaActual = Math.min(currentPage, totalPages)
  const itemsPagina = apadrinamientosFiltrados.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE)

  return (
    <div className="p-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-off-white tracking-tight">Apadrinamientos</h1>
          <p className="text-off-white/50 mt-1">
            Gestión de guardianes, aportaciones y suscripciones del programa Del Nido al Vuelo
          </p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={isPending}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-off-white text-sm font-semibold transition-colors disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={cn('h-4 w-4 text-conservation-gold', isPending && 'animate-spin')} />
          Actualizar Lista
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        <MetricCard
          title="Total Recaudado"
          value={`$${initialData.kpis.totalRecaudado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`}
          change="Programa Guardianes"
          icon={DollarSign}
          color="purple"
        />
        <MetricCard
          title="Guardianes Activos"
          value={initialData.kpis.guardianesActivos}
          change="Suscripciones vigentes"
          icon={Users}
          color="blue"
        />
        <MetricCard
          title="Aportaciones Mensuales"
          value={initialData.kpis.recurrentesCount}
          change={`${initialData.kpis.unicosCount} aportaciones únicas`}
          icon={Repeat}
          color="gold"
        />
        <MetricCard
          title="Padrinos Registrados"
          value={initialData.kpis.totalPadrinos}
          change="Comunidad Guardián"
          icon={Heart}
          color="green"
        />
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        {/* Buscador */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-off-white/40" />
          <input
            type="text"
            value={busqueda}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Buscar por padrino, correo, @usuario o especie..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-off-white text-sm placeholder:text-off-white/30 focus:outline-none focus:border-conservation-gold/50 transition-colors"
          />
        </div>

        {/* Filtro por Estado */}
        <div className="w-full md:w-52">
          <select
            value={filtroEstado}
            onChange={(e) => handleEstadoChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1f18] border border-white/10 text-off-white text-sm focus:outline-none focus:border-conservation-gold/50 transition-colors cursor-pointer"
          >
            <option value="todos">Todos los estados</option>
            <option value="activa">Suscripción Activa</option>
            <option value="pausada">Suscripción Pausada</option>
            <option value="cancelada">Suscripción Cancelada</option>
            <option value="recurrentes">Solo Recurrentes</option>
            <option value="unicos">Solo Pagos Únicos</option>
          </select>
        </div>

        {/* Filtro por Especie */}
        <div className="w-full md:w-60">
          <select
            value={filtroEspecie}
            onChange={(e) => handleEspecieChange(e.target.value)}
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#0e1f18] border border-white/10 text-off-white text-sm focus:outline-none focus:border-conservation-gold/50 transition-colors cursor-pointer"
          >
            <option value="todas">Todas las especies</option>
            {initialData.especies.map((esp) => (
              <option key={esp.id} value={esp.id}>
                {esp.nombre_especie} {esp.nombre_animal ? `(${esp.nombre_animal})` : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla de Apadrinamientos */}
      <div className="bg-forest-green-light/40 backdrop-blur-sm rounded-2xl border border-white/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[950px]">
            <thead>
              <tr className="bg-white/[0.02] border-b border-white/10 text-xs font-semibold text-off-white/60 uppercase tracking-wider">
                <th className="p-4">Fecha</th>
                <th className="p-4">Padrino / Guardián</th>
                <th className="p-4">Especie Apadrinada</th>
                <th className="p-4 text-center">Frecuencia</th>
                <th className="p-4 text-right">Monto</th>
                <th className="p-4 text-center">Estado</th>
                <th className="p-4">Dedicatoria</th>
                <th className="p-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-sm text-off-white">
              {itemsPagina.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-off-white/50">
                    No se encontraron apadrinamientos con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                itemsPagina.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => {
                      setSelectedApadrinamiento(item)
                      setIsModalOpen(true)
                    }}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    {/* Fecha */}
                    <td className="p-4 whitespace-nowrap text-off-white/70 text-xs font-mono">
                      {new Date(item.created_at).toLocaleDateString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    {/* Padrino */}
                    <td className="p-4">
                      <div className="font-semibold text-off-white">{item.donante_nombre}</div>
                      <div className="text-xs text-off-white/40 font-mono">{item.donante_email}</div>
                      {item.donante_username && (
                        <span className="inline-block text-[11px] text-quetzal-blue font-medium mt-0.5">
                          @{item.donante_username}
                        </span>
                      )}
                    </td>

                    {/* Especie */}
                    <td className="p-4">
                      {item.tarjeta ? (
                        <div className="flex items-center gap-3">
                          {item.tarjeta.imagen_url ? (
                            <div className="w-9 h-9 rounded-lg overflow-hidden relative shrink-0 border border-white/10">
                              <Image
                                src={item.tarjeta.imagen_url}
                                alt={item.tarjeta.nombre_especie}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-9 h-9 rounded-lg bg-conservation-gold/20 border border-conservation-gold/30 flex items-center justify-center shrink-0 text-conservation-gold">
                              <Bird className="h-4 w-4" />
                            </div>
                          )}
                          <div>
                            <span className="font-semibold text-off-white block text-sm">
                              {item.tarjeta.nombre_especie}
                            </span>
                            {item.tarjeta.nombre_animal && (
                              <span className="text-xs text-conservation-gold/80 block">
                                {item.tarjeta.nombre_animal}
                              </span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-off-white/50 text-xs italic">
                          Donación General
                        </span>
                      )}
                    </td>

                    {/* Frecuencia */}
                    <td className="p-4 text-center whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full border',
                          item.es_recurrente
                            ? 'bg-quetzal-blue/15 text-quetzal-blue border-quetzal-blue/30'
                            : 'bg-white/5 text-off-white/70 border-white/10'
                        )}
                      >
                        {item.es_recurrente ? (
                          <>
                            <Repeat className="h-3 w-3" /> Mensual
                          </>
                        ) : (
                          '⚡ Única'
                        )}
                      </span>
                    </td>

                    {/* Monto */}
                    <td className="p-4 text-right whitespace-nowrap font-bold text-conservation-gold">
                      ${item.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </td>

                    {/* Estado */}
                    <td className="p-4 text-center whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-block text-xs font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider',
                          item.estado_suscripcion === 'activa' && 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
                          item.estado_suscripcion === 'pausada' && 'bg-amber-500/20 text-amber-400 border-amber-500/30',
                          item.estado_suscripcion === 'cancelada' && 'bg-red-500/20 text-red-400 border-red-500/30',
                          !item.estado_suscripcion && 'bg-white/10 text-off-white/60 border-white/10'
                        )}
                      >
                        {item.estado_suscripcion ? item.estado_suscripcion : 'COMPLETADA'}
                      </span>
                    </td>

                    {/* Mensaje */}
                    <td className="p-4 max-w-[200px]">
                      {item.mensaje ? (
                        <p className="text-xs text-off-white/70 truncate italic flex items-center gap-1">
                          <MessageSquare className="h-3 w-3 shrink-0 text-conservation-gold" />
                          &ldquo;{item.mensaje}&rdquo;
                        </p>
                      ) : (
                        <span className="text-xs text-off-white/20">—</span>
                      )}
                    </td>

                    {/* Acción */}
                    <td className="p-4 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedApadrinamiento(item)
                          setIsModalOpen(true)
                        }}
                        className="p-1.5 rounded-lg text-off-white/50 hover:text-white hover:bg-white/10 transition-colors"
                        title="Ver detalle del padrino"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {apadrinamientosFiltrados.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 text-sm text-off-white/60">
          <p>
            Mostrando{' '}
            <span className="font-semibold text-off-white">
              {(paginaActual - 1) * PAGE_SIZE + 1}–
              {Math.min(paginaActual * PAGE_SIZE, apadrinamientosFiltrados.length)}
            </span>{' '}
            de{' '}
            <span className="font-semibold text-off-white">{apadrinamientosFiltrados.length}</span>{' '}
            padrinos
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-off-white/70 hover:text-off-white"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Números de página */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => p === 1 || p === totalPages || Math.abs(p - paginaActual) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...')
                acc.push(p)
                return acc
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-2 text-off-white/30">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={cn(
                      'min-w-[36px] h-9 rounded-lg border text-xs font-semibold transition-colors',
                      paginaActual === p
                        ? 'bg-conservation-gold/20 border-conservation-gold/40 text-conservation-gold'
                        : 'bg-white/5 border-white/10 text-off-white/70 hover:bg-white/10'
                    )}
                  >
                    {p}
                  </button>
                )
              )}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={paginaActual === totalPages}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-off-white/70 hover:text-off-white"
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal de Detalle */}
      <PadrinoDetalleModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false)
          setSelectedApadrinamiento(null)
        }}
        apadrinamiento={selectedApadrinamiento}
        onUpdate={handleRefresh}
      />
    </div>
  )
}
