'use client'

import { CalendarDays, Clock, Users, Check, Plus } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { formatCurrency, formatDate } from '@/lib/utils'
import { getMetadata, type TipoProducto } from '@/lib/boletos'

export default function EventoCard({ evento }: { evento: TipoProducto }) {
  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)

  const meta = getMetadata(evento)
  const enCarrito = items.some((i) => i.tipoProductoId === evento.id)

  return (
    <div className="flex flex-col rounded-2xl border border-forest-green-dark/10 bg-white p-6 shadow-sm">
      <h3 className="text-lg font-bold text-forest-green-dark">
        {evento.nombre}
      </h3>
      {evento.descripcion && (
        <p className="mt-1 text-sm text-forest-green-dark/60">
          {evento.descripcion}
        </p>
      )}

      <div className="mt-4 space-y-2 text-sm text-forest-green-dark/80">
        {meta.fecha && (
          <p className="flex items-center gap-2">
            <CalendarDays className="h-4 w-4 text-quetzal-blue" />
            {formatDate(meta.fecha)}
          </p>
        )}
        {meta.hora && (
          <p className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-quetzal-blue" />
            {meta.hora} hrs
          </p>
        )}
        {meta.cupo && (
          <p className="flex items-center gap-2">
            <Users className="h-4 w-4 text-quetzal-blue" />
            Cupo limitado: {meta.cupo} personas
          </p>
        )}
      </div>

      <div className="mt-6 flex items-center justify-between">
        <p className="text-2xl font-extrabold text-quetzal-blue">
          {formatCurrency(Number(evento.precio))}
        </p>
        <button
          type="button"
          disabled={enCarrito}
          onClick={() =>
            addItem({
              tipoProductoId: evento.id,
              nombre: evento.nombre,
              precio: Number(evento.precio),
              categoria: evento.categoria,
              metadata: evento.metadata,
            })
          }
          className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
            enCarrito
              ? 'cursor-default bg-forest-green-light/10 text-forest-green-light'
              : 'bg-conservation-gold text-forest-green-dark hover:scale-105'
          }`}
        >
          {enCarrito ? (
            <>
              <Check className="h-4 w-4" /> Agregado
            </>
          ) : (
            <>
              <Plus className="h-4 w-4" /> Reservar
            </>
          )}
        </button>
      </div>
    </div>
  )
}
