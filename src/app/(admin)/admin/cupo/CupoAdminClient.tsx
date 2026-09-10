'use client'

import { useState, useTransition } from 'react'
import { format, isToday, isPast, parseISO, isAfter } from 'date-fns'
import { es } from 'date-fns/locale'
import { Calendar, Users, Settings, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { Database } from '@/lib/database.types'
import { ajustarCupoFecha, ajustarCupoGlobal } from './actions'

type CupoDiario = Database['public']['Tables']['cupo_diario']['Row']

type Filtro = '7' | '30' | 'mes'

function getEstado(c: CupoDiario) {
  const disponibles = c.cupo_maximo - c.lugares_ocupados
  if (disponibles <= 0) return 'agotado'
  if (disponibles <= 10) return 'escaso'
  return 'disponible'
}

const ESTADO_CONFIG = {
  disponible: {
    label: 'Disponible',
    icon: CheckCircle,
    cls: 'text-emerald-600 bg-emerald-50',
  },
  escaso: {
    label: 'Escaso',
    icon: AlertTriangle,
    cls: 'text-amber-600 bg-amber-50',
  },
  agotado: {
    label: 'Agotado',
    icon: XCircle,
    cls: 'text-red-600 bg-red-50',
  },
}

export default function CupoAdminClient({ registros }: { registros: CupoDiario[] }) {
  const [filtro, setFiltro] = useState<Filtro>('30')
  const [cupoGlobal, setCupoGlobal] = useState(50)
  const [ajusteFecha, setAjusteFecha] = useState('')
  const [ajusteCupo, setAjusteCupo] = useState(50)
  const [isPending, startTransition] = useTransition()

  const hoy = new Date()

  const filtrados = registros.filter((r) => {
    const fecha = parseISO(r.fecha)
    if (filtro === '7') return !isPast(fecha) || isToday(fecha)
    if (filtro === '30') {
      const en30 = new Date()
      en30.setDate(en30.getDate() + 30)
      return !isPast(fecha) || isToday(fecha)
    }
    // mes actual
    return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear()
  }).slice(0, filtro === '7' ? 7 : filtro === '30' ? 30 : 31)

  const handleGlobal = () => {
    startTransition(async () => {
      const res = await ajustarCupoGlobal(cupoGlobal)
      if ('error' in res) { toast.error(res.error); return }
      toast.success(`Cupo global actualizado a ${cupoGlobal} personas`)
    })
  }

  const handleAjusteFecha = () => {
    if (!ajusteFecha) { toast.error('Selecciona una fecha'); return }
    startTransition(async () => {
      const res = await ajustarCupoFecha({ fecha: ajusteFecha, cupo_maximo: ajusteCupo })
      if ('error' in res) { toast.error(res.error ?? 'Error'); return }
      toast.success(`Cupo para ${ajusteFecha} actualizado a ${ajusteCupo}`)
      setAjusteFecha('')
    })
  }

  const statAgotados = registros.filter((r) => r.cupo_maximo - r.lugares_ocupados <= 0).length
  const statEscasos = registros.filter((r) => {
    const d = r.cupo_maximo - r.lugares_ocupados
    return d > 0 && d <= 10
  }).length
  const totalRegistros = registros.length

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-forest-green-dark">Control de Cupo Diario</h1>
        <p className="text-forest-green-dark/60 mt-1">Gestiona la capacidad máxima de visitantes por día.</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-forest-green-dark/10 shadow-sm flex items-start gap-4">
          <div className="bg-blue-50 p-3 rounded-xl"><Calendar className="h-5 w-5 text-blue-600" /></div>
          <div>
            <p className="text-sm text-forest-green-dark/60">Días registrados</p>
            <p className="text-2xl font-bold text-forest-green-dark">{totalRegistros}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-forest-green-dark/10 shadow-sm flex items-start gap-4">
          <div className="bg-amber-50 p-3 rounded-xl"><AlertTriangle className="h-5 w-5 text-amber-600" /></div>
          <div>
            <p className="text-sm text-forest-green-dark/60">Días con cupo escaso (&lt;10)</p>
            <p className="text-2xl font-bold text-forest-green-dark">{statEscasos}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-forest-green-dark/10 shadow-sm flex items-start gap-4">
          <div className="bg-red-50 p-3 rounded-xl"><XCircle className="h-5 w-5 text-red-600" /></div>
          <div>
            <p className="text-sm text-forest-green-dark/60">Días agotados</p>
            <p className="text-2xl font-bold text-forest-green-dark">{statAgotados}</p>
          </div>
        </div>
      </div>

      {/* Settings panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Global default */}
        <div className="bg-white rounded-2xl p-6 border border-forest-green-dark/10 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="h-5 w-5 text-forest-green-dark/60" />
            <h2 className="font-bold text-forest-green-dark">Cupo Máximo Global</h2>
          </div>
          <p className="text-sm text-forest-green-dark/60 mb-4">
            Actualiza el cupo predeterminado para todos los días futuros que ya tienen registro.
          </p>
          <div className="flex gap-3">
            <input
              type="number"
              min={1}
              max={10000}
              value={cupoGlobal}
              onChange={(e) => setCupoGlobal(Number(e.target.value))}
              className="flex-1 border border-forest-green-dark/20 rounded-lg px-3 py-2 text-sm focus:border-quetzal-blue focus:outline-none"
            />
            <button
              onClick={handleGlobal}
              disabled={isPending}
              className="bg-forest-green-dark text-white font-bold px-4 py-2 rounded-lg hover:bg-forest-green-light transition-colors text-sm disabled:opacity-60 flex items-center gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Aplicar
            </button>
          </div>
        </div>

        {/* Adjust specific date */}
        <div className="bg-white rounded-2xl p-6 border border-forest-green-dark/10 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-forest-green-dark/60" />
            <h2 className="font-bold text-forest-green-dark">Ajustar Fecha Específica</h2>
          </div>
          <p className="text-sm text-forest-green-dark/60 mb-4">
            Modifica el cupo de una fecha concreta (ej: eventos especiales).
          </p>
          <div className="space-y-2">
            <div className="flex gap-3">
              <input
                type="date"
                min={format(hoy, 'yyyy-MM-dd')}
                value={ajusteFecha}
                onChange={(e) => setAjusteFecha(e.target.value)}
                className="flex-1 border border-forest-green-dark/20 rounded-lg px-3 py-2 text-sm focus:border-quetzal-blue focus:outline-none"
              />
              <input
                type="number"
                min={1}
                max={10000}
                value={ajusteCupo}
                onChange={(e) => setAjusteCupo(Number(e.target.value))}
                className="w-24 border border-forest-green-dark/20 rounded-lg px-3 py-2 text-sm focus:border-quetzal-blue focus:outline-none"
              />
            </div>
            <button
              onClick={handleAjusteFecha}
              disabled={isPending}
              className="w-full bg-quetzal-blue text-white font-bold py-2 rounded-lg hover:bg-quetzal-blue/90 transition-colors text-sm disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              Guardar ajuste
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['7', '30', 'mes'] as Filtro[]).map((f) => (
          <button key={f} onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
              filtro === f ? 'bg-forest-green-dark text-white' : 'bg-forest-green-dark/5 text-forest-green-dark/60 hover:bg-forest-green-dark/10'
            }`}>
            {f === '7' ? 'Próximos 7 días' : f === '30' ? 'Próximos 30 días' : 'Mes actual'}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-forest-green-dark/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[600px]">
            <thead>
              <tr className="bg-forest-green-dark/5 border-b border-forest-green-dark/10 text-xs font-bold text-forest-green-dark/60 uppercase tracking-wider">
                <th className="p-4">Fecha</th>
                <th className="p-4 text-center">Cupo Máximo</th>
                <th className="p-4 text-center">Ocupados</th>
                <th className="p-4 text-center">Disponibles</th>
                <th className="p-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-green-dark/5 text-sm">
              {filtrados.length === 0 && (
                <tr><td colSpan={5} className="p-8 text-center text-forest-green-dark/40">
                  Sin registros. Los días se crean automáticamente cuando hay consultas o compras.
                </td></tr>
              )}
              {filtrados.map((r) => {
                const fecha = parseISO(r.fecha)
                const pasado = isPast(fecha) && !isToday(fecha)
                const estado = getEstado(r)
                const EstadoIcon = ESTADO_CONFIG[estado].icon
                return (
                  <tr key={r.id} className={`transition-colors ${pasado ? 'bg-gray-50 text-forest-green-dark/40' : 'hover:bg-forest-green-dark/2'}`}>
                    <td className="p-4 font-medium">
                      <span className={pasado ? 'text-forest-green-dark/40' : 'text-forest-green-dark'}>
                        {format(fecha, "EEEE d 'de' MMMM", { locale: es })}
                        {isToday(fecha) && <span className="ml-2 text-xs bg-quetzal-blue/10 text-quetzal-blue font-bold px-2 py-0.5 rounded-full">Hoy</span>}
                      </span>
                    </td>
                    <td className="p-4 text-center font-bold text-forest-green-dark">{r.cupo_maximo}</td>
                    <td className="p-4 text-center text-forest-green-dark/70">{r.lugares_ocupados}</td>
                    <td className="p-4 text-center font-bold">
                      <span className={estado === 'agotado' ? 'text-red-500' : estado === 'escaso' ? 'text-amber-500' : 'text-emerald-600'}>
                        {r.cupo_maximo - r.lugares_ocupados}
                      </span>
                    </td>
                    <td className="p-4">
                      {!pasado && (
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${ESTADO_CONFIG[estado].cls}`}>
                          <EstadoIcon className="h-3 w-3" />
                          {ESTADO_CONFIG[estado].label}
                        </span>
                      )}
                      {pasado && <span className="text-xs text-forest-green-dark/30">Pasado</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
