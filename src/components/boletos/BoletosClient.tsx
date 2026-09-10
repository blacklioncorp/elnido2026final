'use client'

import { useState } from 'react'
import { Ticket, Star, PartyPopper, Check } from 'lucide-react'
import type { TipoProducto } from '@/lib/boletos'
import { useCartStore } from '@/store/cart-store'
import { formatDate, cn } from '@/lib/utils'
import EntradaSelector from './EntradaSelector'
import MembresiaCard from './MembresiaCard'
import EventoCard from './EventoCard'
import CartResumen from './CartResumen'

type Tab = 'entradas' | 'membresias' | 'eventos'

const TABS: { id: Tab; label: string; icon: typeof Ticket }[] = [
  { id: 'entradas', label: 'Entradas', icon: Ticket },
  { id: 'membresias', label: 'Membresías', icon: Star },
  { id: 'eventos', label: 'Eventos', icon: PartyPopper },
]

export default function BoletosClient({
  entradas,
  membresias,
  eventos,
  diasHabilitados = [0, 1, 2, 3, 4, 5, 6],
}: {
  entradas: TipoProducto[]
  membresias: TipoProducto[]
  eventos: TipoProducto[]
  diasHabilitados?: number[]
}) {
  const [tab, setTab] = useState<Tab>('entradas')

  const items = useCartStore((s) => s.items)
  const fechaVisita = useCartStore((s) => s.fechaVisita)
  const getCantidadTotal = useCartStore((s) => s.getCantidadTotal)

  const cantidadTotal = getCantidadTotal()
  const paso1Completo = Boolean(fechaVisita)
  const paso2Completo = items.length > 0

  return (
    <div className="mx-auto max-w-6xl px-3 sm:px-4 py-6 sm:py-8 w-full overflow-x-hidden">
      {/* Stepper Visual de Compra Guiada (Ultra Responsive) */}
      <div className="mb-6 rounded-2xl bg-white p-3 sm:p-4 border border-forest-green-dark/10 shadow-sm w-full overflow-hidden">
        <div className="flex items-center justify-between w-full max-w-xl mx-auto">
          {/* Paso 1 */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0">
            <div
              className={cn(
                'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all shrink-0',
                paso1Completo
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-conservation-gold text-forest-green-dark ring-2 sm:ring-4 ring-conservation-gold/20 font-extrabold'
              )}
            >
              {paso1Completo ? <Check className="h-3 w-3 sm:h-4 sm:w-4 stroke-[3]" /> : '1'}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-forest-green-dark whitespace-nowrap">
                1. Fecha
              </p>
              <p className="hidden md:block text-[11px] text-forest-green-dark/60 truncate max-w-[120px]">
                {paso1Completo ? formatDate(fechaVisita!) : 'Elige día'}
              </p>
            </div>
          </div>

          {/* Línea conectora 1 */}
          <div
            className={cn(
              'h-0.5 flex-1 min-w-[10px] sm:min-w-[16px] mx-1 sm:mx-3 transition-colors shrink',
              paso1Completo ? 'bg-emerald-500' : 'bg-forest-green-dark/15'
            )}
          />

          {/* Paso 2 */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0">
            <div
              className={cn(
                'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all shrink-0',
                paso2Completo
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : paso1Completo
                  ? 'bg-conservation-gold text-forest-green-dark ring-2 sm:ring-4 ring-conservation-gold/20 font-extrabold'
                  : 'bg-forest-green-dark/10 text-forest-green-dark/40'
              )}
            >
              {paso2Completo ? <Check className="h-3 w-3 sm:h-4 sm:w-4 stroke-[3]" /> : '2'}
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-forest-green-dark whitespace-nowrap">
                2. Entradas
              </p>
              <p className="hidden md:block text-[11px] text-forest-green-dark/60 truncate max-w-[120px]">
                {paso2Completo ? `${cantidadTotal} boleto(s)` : 'Selecciona'}
              </p>
            </div>
          </div>

          {/* Línea conectora 2 */}
          <div
            className={cn(
              'h-0.5 flex-1 min-w-[10px] sm:min-w-[16px] mx-1 sm:mx-3 transition-colors shrink',
              paso2Completo ? 'bg-emerald-500' : 'bg-forest-green-dark/15'
            )}
          />

          {/* Paso 3 */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0 shrink-0">
            <div
              className={cn(
                'w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-[11px] sm:text-xs font-bold transition-all shrink-0',
                paso1Completo && paso2Completo
                  ? 'bg-conservation-gold text-forest-green-dark ring-2 sm:ring-4 ring-conservation-gold/20 font-extrabold'
                  : 'bg-forest-green-dark/10 text-forest-green-dark/40'
              )}
            >
              3
            </div>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs font-bold text-forest-green-dark whitespace-nowrap">
                3. Pagar
              </p>
              <p className="hidden md:block text-[11px] text-forest-green-dark/60">
                Checkout
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 sm:gap-8 md:grid-cols-[1fr_24rem] w-full">
        <div className="min-w-0">
          {/* Tabs */}
          <div className="mb-6 flex gap-2 rounded-full border border-forest-green-dark/10 bg-white p-1 shadow-sm">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setTab(id)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-full px-3 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold transition-colors ${
                  tab === id
                    ? 'bg-forest-green-dark text-off-white shadow-sm'
                    : 'text-forest-green-dark/60 hover:text-forest-green-dark'
                }`}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>

          {/* Contenido */}
          {tab === 'entradas' && (
            <EntradaSelector
              tiposEntrada={entradas}
              diasHabilitados={diasHabilitados}
            />
          )}

          {tab === 'membresias' && (
            <div className="grid gap-6 pt-3 sm:grid-cols-2 lg:grid-cols-3">
              {membresias.map((m) => (
                <MembresiaCard key={m.id} membresia={m} />
              ))}
            </div>
          )}

          {tab === 'eventos' && (
            <div className="grid gap-6 sm:grid-cols-2">
              {eventos.map((e) => (
                <EventoCard key={e.id} evento={e} />
              ))}
            </div>
          )}
        </div>

        <CartResumen />
      </div>
    </div>
  )
}
