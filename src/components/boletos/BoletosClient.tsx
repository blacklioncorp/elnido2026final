'use client'

import { useState } from 'react'
import { Ticket, Star, PartyPopper } from 'lucide-react'
import type { TipoProducto } from '@/lib/boletos'
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
}: {
  entradas: TipoProducto[]
  membresias: TipoProducto[]
  eventos: TipoProducto[]
}) {
  const [tab, setTab] = useState<Tab>('entradas')

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[1fr_24rem]">
      <div>
        {/* Tabs */}
        <div className="mb-6 flex gap-2 rounded-full border border-forest-green-dark/10 bg-white p-1">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
                tab === id
                  ? 'bg-forest-green-dark text-off-white'
                  : 'text-forest-green-dark/60 hover:text-forest-green-dark'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
        </div>

        {/* Contenido */}
        {tab === 'entradas' && <EntradaSelector tiposEntrada={entradas} />}

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
  )
}
