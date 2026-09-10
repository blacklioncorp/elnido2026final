'use client'

import { useState } from 'react'
import { TrendingUp, Ticket, HandHeart, Store, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActividadItem } from '@/app/(admin)/admin/actions'

const PAGE_SIZE = 5

interface ActividadRecienteClientProps {
  initialActivity: ActividadItem[]
}

export default function ActividadRecienteClient({ initialActivity }: ActividadRecienteClientProps) {
  const [currentPage, setCurrentPage] = useState(1)

  const totalPages = Math.max(1, Math.ceil(initialActivity.length / PAGE_SIZE))
  const paginaActual = Math.min(currentPage, totalPages)
  const itemsPagina = initialActivity.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE)

  return (
    <div className="lg:col-span-2 bg-forest-green-light/40 backdrop-blur-sm rounded-2xl border border-white/10 p-6 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-lg font-bold text-off-white">Actividad Reciente</h2>
            <p className="text-xs text-off-white/50">Últimas transacciones y aportaciones registradas</p>
          </div>
          <TrendingUp className="h-5 w-5 text-off-white/30" />
        </div>

        <div className="space-y-3">
          {initialActivity.length === 0 ? (
            <div className="py-12 text-center text-off-white/50 text-sm">
              No hay actividad reciente registrada.
            </div>
          ) : (
            itemsPagina.map((item) => (
              <div 
                key={item.id} 
                className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0 pr-2">
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 border',
                    item.tipo === 'donativo' && 'bg-conservation-gold/20 text-conservation-gold border-conservation-gold/30',
                    item.tipo === 'boleto' && 'bg-quetzal-blue/20 text-quetzal-blue border-quetzal-blue/30',
                    item.tipo === 'pos' && 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                  )}>
                    {item.tipo === 'donativo' ? (
                      <HandHeart className="h-4 w-4" />
                    ) : item.tipo === 'pos' ? (
                      <Store className="h-4 w-4" />
                    ) : (
                      <Ticket className="h-4 w-4" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-off-white text-sm font-semibold truncate">{item.user}</p>
                    <p className="text-off-white/50 text-xs truncate">
                      {item.action} · <span className="text-off-white/70">{item.time}</span>
                    </p>
                  </div>
                </div>
                <span className="text-conservation-gold font-bold text-sm whitespace-nowrap shrink-0">
                  {item.amount}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Paginación */}
      {initialActivity.length > PAGE_SIZE && (
        <div className="mt-5 pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm text-off-white/60">
          <p>
            Mostrando{' '}
            <span className="font-semibold text-off-white">
              {(paginaActual - 1) * PAGE_SIZE + 1}–
              {Math.min(paginaActual * PAGE_SIZE, initialActivity.length)}
            </span>{' '}
            de{' '}
            <span className="font-semibold text-off-white">{initialActivity.length}</span>{' '}
            actividades
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-off-white/70 hover:text-off-white"
              aria-label="Página anterior"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>

            {/* Números de página */}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || Math.abs(p - paginaActual) <= 1)
              .reduce<(number | '...')[]>((acc, p, idx, arr) => {
                if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push('...');
                acc.push(p);
                return acc;
              }, [])
              .map((p, idx) =>
                p === '...' ? (
                  <span key={`ellipsis-${idx}`} className="px-1 text-off-white/30">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={cn(
                      'min-w-[32px] h-8 rounded-lg border text-xs font-semibold transition-colors',
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
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={paginaActual === totalPages}
              className="p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-off-white/70 hover:text-off-white"
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
