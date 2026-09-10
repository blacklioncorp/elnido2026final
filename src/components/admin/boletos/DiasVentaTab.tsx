'use client';

import { useState, useEffect, useTransition } from 'react';
import { toast } from 'sonner';
import { 
  Calendar, 
  CalendarDays, 
  Sun, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  ToggleLeft,
  ToggleRight,
  Info
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/database.types';
import { getDiasVenta, toggleDiaVenta } from '@/app/(admin)/admin/boletos/actions';

type DiaVentaRow = Database['public']['Tables']['dias_venta']['Row'];

const DIAS_INFO: Record<number, { nombre: string; icono: typeof Calendar; emoji: string; badge: string }> = {
  1: { nombre: 'Lunes', icono: Calendar, emoji: '📅', badge: 'Día hábil' },
  2: { nombre: 'Martes', icono: Calendar, emoji: '📅', badge: 'Día hábil' },
  3: { nombre: 'Miércoles', icono: Calendar, emoji: '📅', badge: 'Día hábil' },
  4: { nombre: 'Jueves', icono: Calendar, emoji: '📅', badge: 'Día hábil' },
  5: { nombre: 'Viernes', icono: Calendar, emoji: '📅', badge: 'Día hábil' },
  6: { nombre: 'Sábado', icono: CalendarDays, emoji: '🎉', badge: 'Fin de semana' },
  0: { nombre: 'Domingo', icono: Sun, emoji: '🌞', badge: 'Fin de semana' },
};

// Orden natural de visualización: Lunes a Domingo
const ORDEN_VISUAL = [1, 2, 3, 4, 5, 6, 0];

export default function DiasVentaTab() {
  const [dias, setDias] = useState<DiaVentaRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingDia, setLoadingDia] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    let active = true;
    getDiasVenta().then(res => {
      if (!active) return;
      if (res.error) {
        toast.error(res.error);
      } else {
        setDias(res.data);
      }
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  const handleToggle = (diaSemana: number, estadoActual: boolean) => {
    const nuevoEstado = !estadoActual;
    setLoadingDia(diaSemana);

    startTransition(async () => {
      const res = await toggleDiaVenta(diaSemana, nuevoEstado);
      if (res.error) {
        toast.error(res.error);
      } else {
        setDias(prev =>
          prev.map(d => (d.dia_semana === diaSemana ? { ...d, habilitado: nuevoEstado } : d))
        );
        const info = DIAS_INFO[diaSemana];
        if (nuevoEstado) {
          toast.success(`Venta habilitada para los ${info?.nombre || 'días'}`);
        } else {
          toast.warning(`Venta deshabilitada para los ${info?.nombre || 'días'}`);
        }
      }
      setLoadingDia(null);
    });
  };

  // Mapa de días por dia_semana
  const diasMap = new Map<number, DiaVentaRow>();
  dias.forEach(d => diasMap.set(d.dia_semana, d));

  const diasHabilitadosCount = dias.filter(d => d.habilitado).length;

  return (
    <div className="space-y-6">
      {/* Encabezado de la pestaña */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-xl font-bold text-off-white flex items-center gap-2.5">
            <CalendarDays className="h-6 w-6 text-conservation-gold" />
            Días de Venta de Boletos
          </h2>
          <p className="text-sm text-off-white/60 mt-1">
            Activa o desactiva los días en que los visitantes pueden comprar boletos en la boletera pública.
          </p>
        </div>

        {/* Resumen de días activos */}
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-xs font-semibold self-start sm:self-auto">
          <Sparkles className="h-4 w-4 text-conservation-gold" />
          <span className="text-off-white/80">Días abiertos al público:</span>
          <span className="text-conservation-gold font-bold text-sm">
            {diasHabilitadosCount} de 7
          </span>
        </div>
      </div>

      {/* Banner Informativo */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-quetzal-blue/10 border border-quetzal-blue/20 text-xs text-off-white/80">
        <Info className="h-5 w-5 text-quetzal-blue shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold text-off-white">Reglas automáticas de la boletera</p>
          <p className="text-off-white/60 mt-0.5">
            Si desactivas un día, el DatePicker en <code className="bg-black/30 px-1 py-0.5 rounded text-conservation-gold font-mono">/boletos</code> impedirá que los clientes seleccionen fechas que caigan en ese día de la semana, mostrando un mensaje explicativo e informando los días disponibles.
          </p>
        </div>
      </div>

      {/* Grid de 7 días */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-off-white/60">
          <Loader2 className="h-8 w-8 animate-spin text-conservation-gold mb-3" />
          <p className="text-sm">Cargando configuración de días de venta...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {ORDEN_VISUAL.map(diaSemana => {
            const row = diasMap.get(diaSemana);
            const info = DIAS_INFO[diaSemana];
            const estaHabilitado = row ? row.habilitado : true;
            const estaCargandoEste = loadingDia === diaSemana && isPending;
            const IconComponent = info.icono;

            return (
              <div
                key={diaSemana}
                className={cn(
                  "relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200",
                  estaHabilitado
                    ? "bg-white/5 border-white/10 hover:border-conservation-gold/30 hover:bg-white/[0.07] shadow-sm"
                    : "bg-white/[0.02] border-white/5 opacity-75"
                )}
              >
                {/* Header de la tarjeta */}
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xl" role="img" aria-label={info.nombre}>
                        {info.emoji}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-white/10 text-off-white/70">
                        {info.badge}
                      </span>
                    </div>

                    <span
                      className={cn(
                        "inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full border",
                        estaHabilitado
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                          : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                      )}
                    >
                      {estaHabilitado ? (
                        <>
                          <CheckCircle2 className="h-3 w-3" /> Abierto
                        </>
                      ) : (
                        <>
                          <XCircle className="h-3 w-3" /> Cerrado
                        </>
                      )}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-off-white flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-conservation-gold" />
                    {info.nombre}
                  </h3>

                  <p className="text-xs text-off-white/50 mt-1">
                    {estaHabilitado
                      ? 'Los visitantes pueden agendar y comprar boletos este día.'
                      : 'El santuario no admite venta para este día.'}
                  </p>
                </div>

                {/* Control Toggle */}
                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                  <span className="text-xs font-medium text-off-white/80">
                    {estaHabilitado ? 'Venta habilitada' : 'Venta deshabilitada'}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleToggle(diaSemana, estaHabilitado)}
                    disabled={isPending}
                    className="p-1 text-off-white/80 hover:text-white transition-transform active:scale-95 disabled:opacity-50"
                    title={estaHabilitado ? `Desactivar ${info.nombre}` : `Activar ${info.nombre}`}
                    aria-label={`Cambiar estado de ${info.nombre}`}
                  >
                    {estaCargandoEste ? (
                      <Loader2 className="h-6 w-6 animate-spin text-conservation-gold" />
                    ) : estaHabilitado ? (
                      <ToggleRight className="h-8 w-8 text-conservation-gold" />
                    ) : (
                      <ToggleLeft className="h-8 w-8 text-gray-500" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
