'use client'

import { useState, useCallback } from 'react'
import { CalendarDays, Minus, Plus, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { formatCurrency } from '@/lib/utils'
import { getMetadata, type TipoProducto } from '@/lib/boletos'
import { createClient } from '@/lib/supabase'

function fechaMinima(): string {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}

interface Disponibilidad {
  cupo_maximo: number
  lugares_ocupados: number
  disponibles: number
}

export default function EntradaSelector({
  tiposEntrada,
}: {
  tiposEntrada: TipoProducto[]
}) {
  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)
  const updateCantidad = useCartStore((s) => s.updateCantidad)
  const fechaVisita = useCartStore((s) => s.fechaVisita)
  const setFechaVisita = useCartStore((s) => s.setFechaVisita)

  const [disponibilidad, setDisponibilidad] = useState<Disponibilidad | null>(null)
  const [loadingDisp, setLoadingDisp] = useState(false)

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

  const handleFechaChange = (fecha: string) => {
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

  return (
    <div className="space-y-6">
      {/* Selector de fecha */}
      <div className="rounded-xl border border-forest-green-dark/10 bg-white p-4">
        <label
          htmlFor="fecha-visita"
          className="mb-2 flex items-center gap-2 text-sm font-semibold text-forest-green-dark"
        >
          <CalendarDays className="h-4 w-4 text-quetzal-blue" />
          Fecha de tu visita
        </label>
        <input
          id="fecha-visita"
          type="date"
          min={fechaMinima()}
          value={fechaVisita ?? ''}
          onChange={(e) => handleFechaChange(e.target.value)}
          suppressHydrationWarning
          className="w-full rounded-lg border border-forest-green-dark/15 bg-white px-3 py-2 text-forest-green-dark focus:border-quetzal-blue focus:outline-none"
        />
        {renderDisponibilidad()}
      </div>

      {/* Lista de entradas */}
      <div className="space-y-3">
        {tiposEntrada.map((entrada) => {
          const cantidad = cantidadDe(entrada.id)
          const meta = getMetadata(entrada)
          return (
            <div
              key={entrada.id}
              className="flex items-center justify-between rounded-xl border border-forest-green-dark/10 bg-white p-4"
            >
              <div className="min-w-0">
                <h3 className="font-semibold text-forest-green-dark">
                  {entrada.nombre}
                </h3>
                {entrada.descripcion && (
                  <p className="text-sm text-forest-green-dark/60">
                    {entrada.descripcion}
                  </p>
                )}
                {entrada.categoria === 'paquete_familiar' && (
                  <p className="mt-1 text-xs text-quetzal-blue">
                    {meta.adultos} adultos + {meta.ninos} niños
                  </p>
                )}
                <p className="mt-1 font-bold text-quetzal-blue">
                  {formatCurrency(Number(entrada.precio))}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => updateCantidad(entrada.id, cantidad - 1)}
                  disabled={cantidad === 0}
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-forest-green-dark/20 text-forest-green-dark transition-colors hover:bg-forest-green-dark/5 disabled:opacity-40"
                  aria-label="Quitar uno"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="w-6 text-center font-semibold text-forest-green-dark">
                  {cantidad}
                </span>
                <button
                  type="button"
                  disabled={diaAgotado}
                  onClick={() =>
                    cantidad === 0
                      ? addItem({
                          tipoProductoId: entrada.id,
                          nombre: entrada.nombre,
                          precio: Number(entrada.precio),
                          categoria: entrada.categoria,
                          metadata: entrada.metadata,
                        })
                      : updateCantidad(entrada.id, cantidad + 1)
                  }
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-conservation-gold text-forest-green-dark transition-transform hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Agregar uno"
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
