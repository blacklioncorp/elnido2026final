'use client';

import { useState, useEffect, useMemo, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar as CalendarIcon,
  Flame,
  TrendingUp,
  Filter,
  Plus,
  X,
  ArrowRight,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  PartyPopper,
  Sun,
  ShieldAlert,
  Trash2,
  Loader2,
  Ticket
} from 'lucide-react';
import {
  getCalendarioData,
  guardarDiaEspecial,
  eliminarDiaEspecial,
  type CalendarioResponse,
  type DiaOcupacion,
  type DiaEspecial,
  type ReservaDia
} from './actions';
import { cn } from '@/lib/utils';

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

const DIAS_SEMANA = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const DIAS_SEMANA_COMPLETO = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

export default function CalendarioClient() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Fecha actual como punto de partida
  const hoy = useMemo(() => new Date(), []);
  const [selectedYear, setSelectedYear] = useState<number>(hoy.getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(hoy.getMonth() + 1); // 1-12
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todos');

  // Estado de datos del servidor
  const [data, setData] = useState<CalendarioResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal de Detalle del Día
  const [selectedDia, setSelectedDia] = useState<DiaOcupacion | null>(null);

  // Modal de Gestión de Días Especiales
  const [modalEspecialesOpen, setModalEspecialesOpen] = useState<boolean>(false);
  const [nuevoDiaFecha, setNuevoDiaFecha] = useState<string>('');
  const [nuevoDiaTipo, setNuevoDiaTipo] = useState<'feriado' | 'evento' | 'vacaciones' | 'cerrado'>('feriado');
  const [nuevoDiaDesc, setNuevoDiaDesc] = useState<string>('');
  const [guardandoEspecial, setGuardandoEspecial] = useState<boolean>(false);

  // Cargar datos
  const cargarDatos = async (year: number, month: number, cat: string) => {
    setLoading(true);
    const res = await getCalendarioData(year, month, cat);
    setData(res);
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos(selectedYear, selectedMonth, categoriaFiltro);
  }, [selectedYear, selectedMonth, categoriaFiltro]);

  // Manejo de navegación de meses
  const irMesAnterior = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(y => y - 1);
    } else {
      setSelectedMonth(m => m - 1);
    }
  };

  const irMesSiguiente = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(y => y + 1);
    } else {
      setSelectedMonth(m => m + 1);
    }
  };

  const irAHoy = () => {
    setSelectedYear(hoy.getFullYear());
    setSelectedMonth(hoy.getMonth() + 1);
  };

  // Construcción de la cuadrícula de días (Lunes = 0 a Domingo = 6)
  const calendarioGrid = useMemo(() => {
    // Primer día del mes
    const primerDia = new Date(selectedYear, selectedMonth - 1, 1);
    // Día de la semana en JS: 0=Domingo, 1=Lunes, ..., 6=Sábado
    let diaSemanaPrimerDia = primerDia.getDay(); // 0 a 6
    // Ajustar a Lunes=0, Domingo=6
    let offsetLunes = diaSemanaPrimerDia === 0 ? 6 : diaSemanaPrimerDia - 1;

    // Total de días del mes
    const totalDiasMes = new Date(selectedYear, selectedMonth, 0).getDate();

    // Días del mes anterior para relleno
    const totalDiasMesAnterior = new Date(selectedYear, selectedMonth - 1, 0).getDate();
    const paddingInicio: { dia: number; mesOffset: number }[] = [];
    for (let i = offsetLunes - 1; i >= 0; i--) {
      paddingInicio.push({
        dia: totalDiasMesAnterior - i,
        mesOffset: -1,
      });
    }

    // Días del mes actual
    const diasMesActual: { dia: number; mesOffset: number }[] = [];
    for (let i = 1; i <= totalDiasMes; i++) {
      diasMesActual.push({
        dia: i,
        mesOffset: 0,
      });
    }

    // Días de relleno al final para completar semanas de 7
    const totalCeldas = paddingInicio.length + diasMesActual.length;
    const paddingFinalCount = (7 - (totalCeldas % 7)) % 7;
    const paddingFinal: { dia: number; mesOffset: number }[] = [];
    for (let i = 1; i <= paddingFinalCount; i++) {
      paddingFinal.push({
        dia: i,
        mesOffset: 1,
      });
    }

    return [...paddingInicio, ...diasMesActual, ...paddingFinal];
  }, [selectedYear, selectedMonth]);

  // Color de fondo y borde según visitantes
  const getOcupacionStyles = (visitantes: number, esFeriado: boolean) => {
    if (visitantes === 0) {
      if (esFeriado) {
        return 'bg-emerald-950/20 border-emerald-500/20 text-off-white hover:border-emerald-500/40';
      }
      return 'bg-white/[0.02] border-white/5 text-off-white/80 hover:bg-white/[0.06] hover:border-white/15';
    }
    if (visitantes <= 20) {
      return 'bg-emerald-500/15 border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/25 hover:border-emerald-400/50';
    }
    if (visitantes <= 50) {
      return 'bg-amber-500/15 border-amber-500/30 text-amber-200 hover:bg-amber-500/25 hover:border-amber-400/50';
    }
    if (visitantes <= 100) {
      return 'bg-orange-500/15 border-orange-500/30 text-orange-200 hover:bg-orange-500/25 hover:border-orange-400/50';
    }
    return 'bg-rose-500/20 border-rose-500/40 text-rose-200 hover:bg-rose-500/30 hover:border-rose-400/60';
  };

  const getBadgeOcupacion = (visitantes: number) => {
    if (visitantes === 0) return null;
    if (visitantes <= 20) {
      return 'bg-emerald-500/30 text-emerald-300 border-emerald-500/40';
    }
    if (visitantes <= 50) {
      return 'bg-amber-500/30 text-amber-300 border-amber-500/40';
    }
    if (visitantes <= 100) {
      return 'bg-orange-500/30 text-orange-300 border-orange-500/40';
    }
    return 'bg-rose-500/30 text-rose-200 border-rose-500/40 font-bold';
  };

  // Guardar día especial
  const handleGuardarDiaEspecial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoDiaFecha) return;
    setGuardandoEspecial(true);
    const res = await guardarDiaEspecial(nuevoDiaFecha, nuevoDiaTipo, nuevoDiaDesc);
    if (!res.error) {
      setNuevoDiaFecha('');
      setNuevoDiaDesc('');
      await cargarDatos(selectedYear, selectedMonth, categoriaFiltro);
    }
    setGuardandoEspecial(false);
  };

  const handleEliminarDiaEspecial = async (id: string) => {
    if (!confirm('¿Deseas eliminar este día especial?')) return;
    await eliminarDiaEspecial(id);
    await cargarDatos(selectedYear, selectedMonth, categoriaFiltro);
  };

  // Formato de fecha para el modal
  const formatearFechaLarga = (fechaStr: string) => {
    try {
      const [y, m, d] = fechaStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('es-MX', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return fechaStr;
    }
  };

  const formatearFechaCorta = (fechaStr: string) => {
    try {
      const [y, m, d] = fechaStr.split('-').map(Number);
      const date = new Date(y, m - 1, d);
      return date.toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
      });
    } catch {
      return fechaStr;
    }
  };

  const hoyStr = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}-${String(hoy.getDate()).padStart(2, '0')}`;

  return (
    <div className="p-4 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Encabezado */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-conservation-gold/20 flex items-center justify-center text-conservation-gold border border-conservation-gold/30 shadow-lg shadow-yellow-500/5">
              <CalendarDays className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold text-off-white tracking-tight">
                Calendario de Visitas
              </h1>
              <p className="text-sm text-off-white/60">
                Monitoreo y planeación de visitantes programados, feriados oficiales y coordinación operativa.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setModalEspecialesOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-off-white hover:bg-white/10 hover:border-white/20 transition-all text-sm font-medium"
          >
            <Sparkles className="h-4 w-4 text-conservation-gold" />
            <span>Días Especiales</span>
          </button>
          <Link
            href="/admin/boletos"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-conservation-gold/20 border border-conservation-gold/30 text-conservation-gold hover:bg-conservation-gold/30 transition-all text-sm font-semibold"
          >
            <Ticket className="h-4 w-4" />
            <span>Administrar Boletos</span>
          </Link>
        </div>
      </div>

      {/* 2a. KPIs Superiores */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Visitantes este mes */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden transition-all hover:border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-off-white/60">
              Visitantes Este Mes
            </span>
            <div className="w-9 h-9 rounded-xl bg-quetzal-blue/20 text-quetzal-blue flex items-center justify-center border border-quetzal-blue/30">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-extrabold text-off-white">
              {loading ? '...' : (data?.kpis.visitantesMes ?? 0).toLocaleString('es-MX')}
            </span>
            <span className="text-sm font-medium text-quetzal-blue">personas</span>
          </div>
          <p className="mt-1 text-xs text-off-white/50">
            Total programado en {MESES[selectedMonth - 1]} {selectedYear}
          </p>
        </div>

        {/* KPI 2: Días con visitas */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden transition-all hover:border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-off-white/60">
              Días con Visitas
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CalendarIcon className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-extrabold text-off-white">
              {loading ? '...' : (data?.kpis.diasConVisitas ?? 0)}
            </span>
            <span className="text-sm font-medium text-emerald-400">días activos</span>
          </div>
          <p className="mt-1 text-xs text-off-white/50">
            Días con al menos 1 reserva confirmada
          </p>
        </div>

        {/* KPI 3: Día más ocupado */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden transition-all hover:border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-off-white/60">
              Día Más Ocupado
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 flex items-center justify-center border border-rose-500/30">
              <Flame className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl md:text-3xl font-extrabold text-off-white">
              {loading
                ? '...'
                : data?.kpis.diaMasOcupado
                ? `${data.kpis.diaMasOcupado.visitantes} 👥`
                : 'Sin visitas'}
            </span>
          </div>
          <p className="mt-1 text-xs text-rose-300 font-medium truncate">
            {data?.kpis.diaMasOcupado
              ? formatearFechaCorta(data.kpis.diaMasOcupado.fecha)
              : 'Ninguna fecha registrada'}
          </p>
        </div>

        {/* KPI 4: Promedio diario */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden transition-all hover:border-white/20">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-off-white/60">
              Promedio Diario
            </span>
            <div className="w-9 h-9 rounded-xl bg-conservation-gold/20 text-conservation-gold flex items-center justify-center border border-conservation-gold/30">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl md:text-4xl font-extrabold text-off-white">
              {loading ? '...' : (data?.kpis.promedioDiario ?? 0)}
            </span>
            <span className="text-sm font-medium text-conservation-gold">personas/día</span>
          </div>
          <p className="mt-1 text-xs text-off-white/50">
            Sobre los días con visitas activas
          </p>
        </div>
      </div>

      {/* 2b. Barra de Filtros y Navegación de Mes */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        {/* Navegación de mes */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
            <button
              onClick={irMesAnterior}
              title="Mes anterior"
              className="p-2 hover:bg-white/10 rounded-lg text-off-white transition-colors"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <div className="px-3 text-center min-w-[170px]">
              <span className="font-bold text-lg text-off-white">
                {MESES[selectedMonth - 1]} {selectedYear}
              </span>
            </div>
            <button
              onClick={irMesSiguiente}
              title="Mes siguiente"
              className="p-2 hover:bg-white/10 rounded-lg text-off-white transition-colors"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>

          <button
            onClick={irAHoy}
            className="px-3.5 py-2 rounded-xl text-xs font-bold uppercase tracking-wider bg-white/5 border border-white/10 hover:bg-white/10 text-off-white transition-all"
          >
            Hoy
          </button>
        </div>

        {/* Filtro de Tipo y Selector Rápido */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Selector de Mes directo */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
            className="bg-forest-green-dark border border-white/10 rounded-xl px-3 py-2 text-sm text-off-white focus:outline-none focus:border-conservation-gold"
          >
            {MESES.map((m, idx) => (
              <option key={m} value={idx + 1}>
                {m}
              </option>
            ))}
          </select>

          {/* Selector de Año */}
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
            className="bg-forest-green-dark border border-white/10 rounded-xl px-3 py-2 text-sm text-off-white focus:outline-none focus:border-conservation-gold"
          >
            {[2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {/* Filtro de Tipo */}
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5">
            <Filter className="h-4 w-4 text-off-white/50" />
            <select
              value={categoriaFiltro}
              onChange={(e) => setCategoriaFiltro(e.target.value)}
              className="bg-transparent text-sm text-off-white focus:outline-none cursor-pointer"
            >
              <option value="todos" className="bg-forest-green-dark text-white">Todos los tipos</option>
              <option value="entrada" className="bg-forest-green-dark text-white">Entradas Generales</option>
              <option value="paquete_familiar" className="bg-forest-green-dark text-white">Paquetes Familiares</option>
              <option value="evento" className="bg-forest-green-dark text-white">Eventos Temáticos</option>
              <option value="membresia" className="bg-forest-green-dark text-white">Membresías Guardián</option>
            </select>
          </div>
        </div>
      </div>

      {/* 2c. Calendario Mensual (Grid 7 Columnas: Lun a Dom) */}
      <div className="bg-white/5 border border-white/10 rounded-3xl p-4 md:p-6 shadow-2xl relative">
        {loading && (
          <div className="absolute inset-0 bg-forest-green-dark/70 backdrop-blur-xs z-10 flex items-center justify-center rounded-3xl">
            <div className="flex items-center gap-3 bg-white/10 border border-white/20 px-6 py-3 rounded-2xl text-off-white shadow-2xl">
              <Loader2 className="h-5 w-5 animate-spin text-conservation-gold" />
              <span className="font-semibold text-sm">Actualizando calendario...</span>
            </div>
          </div>
        )}

        {/* Encabezados de días de la semana */}
        <div className="grid grid-cols-7 gap-2 md:gap-3 mb-3 text-center">
          {DIAS_SEMANA.map((diaAbrev, idx) => (
            <div
              key={idx}
              className="py-2.5 font-bold text-xs md:text-sm text-off-white/70 uppercase tracking-widest bg-white/[0.03] rounded-xl border border-white/5"
            >
              <span className="hidden md:inline">{DIAS_SEMANA_COMPLETO[idx]}</span>
              <span className="md:hidden">{diaAbrev}</span>
            </div>
          ))}
        </div>

        {/* Celdas del Calendario */}
        <div className="grid grid-cols-7 gap-2 md:gap-3">
          {calendarioGrid.map((item, index) => {
            if (item.mesOffset !== 0) {
              // Días de relleno fuera del mes actual
              return (
                <div
                  key={`pad-${index}`}
                  className="min-h-[85px] md:min-h-[110px] p-2 md:p-3 rounded-2xl bg-black/20 border border-white/[0.02] text-off-white/20 select-none flex flex-col justify-between"
                >
                  <span className="text-xs font-semibold">{item.dia}</span>
                </div>
              );
            }

            const monthStr = String(selectedMonth).padStart(2, '0');
            const dayStr = String(item.dia).padStart(2, '0');
            const fechaKey = `${selectedYear}-${monthStr}-${dayStr}`;
            const diaData = data?.diasMap[fechaKey];
            const visitantes = diaData?.totalVisitantes ?? 0;
            const esFeriado = !!diaData?.diaEspecial;
            const esHoy = fechaKey === hoyStr;

            const ocupacionClass = getOcupacionStyles(visitantes, esFeriado);
            const badgeClass = getBadgeOcupacion(visitantes);

            return (
              <div
                key={fechaKey}
                onClick={() => diaData && setSelectedDia(diaData)}
                className={cn(
                  'min-h-[85px] md:min-h-[115px] p-2 md:p-3 rounded-2xl border transition-all duration-200 cursor-pointer flex flex-col justify-between relative group select-none shadow-md',
                  ocupacionClass,
                  esHoy && 'ring-2 ring-conservation-gold/80 ring-offset-2 ring-offset-forest-green-dark'
                )}
              >
                {/* Cabecera del día */}
                <div className="flex items-start justify-between gap-1">
                  <span
                    className={cn(
                      'text-xs md:text-sm font-extrabold flex items-center justify-center w-6 h-6 rounded-lg',
                      esHoy
                        ? 'bg-conservation-gold text-forest-green-dark font-black shadow-sm'
                        : 'text-off-white/90 group-hover:text-white'
                    )}
                  >
                    {item.dia}
                  </span>

                  {/* Icono de Feriado o Día Especial */}
                  {diaData?.diaEspecial && (
                    <span
                      title={`${diaData.diaEspecial.tipo === 'feriado' ? '🇲🇽 Feriado: ' : ''}${diaData.diaEspecial.descripcion || ''}`}
                      className="text-sm md:text-base inline-block transform hover:scale-125 transition-transform"
                    >
                      {diaData.diaEspecial.tipo === 'feriado' ? '🇲🇽' : '⭐'}
                    </span>
                  )}
                </div>

                {/* Centro: Badge con número de visitantes */}
                <div className="my-auto text-center">
                  {visitantes > 0 ? (
                    <div
                      className={cn(
                        'inline-flex items-center gap-1 px-2 py-0.5 md:py-1 rounded-lg text-xs md:text-sm font-extrabold border shadow-sm',
                        badgeClass
                      )}
                    >
                      <span>{visitantes}</span>
                      <span className="text-[10px] md:text-xs">👥</span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-off-white/20 hidden md:inline">0</span>
                  )}
                </div>

                {/* Pie de Celda: Indicador de Feriado / Reservas */}
                <div className="truncate">
                  {diaData?.diaEspecial ? (
                    <span className="text-[10px] md:text-[11px] font-semibold text-emerald-300/90 truncate block">
                      {diaData.diaEspecial.descripcion || 'Feriado'}
                    </span>
                  ) : diaData && diaData.totalReservas > 0 ? (
                    <span className="text-[10px] text-off-white/40 truncate hidden md:block">
                      {diaData.totalReservas} {diaData.totalReservas === 1 ? 'reserva' : 'reservas'}
                    </span>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>

        {/* Leyenda Inferior */}
        <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4 text-xs text-off-white/70">
          <div className="flex flex-wrap items-center gap-4">
            <span className="font-semibold text-off-white">Nivel de ocupación:</span>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-white/[0.05] border border-white/10 inline-block" />
              <span>0</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-emerald-500/30 border border-emerald-500/50 inline-block" />
              <span>1 - 20 👥</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-amber-500/30 border border-amber-500/50 inline-block" />
              <span>21 - 50 👥</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-orange-500/30 border border-orange-500/50 inline-block" />
              <span>51 - 100 👥</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-md bg-rose-500/40 border border-rose-500/60 inline-block" />
              <span>+100 👥</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>🇲🇽</span>
              <span>Día feriado oficial México</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-conservation-gold inline-block" />
              <span>Día de hoy</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2d. Modal de Detalle del Día */}
      {selectedDia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-forest-green-dark border border-white/15 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
            {/* Header del Modal */}
            <div className="p-6 border-b border-white/10 flex items-start justify-between gap-4 bg-white/[0.02]">
              <div>
                <span className="text-xs font-semibold text-conservation-gold uppercase tracking-wider">
                  Detalle del Día
                </span>
                <h3 className="text-2xl font-black text-off-white capitalize mt-0.5">
                  {formatearFechaLarga(selectedDia.fecha)}
                </h3>
                {selectedDia.diaEspecial && (
                  <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-bold">
                    <span>🇲🇽</span>
                    <span>{selectedDia.diaEspecial.descripcion || 'Día Feriado Oficial'}</span>
                  </div>
                )}
              </div>

              <button
                onClick={() => setSelectedDia(null)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-off-white/70 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Contenido del Modal */}
            <div className="p-6 overflow-y-auto space-y-6">
              {/* Resumen de Visitantes */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <span className="text-xs text-off-white/60 block">Total Visitantes</span>
                  <span className="text-2xl font-black text-conservation-gold mt-1 block">
                    {selectedDia.totalVisitantes} 👥
                  </span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <span className="text-xs text-off-white/60 block">Entradas Generales</span>
                  <span className="text-2xl font-bold text-off-white mt-1 block">
                    {selectedDia.desglose.entradas}
                  </span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <span className="text-xs text-off-white/60 block">Paquetes Fam.</span>
                  <span className="text-2xl font-bold text-off-white mt-1 block">
                    {selectedDia.desglose.paquetes}
                  </span>
                </div>
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                  <span className="text-xs text-off-white/60 block">Eventos / Otros</span>
                  <span className="text-2xl font-bold text-off-white mt-1 block">
                    {selectedDia.desglose.eventos + selectedDia.desglose.membresias + selectedDia.desglose.otros}
                  </span>
                </div>
              </div>

              {/* Lista de Reservas del Día */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-bold uppercase tracking-wider text-off-white/80 flex items-center gap-2">
                    <Ticket className="h-4 w-4 text-conservation-gold" />
                    <span>Últimas Reservas ({selectedDia.reservas.length})</span>
                  </h4>
                  {selectedDia.reservas.length > 10 && (
                    <span className="text-xs text-off-white/50">Mostrando 10 más recientes</span>
                  )}
                </div>

                {selectedDia.reservas.length === 0 ? (
                  <div className="p-8 text-center bg-white/[0.02] border border-white/5 rounded-2xl">
                    <AlertCircle className="h-8 w-8 text-off-white/30 mx-auto mb-2" />
                    <p className="text-off-white/60 text-sm">No hay reservas programadas para este día.</p>
                  </div>
                ) : (
                  <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
                    {selectedDia.reservas.slice(0, 10).map((reserva) => (
                      <div
                        key={reserva.id}
                        className="bg-white/5 border border-white/5 hover:border-white/15 p-3.5 rounded-xl flex items-center justify-between gap-3 transition-colors"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-off-white text-sm truncate">
                              {reserva.clienteNombre}
                            </span>
                            <span className="text-xs px-2 py-0.5 rounded-md bg-white/10 text-off-white/70 font-mono">
                              {reserva.cantidadPersonas} {reserva.cantidadPersonas === 1 ? 'persona' : 'personas'}
                            </span>
                          </div>
                          <div className="text-xs text-off-white/50 mt-0.5 flex items-center gap-3">
                            <span className="truncate">{reserva.tipoProducto}</span>
                            <span>·</span>
                            <span>{reserva.clienteEmail}</span>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-bold text-sm text-conservation-gold block">
                            ${reserva.total.toLocaleString('es-MX')} MXN
                          </span>
                          <span className="text-[11px] text-off-white/40 block">
                            {reserva.hora}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer del Modal */}
            <div className="p-5 border-t border-white/10 bg-white/[0.02] flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-off-white/50 text-center sm:text-left">
                {selectedDia.totalReservas} reservas registradas en el sistema.
              </span>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <Link
                  href={`/admin/boletos?tab=ventas&search=${selectedDia.fecha}`}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-conservation-gold text-forest-green-dark font-bold text-sm hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/10"
                >
                  <span>Ver todas las reservas</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Gestión de Días Especiales / Feriados */}
      {modalEspecialesOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-forest-green-dark border border-white/15 rounded-3xl w-full max-w-xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-6 border-b border-white/10 flex items-center justify-between bg-white/[0.02]">
              <div className="flex items-center gap-2.5">
                <Sparkles className="h-5 w-5 text-conservation-gold" />
                <h3 className="text-xl font-bold text-off-white">Días Especiales y Feriados</h3>
              </div>
              <button
                onClick={() => setModalEspecialesOpen(false)}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-off-white/70 hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              {/* Formulario para agregar */}
              <form onSubmit={handleGuardarDiaEspecial} className="bg-white/5 border border-white/10 p-4 rounded-2xl space-y-4">
                <h4 className="text-sm font-bold text-off-white flex items-center gap-2">
                  <Plus className="h-4 w-4 text-conservation-gold" />
                  <span>Agregar / Marcar Día Especial</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-off-white/70 block mb-1 font-medium">Fecha *</label>
                    <input
                      type="date"
                      required
                      value={nuevoDiaFecha}
                      onChange={(e) => setNuevoDiaFecha(e.target.value)}
                      className="w-full bg-forest-green-dark border border-white/10 rounded-xl px-3 py-2 text-sm text-off-white focus:outline-none focus:border-conservation-gold"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-off-white/70 block mb-1 font-medium">Tipo *</label>
                    <select
                      value={nuevoDiaTipo}
                      onChange={(e) => setNuevoDiaTipo(e.target.value as any)}
                      className="w-full bg-forest-green-dark border border-white/10 rounded-xl px-3 py-2 text-sm text-off-white focus:outline-none focus:border-conservation-gold"
                    >
                      <option value="feriado">🇲🇽 Feriado Oficial</option>
                      <option value="evento">⭐ Evento Especial</option>
                      <option value="vacaciones">🏖️ Vacaciones</option>
                      <option value="cerrado">🚫 Santuario Cerrado</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-off-white/70 block mb-1 font-medium">Descripción / Nombre *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: Día de la Independencia, Festival de Primavera..."
                    value={nuevoDiaDesc}
                    onChange={(e) => setNuevoDiaDesc(e.target.value)}
                    className="w-full bg-forest-green-dark border border-white/10 rounded-xl px-3 py-2 text-sm text-off-white focus:outline-none focus:border-conservation-gold"
                  />
                </div>

                <button
                  type="submit"
                  disabled={guardandoEspecial}
                  className="w-full py-2.5 rounded-xl bg-conservation-gold text-forest-green-dark font-bold text-sm hover:bg-yellow-400 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {guardandoEspecial ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Guardando...</span>
                    </>
                  ) : (
                    <span>Guardar Día Especial</span>
                  )}
                </button>
              </form>

              {/* Lista de Días Especiales Registrados */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-off-white/60 mb-3">
                  Días Especiales Registrados ({data?.diasEspeciales?.length || 0})
                </h4>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {data?.diasEspeciales?.map((esp) => (
                    <div
                      key={esp.id}
                      className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xl">
                          {esp.tipo === 'feriado' ? '🇲🇽' : esp.tipo === 'evento' ? '⭐' : esp.tipo === 'vacaciones' ? '🏖️' : '🚫'}
                        </span>
                        <div>
                          <span className="font-bold text-sm text-off-white block">{esp.descripcion}</span>
                          <span className="text-xs text-conservation-gold font-mono">{formatearFechaLarga(esp.fecha)}</span>
                        </div>
                      </div>

                      {esp.esCalculado ? (
                        <span className="px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-bold uppercase tracking-wider">
                          Automático
                        </span>
                      ) : (
                        <button
                          onClick={() => handleEliminarDiaEspecial(esp.id)}
                          className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                          title="Eliminar día personalizado"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
