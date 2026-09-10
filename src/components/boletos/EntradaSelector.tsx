'use client'

import { useState, useCallback } from 'react'
import { 
  CalendarDays, 
  Minus, 
  Plus, 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Loader2, 
  Info 
} from 'lucide-react'
import { toast } from 'sonner'
import { useCartStore } from '@/store/cart-store'
import { formatCurrency, cn } from '@/lib/utils'
import { getMetadata, type TipoProducto } from '@/lib/boletos'
import { createClient } from '@/lib/supabase'

function fechaMinima(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

interface Disponibilidad {
  cupo_maximo: number
  lugares_ocupados: number
  disponibles: number
}

const NOMBRES_DIAS_MIN: Record<number, string> = {
  1: 'lunes',
  2: 'martes',
  3: 'miércoles',
  4: 'jueves',
  5: 'viernes',
  6: 'sábado',
  0: 'domingo',
}

const DIAS_ABREV = [
  { dia: 1, abrev: 'Lun' },
  { dia: 2, abrev: 'Mar' },
  { dia: 3, abrev: 'Mié' },
  { dia: 4, abrev: 'Jue' },
  { dia: 5, abrev: 'Vie' },
  { dia: 6, abrev: 'Sáb' },
  { dia: 0, abrev: 'Dom' },
]

function formatearDiasDisponibles(diasHabilitados: number[]): string {
  if (diasHabilitados.length === 7) {
    return 'Venta disponible todos los días (lunes a domingo)'
  }
  if (diasHabilitados.length === 0) {
    return 'Venta no disponible temporalmente en ningún día'
  }
  const orden = [1, 2, 3, 4, 5, 6, 0]
  const activos = orden.filter((d) => diasHabilitados.includes(d))
  const nombres = activos.map((d) => NOMBRES_DIAS_MIN[d])

  if (nombres.length === 1) {
    return `Venta disponible solo los ${nombres[0]}`
  }
  const ultimo = nombres[nombres.length - 1]
  const primeros = nombres.slice(0, -1).join(', ')
  return `Venta disponible: ${primeros} y ${ultimo}`
}

export default function EntradaSelector({
  tiposEntrada,
  diasHabilitados = [0, 1, 2, 3, 4, 5, 6],
}: {
  tiposEntrada: TipoProducto[]
  diasHabilitados?: number[]
}) {
  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const updateCantidad = useCartStore((s) => s.updateCantidad)
  const fechaVisita = useCartStore((s) => s.fechaVisita)
  const setFechaVisita = useCartStore((s) => s.setFechaVisita)

  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null)
  const [loadingDisp, setLoadingDisp] = useState(false)
  const [errorDia, setErrorDia] = useState<string | null>(null)

  const cantidadDe = (id: string) =>
    items.find((i) => i.tipoProductoId === id)?.cantidad ?? 0

  const consultarDisponibilidad = useCallback(async (fecha: string) => {
    if (!fecha) { setDisponibilidad(null); return }
    setLoadingDisp(true)
    try {
      const supabase = createClient()
      const { data } = await supabase.rpc('consultar_disponibilidad', {
        fecha_consulta: fecha,
      })
      if (data && data.length > 0) {
        setDisponibilidad({
          cupo_maximo: data[0].cupo_maximo,
          lugares_ocupados: data[0].lugares_ocupados,
          disponibles: data[0].disponibles,
        })
      }
    } catch {
      setDisponibilidad(null)
    } finally {
      setLoadingDisp(false)
    }
  }, [])

  // Verificar si la fecha seleccionada en el carrito cae en un día deshabilitado
  const fechaGuardadaInvalida = Boolean(
    fechaVisita && (() => {
      const [y, m, d] = fechaVisita.split('-').map(Number)
      const diaSemana = new Date(y, m - 1, d).getDay()
      return !diasHabilitados.includes(diaSemana)
    })()
  )

  const mensajeError = errorDia || (fechaGuardadaInvalida ? 'La fecha seleccionada no cuenta con venta de boletos disponible. Elige otro día.' : null)

  const handleFechaChange = (fecha: string) => {
    if (!fecha) {
      setFechaVisita(null)
      setErrorDia(null)
      setDisponibilidad(null)
      return
    }

    // Calcular día de la semana sin sesgos de huso horario UTC
    const [y, m, d] = fecha.split('-').map(Number)
    const diaSemana = new Date(y, m - 1, d).getDay() // 0=domingo, 6=sábado

    if (!diasHabilitados.includes(diaSemana)) {
      toast.error('Este día no hay venta de boletos. Elige otro día.')
      setErrorDia('Este día no hay venta de boletos. Elige otro día.')
      setFechaVisita(null)
      setDisponibilidad(null)
      return
    }

    setErrorDia(null)
    setFechaVisita(fecha)
    consultarDisponibilidad(fecha)
  }

  // Availability indicator
  const renderDisponibilidad = () => {
    if (loadingDisp) {
      return (
        <div className="flex items-center gap-2 mt-2 text-xs text-forest-green-dark/50">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          Consultando disponibilidad...
        </div>
      )
    }
    if (!disponibilidad || !fechaVisita) return null

    const { disponibles } = disponibilidad

    if (disponibles <= 0) {
      return (
        <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg">
          <XCircle className="h-4 w-4 flex-shrink-0" />
          Día agotado — selecciona otra fecha
        </div>
      )
    }

    if (disponibles <= 10) {
      return (
        <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          ¡Solo quedan <strong>{disponibles}</strong> lugar{disponibles !== 1 ? 'es' : ''} disponible{disponibles !== 1 ? 's' : ''}!
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2 mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-lg">
        <CheckCircle className="h-4 w-4 flex-shrink-0" />
        <strong>{disponibles}</strong> lugares disponibles
      </div>
    )
  }

  const diaAgotado = disponibilidad !== null && disponibilidad.disponibles <= 0

  const handleIntentarAgregar = (entrada: TipoProducto, cantidad: number) => {
    if (!fechaVisita) {
      toast.error('📅 Primero selecciona la fecha de tu visita')
      const el = document.getElementById('fecha-visita-card')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const input = document.getElementById('fecha-visita')
        if (input) input.focus()
      }
      return
    }

    if (diaAgotado) {
      toast.error('Este día ya no cuenta con lugares disponibles')
      return
    }

    if (cantidad === 0) {
      addItem({
        tipoProductoId: entrada.id,
        nombre: entrada.nombre,
        precio: Number(entrada.precio),
        categoria: entrada.categoria,
        metadata: entrada.metadata,
      })
    } else {
      updateCantidad(entrada.id, cantidad + 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Selector de fecha (Paso 1 Obligatorio) */}
      <div 
        id="fecha-visita-card" 
        className={cn(
          "rounded-2xl bg-white p-5 transition-all shadow-sm",
          !fechaVisita
            ? "border-2 border-conservation-gold shadow-md ring-4 ring-conservation-gold/10"
            : "border border-forest-green-dark/10"
        )}
      >
        <div className="flex items-center justify-between mb-3">
          <label
            htmlFor="fecha-visita"
            className="flex items-center gap-2 text-sm font-bold text-forest-green-dark"
          >
            <CalendarDays className="h-4 w-4 text-conservation-gold" />
            Paso 1: Fecha de tu visita
          </label>
          {fechaVisita && (
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200">
              <CheckCircle className="h-3 w-3" /> Fecha lista
            </span>
          )}
        </div>

        {!fechaVisita && (
          <div className="mb-3 flex items-center gap-2 p-2.5 rounded-xl bg-conservation-gold/15 border border-conservation-gold/30 text-forest-green-dark text-xs font-semibold">
            <span>📅 Primero selecciona la fecha de tu visita para elegir tus entradas</span>
          </div>
        )}

        <div className="relative">
          <input
            id="fecha-visita"
            type="date"
            min={fechaMinima()}
            value={fechaVisita ?? ''}
            onChange={(e) => handleFechaChange(e.target.value)}
            suppressHydrationWarning
          style={{ colorScheme: 'light', color: '#1a3b2a' }}
            className={cn(
              "w-full rounded-xl border bg-white px-4 py-3 text-base sm:text-sm text-forest-green-dark font-bold focus:outline-none transition-all cursor-pointer shadow-sm [color-scheme:light] [&::-webkit-calendar-picker-indicator]:opacity-70",
              !fechaVisita
                ? "border-conservation-gold ring-2 ring-conservation-gold/20"
                : mensajeError
                ? "border-red-500 focus:border-red-500 bg-red-50/20"
                : "border-forest-green-dark/20 focus:border-quetzal-blue"
            )}
          />
        </div>

        {/* Alerta de error si seleccionó día deshabilitado */}
        {mensajeError && (
          <div className="flex items-center gap-2 mt-2.5 text-xs font-semibold text-red-600 bg-red-50 px-3 py-2 rounded-lg border border-red-200">
            <XCircle className="h-4 w-4 shrink-0" />
            <span>{mensajeError}</span>
          </div>
        )}

        {/* Disponibilidad de cupo */}
        {renderDisponibilidad()}

        {/* Mensaje informativo dinámico */}
        <div className="mt-3 pt-3 border-t border-forest-green-dark/10">
          <p className="text-xs font-medium text-forest-green-dark/80 flex items-center gap-1.5">
            <Info className="h-3.5 w-3.5 text-quetzal-blue shrink-0" />
            <span>{formatearDiasDisponibles(diasHabilitados)}</span>
          </p>

          {/* Días visualmente habilitados / deshabilitados (strikethrough en gris) */}
          <div className="mt-2 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-medium text-forest-green-dark/50 mr-1">
              Días habilitados:
            </span>
            {DIAS_ABREV.map(({ dia, abrev }) => {
              const habilitado = diasHabilitados.includes(dia)
              return (
                <span
                  key={dia}
                  className={cn(
                    "text-[11px] font-semibold px-2 py-0.5 rounded-md border transition-all",
                    habilitado
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-gray-100 border-gray-200 text-gray-400 line-through opacity-60"
                  )}
                  title={habilitado ? `${abrev}: Venta habilitada` : `${abrev}: Venta no disponible`}
                >
                  {abrev}
                </span>
              )
            })}
          </div>
        </div>
      </div>

      {/* Paso 2: Lista de entradas */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-sm font-bold text-forest-green-dark flex items-center gap-2">
            <span>Paso 2: Selecciona tus entradas</span>
            {!fechaVisita && (
              <span className="text-[11px] font-normal text-conservation-gold bg-conservation-gold/10 px-2 py-0.5 rounded-md">
                (Requiere fecha)
              </span>
            )}
          </h2>
        </div>

        {tiposEntrada.map((entrada) => {
          const cantidad = cantidadDe(entrada.id)
          const meta = getMetadata(entrada)
          return (
            <div
              key={entrada.id}
              className={cn(
                "flex items-center justify-between rounded-xl border bg-white p-4 transition-all shadow-sm",
                !fechaVisita ? "border-forest-green-dark/10 opacity-90" : "border-forest-green-dark/15 hover:border-forest-green-dark/30"
              )}
            >
              <div className="min-w-0 pr-3">
                <h3 className="font-semibold text-forest-green-dark">
                  {entrada.nombre}
                </h3>
                {entrada.descripcion && (
                  <p className="text-sm text-forest-green-dark/60 mt-0.5 line-clamp-2">
                    {entrada.descripcion}
                  </p>
                )}
                {entrada.categoria === 'paquete_familiar' && (
                  <p className="mt-1 text-xs text-quetzal-blue font-medium">
                    {meta.adultos} adultos + {meta.ninos} niños
                  </p>
                )}
                <p className="mt-1 font-bold text-forest-green-dark">
                  {formatCurrency(Number(entrada.precio))}
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  onClick={() => updateCantidad(entrada.id, cantidad - 1)}
                  disabled={cantidad === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-forest-green-dark/20 text-forest-green-dark transition-colors hover:bg-forest-green-dark/5 disabled:opacity-30 disabled:cursor-not-allowed"
                  aria-label="Quitar uno"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center font-bold text-forest-green-dark">
                  {cantidad}
                </span>
                <button
                  type="button"
                  disabled={diaAgotado}
                  onClick={() => handleIntentarAgregar(entrada, cantidad)}
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full font-bold transition-transform active:scale-95 shadow-sm",
                    !fechaVisita
                      ? "bg-conservation-gold text-forest-green-dark hover:scale-105 cursor-pointer"
                      : diaAgotado
                      ? "bg-gray-200 text-gray-400 cursor-not-allowed opacity-50"
                      : "bg-conservation-gold text-forest-green-dark hover:scale-105 cursor-pointer"
                  )}
                  aria-label="Agregar uno"
                  title={!fechaVisita ? "Selecciona primero la fecha de visita" : "Agregar entrada"}
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
