'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import {
  Tag,
  Plus,
  Search,
  Loader2,
  Trash2,
  Copy,
  Check,
  Download,
  Percent,
  Layers,
  CheckCircle2,
  Clock,
  Ban,
  Calendar,
  Sparkles,
  X,
  Filter,
  RefreshCw,
  Eye,
  SlidersHorizontal
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/database.types';
import { loteDescuentoSchema, type LoteDescuentoInput } from '@/app/(admin)/admin/boletos/schemas';
import {
  getCodigosDescuento,
  getLotesResumen,
  generarLoteCodigos,
  toggleActivoCodigo,
  toggleActivoLote,
  eliminarCodigo,
  eliminarLoteNoUsados
} from '@/app/(admin)/admin/boletos/actions';

type CodigoDescuentoRow = Database['public']['Tables']['codigos_descuento']['Row'];

const CATEGORIAS_DISPONIBLES = [
  { id: 'todas', label: 'Todas las categorías' },
  { id: 'entrada', label: 'Entradas individuales' },
  { id: 'paquete_familiar', label: 'Paquetes familiares' },
  { id: 'membresia', label: 'Membresías Guardián' },
  { id: 'evento', label: 'Eventos temáticos' },
];

export default function DescuentosTab() {
  const [codigos, setCodigos] = useState<CodigoDescuentoRow[]>([]);
  const [lotes, setLotes] = useState<Array<{
    lote: string;
    porcentaje_descuento: number;
    categorias_aplicables: string[];
    total: number;
    usados: number;
    disponibles: number;
    activos: number;
    max_items_por_compra: number | null;
    max_descuento_monto: number | null;
    fecha_inicio: string | null;
    fecha_fin: string | null;
    created_at: string;
  }>>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  // Vista activa
  const [vista, setVista] = useState<'codigos' | 'lotes'>('codigos');

  // Filtros
  const [filtroLote, setFiltroLote] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState<'todos' | 'disponibles' | 'usados'>('todos');
  const [busqueda, setBusqueda] = useState('');

  // Modal Generar Lote
  const [modalOpen, setModalOpen] = useState(false);
  const [codigoCopiado, setCodigoCopiado] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteLoteConfirm, setDeleteLoteConfirm] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<LoteDescuentoInput>({
    resolver: zodResolver(loteDescuentoSchema),
    defaultValues: {
      lote: '',
      porcentaje_descuento: 15,
      categorias_aplicables: ['todas'],
      cantidad: 20,
      prefijo: 'NIDO',
      longitud_aleatoria: 6,
      max_items_por_compra: 4,
      max_descuento_monto: null,
      fecha_inicio: '',
      fecha_fin: '',
      activo: true,
    },
  });

  const watchCategorias = watch('categorias_aplicables') || ['todas'];
  const watchPrefijo = watch('prefijo') || '';
  const watchLongitud = watch('longitud_aleatoria') || 6;
  const watchPorcentaje = watch('porcentaje_descuento') || 15;
  const watchCantidad = watch('cantidad') || 20;

  const cargarDatos = async () => {
    setLoading(true);
    const [resCodigos, resLotes] = await Promise.all([
      getCodigosDescuento({
        lote: filtroLote !== 'todos' ? filtroLote : undefined,
        estado: filtroEstado,
        busqueda: busqueda || undefined,
      }),
      getLotesResumen(),
    ]);

    if (resCodigos.error) toast.error(resCodigos.error);
    else setCodigos(resCodigos.data);

    if (resLotes.error) toast.error(resLotes.error);
    else setLotes(resLotes.data);

    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, [filtroLote, filtroEstado]);

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    cargarDatos();
  };

  const onSubmitGenerar = async (data: LoteDescuentoInput) => {
    startTransition(async () => {
      const res = await generarLoteCodigos(data);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success(`¡Se generaron con éxito ${res.cantidad} códigos para el lote "${data.lote}"!`);
        setModalOpen(false);
        reset();
        cargarDatos();
      }
    });
  };

  const handleToggleActivo = async (id: string, activoActual: boolean) => {
    const res = await toggleActivoCodigo(id, !activoActual);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(activoActual ? 'Código desactivado' : 'Código activado');
      setCodigos((prev) =>
        prev.map((c) => (c.id === id ? { ...c, activo: !activoActual } : c))
      );
    }
  };

  const handleToggleActivoLote = async (loteNombre: string, nuevoEstado: boolean) => {
    const res = await toggleActivoLote(loteNombre, nuevoEstado);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(nuevoEstado ? `Lote "${loteNombre}" activado` : `Lote "${loteNombre}" desactivado`);
      cargarDatos();
    }
  };

  const handleEliminarCodigo = async (id: string) => {
    const res = await eliminarCodigo(id);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success('Código eliminado');
      setDeleteConfirmId(null);
      cargarDatos();
    }
  };

  const handleEliminarLoteNoUsados = async (loteNombre: string) => {
    const res = await eliminarLoteNoUsados(loteNombre);
    if (res.error) {
      toast.error(res.error);
    } else {
      toast.success(`Se eliminaron ${res.eliminados} códigos no canjeados del lote "${loteNombre}"`);
      setDeleteLoteConfirm(null);
      cargarDatos();
    }
  };

  const copiarAlPortapapeles = (texto: string) => {
    navigator.clipboard.writeText(texto);
    setCodigoCopiado(texto);
    toast.success(`Código "${texto}" copiado al portapapeles`);
    setTimeout(() => setCodigoCopiado(null), 2500);
  };

  const exportarCSV = () => {
    if (codigos.length === 0) {
      toast.error('No hay códigos para exportar');
      return;
    }

    const encabezados = ['Código', 'Lote', 'Descuento (%)', 'Categorías', 'Máx Items', 'Tope Descuento ($)', 'Estado', 'Canjeado Por', 'Fecha de Canje', 'Válido Desde', 'Válido Hasta', 'Fecha Creación'];
    const filas = codigos.map((c) => [
      c.codigo,
      `"${c.lote}"`,
      c.porcentaje_descuento,
      `"${(c.categorias_aplicables || []).join(', ')}"`,
      c.max_items_por_compra ?? 4,
      c.max_descuento_monto ? `$${c.max_descuento_monto}` : 'Sin tope',
      c.usado ? 'Usado' : c.activo ? 'Disponible' : 'Inactivo',
      c.usado_por ? `"${c.usado_por}"` : 'N/A',
      c.usado_en ? new Date(c.usado_en).toLocaleString('es-MX') : 'N/A',
      c.fecha_inicio ? new Date(c.fecha_inicio).toLocaleDateString('es-MX') : 'Inmediato',
      c.fecha_fin ? new Date(c.fecha_fin).toLocaleDateString('es-MX') : 'Sin expiración',
      new Date(c.created_at).toLocaleString('es-MX'),
    ]);

    const contenidoCSV = [encabezados.join(','), ...filas.map((f) => f.join(','))].join('\n');
    const blob = new Blob([contenidoCSV], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `codigos_descuento_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Descarga de CSV iniciada');
  };

  const copiarListaCodigos = () => {
    if (codigos.length === 0) {
      toast.error('No hay códigos disponibles para copiar');
      return;
    }
    const lista = codigos.map((c) => c.codigo).join('\n');
    navigator.clipboard.writeText(lista);
    toast.success(`${codigos.length} códigos copiados al portapapeles`);
  };

  // KPIs
  const totalCodigos = codigos.length;
  const totalUsados = codigos.filter((c) => c.usado).length;
  const totalDisponibles = codigos.filter((c) => !c.usado && c.activo).length;
  const tasaCanje = totalCodigos > 0 ? Math.round((totalUsados / totalCodigos) * 100) : 0;

  // Toggle categoría en formulario
  const toggleCategoriaForm = (catId: string) => {
    if (catId === 'todas') {
      setValue('categorias_aplicables', ['todas']);
      return;
    }
    let actual = watchCategorias.filter((c) => c !== 'todas');
    if (actual.includes(catId)) {
      actual = actual.filter((c) => c !== catId);
    } else {
      actual.push(catId);
    }
    if (actual.length === 0) actual = ['todas'];
    setValue('categorias_aplicables', actual);
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-forest-green-dark/40 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between text-off-white/60 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Códigos</span>
            <Tag className="h-4 w-4 text-conservation-gold" />
          </div>
          <div className="text-2xl font-bold text-off-white">{totalCodigos}</div>
          <p className="text-xs text-off-white/40 mt-1">{lotes.length} lotes creados</p>
        </div>

        <div className="p-4 rounded-2xl bg-forest-green-dark/40 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between text-off-white/60 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Disponibles</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{totalDisponibles}</div>
          <p className="text-xs text-off-white/40 mt-1">Listos para canjear</p>
        </div>

        <div className="p-4 rounded-2xl bg-forest-green-dark/40 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between text-off-white/60 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Canjeados</span>
            <Clock className="h-4 w-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400">{totalUsados}</div>
          <p className="text-xs text-off-white/40 mt-1">Un solo uso agotado</p>
        </div>

        <div className="p-4 rounded-2xl bg-forest-green-dark/40 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between text-off-white/60 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Tasa de Canje</span>
            <Percent className="h-4 w-4 text-quetzal-blue" />
          </div>
          <div className="text-2xl font-bold text-quetzal-blue">{tasaCanje}%</div>
          <p className="text-xs text-off-white/40 mt-1">Efectividad global</p>
        </div>
      </div>

      {/* Action & Filter Bar */}
      <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center justify-between bg-forest-green-dark/30 p-4 rounded-2xl border border-white/10">
        <div className="flex flex-wrap items-center gap-2">
          {/* Selector de Vista */}
          <div className="flex bg-black/20 p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setVista('codigos')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                vista === 'codigos'
                  ? 'bg-conservation-gold text-forest-green-dark shadow-sm'
                  : 'text-off-white/60 hover:text-white'
              )}
            >
              Listado de Códigos
            </button>
            <button
              onClick={() => setVista('lotes')}
              className={cn(
                'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all',
                vista === 'lotes'
                  ? 'bg-conservation-gold text-forest-green-dark shadow-sm'
                  : 'text-off-white/60 hover:text-white'
              )}
            >
              Resumen por Lotes
            </button>
          </div>

          {/* Filtro Lote */}
          <select
            value={filtroLote}
            onChange={(e) => setFiltroLote(e.target.value)}
            aria-label="Filtrar por lote"
            className="bg-black/30 border border-white/10 text-off-white text-xs rounded-xl px-3 py-2 outline-none focus:border-conservation-gold"
          >
            <option value="todos">Todos los lotes</option>
            {lotes.map((l) => (
              <option key={l.lote} value={l.lote}>
                {l.lote} ({l.total} códigos)
              </option>
            ))}
          </select>

          {/* Filtro Estado */}
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value as any)}
            aria-label="Filtrar por estado"
            className="bg-black/30 border border-white/10 text-off-white text-xs rounded-xl px-3 py-2 outline-none focus:border-conservation-gold"
          >
            <option value="todos">Todos los estados</option>
            <option value="disponibles">Solo disponibles</option>
            <option value="usados">Solo canjeados</option>
          </select>
        </div>

        {/* Buscador y Botón Crear */}
        <div className="flex flex-wrap items-center gap-2">
          <form onSubmit={handleBuscar} className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-off-white/40" />
            <input
              type="text"
              placeholder="Buscar código..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-black/30 border border-white/10 text-off-white text-xs rounded-xl pl-8 pr-3 py-2 outline-none focus:border-conservation-gold"
            />
          </form>

          <button
            onClick={exportarCSV}
            title="Exportar a CSV"
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-off-white transition-colors"
          >
            <Download className="h-4 w-4" />
          </button>

          <button
            onClick={copiarListaCodigos}
            title="Copiar todos los códigos"
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-off-white transition-colors"
          >
            <Copy className="h-4 w-4" />
          </button>

          <button
            onClick={cargarDatos}
            title="Recargar"
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-off-white transition-colors"
          >
            <RefreshCw className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>

          <button
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 bg-conservation-gold text-forest-green-dark px-4 py-2 rounded-xl text-xs font-bold hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/10"
          >
            <Plus className="h-4 w-4" />
            Generar Lote
          </button>
        </div>
      </div>

      {/* Contenido Principal: Listado de Códigos */}
      {vista === 'codigos' && (
        <div className="bg-forest-green-dark/20 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-sm">
          {loading ? (
            <div className="p-12 text-center text-off-white/60 flex flex-col items-center justify-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-conservation-gold" />
              <span>Cargando códigos de descuento...</span>
            </div>
          ) : codigos.length === 0 ? (
            <div className="p-12 text-center text-off-white/60 flex flex-col items-center justify-center gap-3">
              <Tag className="h-10 w-10 text-off-white/20" />
              <p className="text-base font-semibold">No se encontraron códigos de descuento</p>
              <p className="text-xs text-off-white/40 max-w-md">
                Genera tu primer lote de cupones de un solo uso haciendo clic en &quot;Generar Lote&quot;.
              </p>
              <button
                onClick={() => setModalOpen(true)}
                className="mt-2 flex items-center gap-2 bg-conservation-gold text-forest-green-dark px-4 py-2 rounded-xl text-xs font-bold"
              >
                <Plus className="h-4 w-4" />
                Generar Primer Lote
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-off-white">
                <thead className="bg-black/30 text-off-white/60 font-semibold border-b border-white/10">
                  <tr>
                    <th className="py-3 px-4">Código</th>
                    <th className="py-3 px-4">Lote</th>
                    <th className="py-3 px-4">Descuento</th>
                    <th className="py-3 px-4">Límites</th>
                    <th className="py-3 px-4">Categorías</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4">Canje / Detalle</th>
                    <th className="py-3 px-4">Vigencia</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {codigos.map((c) => {
                    const esUsado = c.usado;
                    const categoriasText = (c.categorias_aplicables || []).includes('todas')
                      ? 'Todas'
                      : (c.categorias_aplicables || []).join(', ');

                    return (
                      <tr
                        key={c.id}
                        className={cn(
                          'hover:bg-white/5 transition-colors',
                          esUsado && 'opacity-60 bg-black/10'
                        )}
                      >
                        {/* Código */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-conservation-gold text-sm bg-black/30 px-2 py-1 rounded-lg border border-white/5">
                              {c.codigo}
                            </span>
                            <button
                              onClick={() => copiarAlPortapapeles(c.codigo)}
                              title="Copiar código"
                              className="text-off-white/40 hover:text-white transition-colors"
                            >
                              {codigoCopiado === c.codigo ? (
                                <Check className="h-3.5 w-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Lote */}
                        <td className="py-3 px-4">
                          <span className="text-off-white font-medium">{c.lote}</span>
                        </td>

                        {/* Descuento */}
                        <td className="py-3 px-4">
                          <span className="inline-flex items-center gap-1 font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            {c.porcentaje_descuento}% OFF
                          </span>
                        </td>

                        {/* Límites */}
                        <td className="py-3 px-4">
                          <div className="text-[11px] space-y-0.5">
                            <div className="text-off-white/80">
                              Máx. <span className="font-semibold text-conservation-gold">{c.max_items_por_compra ?? 4}</span> items
                            </div>
                            {c.max_descuento_monto ? (
                              <div className="text-emerald-400/90 font-medium text-[10px]">
                                Tope: ${c.max_descuento_monto}
                              </div>
                            ) : (
                              <div className="text-off-white/40 text-[10px]">Sin tope $</div>
                            )}
                          </div>
                        </td>

                        {/* Categorías */}
                        <td className="py-3 px-4">
                          <span className="text-off-white/70 max-w-[140px] truncate block" title={categoriasText}>
                            {categoriasText}
                          </span>
                        </td>

                        {/* Estado */}
                        <td className="py-3 px-4">
                          {esUsado ? (
                            <span className="inline-flex items-center gap-1 text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20 font-medium">
                              <CheckCircle2 className="h-3 w-3" /> Canjeado
                            </span>
                          ) : c.activo ? (
                            <span className="inline-flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 font-medium">
                              <Sparkles className="h-3 w-3" /> Disponible
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20 font-medium">
                              <Ban className="h-3 w-3" /> Inactivo
                            </span>
                          )}
                        </td>

                        {/* Detalle Canje */}
                        <td className="py-3 px-4">
                          {esUsado ? (
                            <div className="space-y-0.5">
                              <div className="text-off-white font-medium truncate max-w-[150px]" title={c.usado_por || ''}>
                                {c.usado_por || 'Usuario anónimo'}
                              </div>
                              <div className="text-[10px] text-off-white/40">
                                {c.usado_en ? new Date(c.usado_en).toLocaleString('es-MX') : ''}
                              </div>
                            </div>
                          ) : (
                            <span className="text-off-white/30 italic">Sin usar</span>
                          )}
                        </td>

                        {/* Vigencia */}
                        <td className="py-3 px-4">
                          <div className="text-[11px] text-off-white/60">
                            {c.fecha_fin ? (
                              <span>Hasta {new Date(c.fecha_fin).toLocaleDateString('es-MX')}</span>
                            ) : (
                              <span>Sin expiración</span>
                            )}
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            {!esUsado && (
                              <button
                                onClick={() => handleToggleActivo(c.id, c.activo)}
                                title={c.activo ? 'Desactivar' : 'Activar'}
                                className={cn(
                                  'p-1.5 rounded-lg text-xs font-semibold transition-colors',
                                  c.activo
                                    ? 'text-amber-400 hover:bg-amber-400/10'
                                    : 'text-emerald-400 hover:bg-emerald-400/10'
                                )}
                              >
                                {c.activo ? 'Pausar' : 'Activar'}
                              </button>
                            )}

                            {!esUsado && (
                              <button
                                onClick={() => setDeleteConfirmId(c.id)}
                                title="Eliminar código"
                                className="p-1.5 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Contenido Secundario: Resumen por Lotes */}
      {vista === 'lotes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lotes.map((lote) => {
            const porcentajeUso = lote.total > 0 ? Math.round((lote.usados / lote.total) * 100) : 0;

            return (
              <div
                key={lote.lote}
                className="bg-forest-green-dark/30 border border-white/10 rounded-2xl p-5 space-y-4 backdrop-blur-sm relative overflow-hidden"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-bold text-off-white">{lote.lote}</h3>
                    <p className="text-xs text-off-white/50">
                      Creado el {new Date(lote.created_at).toLocaleDateString('es-MX')}
                    </p>
                  </div>
                  <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 text-xs">
                    {lote.porcentaje_descuento}% OFF
                  </span>
                </div>

                {/* Progress Bar de Uso */}
                <div className="space-y-1.5">
                  <div className="flex justify-between text-xs text-off-white/70">
                    <span>Progreso de canje</span>
                    <span className="font-bold text-off-white">
                      {lote.usados} de {lote.total} ({porcentajeUso}%)
                    </span>
                  </div>
                  <div className="h-2 w-full bg-black/40 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-conservation-gold rounded-full transition-all duration-500"
                      style={{ width: `${porcentajeUso}%` }}
                    />
                  </div>
                </div>

                {/* Badges de Categorías */}
                <div className="flex flex-wrap gap-1">
                  {lote.categorias_aplicables.map((cat) => (
                    <span
                      key={cat}
                      className="text-[10px] bg-white/5 text-off-white/70 px-2 py-0.5 rounded-md border border-white/10"
                    >
                      {cat === 'todas' ? 'Todas las categorías' : cat}
                    </span>
                  ))}
                </div>

                {/* Acciones de Lote */}
                <div className="pt-2 border-t border-white/10 flex items-center justify-between text-xs">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setFiltroLote(lote.lote);
                        setVista('codigos');
                      }}
                      className="text-conservation-gold hover:underline flex items-center gap-1 font-semibold"
                    >
                      <Eye className="h-3.5 w-3.5" /> Ver Códigos
                    </button>
                  </div>

                  <div className="flex gap-2 items-center">
                    <button
                      onClick={() => handleToggleActivoLote(lote.lote, lote.activos === 0)}
                      className={cn(
                        'px-2 py-1 rounded-lg text-xs font-semibold transition-colors',
                        lote.activos > 0
                          ? 'text-amber-400 hover:bg-amber-400/10'
                          : 'text-emerald-400 hover:bg-emerald-400/10'
                      )}
                    >
                      {lote.activos > 0 ? 'Pausar Lote' : 'Activar Lote'}
                    </button>

                    {lote.disponibles > 0 && (
                      <button
                        onClick={() => setDeleteLoteConfirm(lote.lote)}
                        title="Eliminar códigos no canjeados"
                        className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL GENERADOR DE LOTE */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-fade-in">
          <div className="relative w-full max-w-xl bg-[#0e1e17] border border-white/15 rounded-3xl p-6 md:p-8 shadow-2xl text-off-white space-y-6 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-conservation-gold/10 border border-conservation-gold/30">
                  <Tag className="h-6 w-6 text-conservation-gold" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Generar Lote de Códigos</h2>
                  <p className="text-xs text-off-white/60">
                    Crea múltiples códigos únicos de un solo uso vinculados a categorías.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl text-off-white/60 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmitGenerar)} className="space-y-5">
              {/* Nombre del Lote */}
              <div>
                <label className="block text-xs font-semibold text-off-white/80 mb-1.5">
                  Nombre / Identificador del Lote <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="ej. Campaña Primavera 2026, Convenio Escuela X..."
                  {...register('lote')}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-off-white/30 focus:border-conservation-gold outline-none"
                />
                {errors.lote && <p className="text-xs text-rose-400 mt-1">{errors.lote.message}</p>}
              </div>

              {/* Parámetros en Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Porcentaje de Descuento */}
                <div>
                  <label className="block text-xs font-semibold text-off-white/80 mb-1.5">
                    Porcentaje de Descuento (%): <span className="text-conservation-gold font-bold">{watchPorcentaje}%</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    {...register('porcentaje_descuento', { valueAsNumber: true })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-off-white/30 focus:border-conservation-gold outline-none"
                  />
                  {errors.porcentaje_descuento && (
                    <p className="text-xs text-rose-400 mt-1">{errors.porcentaje_descuento.message}</p>
                  )}
                </div>

                {/* Cantidad de Códigos */}
                <div>
                  <label className="block text-xs font-semibold text-off-white/80 mb-1.5">
                    Cantidad de Códigos a Generar
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    {...register('cantidad', { valueAsNumber: true })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-off-white/30 focus:border-conservation-gold outline-none"
                  />
                  {errors.cantidad && (
                    <p className="text-xs text-rose-400 mt-1">{errors.cantidad.message}</p>
                  )}
                </div>
              </div>

              {/* Prefijo y Longitud */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-off-white/80 mb-1.5">
                    Prefijo Opcional (ej: NIDO, PROMO)
                  </label>
                  <input
                    type="text"
                    placeholder="ej. NIDO"
                    {...register('prefijo')}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white uppercase placeholder:text-off-white/30 focus:border-conservation-gold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-off-white/80 mb-1.5">
                    Longitud de caracteres aleatorios (4 a 12)
                  </label>
                  <input
                    type="number"
                    min="4"
                    max="12"
                    {...register('longitud_aleatoria', { valueAsNumber: true })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:border-conservation-gold outline-none"
                  />
                </div>
              </div>

              {/* Límites de Aplicación (Items y Monto) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-off-white/80 mb-1.5">
                    Máx. items con descuento por compra
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    placeholder="4"
                    {...register('max_items_por_compra', {
                      setValueAs: (v) => (v === '' || Number.isNaN(Number(v)) ? 4 : Number(v)),
                    })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-off-white/30 focus:border-conservation-gold outline-none"
                  />
                  {errors.max_items_por_compra && (
                    <p className="text-xs text-rose-400 mt-1">{errors.max_items_por_compra.message}</p>
                  )}
                  <p className="text-[10px] text-off-white/40 mt-1">Por defecto: 4 items</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-off-white/80 mb-1.5">
                    Máx. descuento total ($ MXN, opcional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Sin tope (ej. 500)"
                    {...register('max_descuento_monto', {
                      setValueAs: (v) => (v === '' || Number.isNaN(Number(v)) ? null : Number(v)),
                    })}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-off-white/30 focus:border-conservation-gold outline-none"
                  />
                  {errors.max_descuento_monto && (
                    <p className="text-xs text-rose-400 mt-1">{errors.max_descuento_monto.message}</p>
                  )}
                  <p className="text-[10px] text-off-white/40 mt-1">Tope máximo en dinero que se puede descontar</p>
                </div>
              </div>

              {/* Preview Formato */}
              <div className="p-3.5 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-off-white/60">Ejemplo de código resultante:</span>
                  <div className="font-mono text-sm font-bold text-conservation-gold mt-0.5">
                    {watchPrefijo.trim() ? `${watchPrefijo.trim().toUpperCase()}-` : ''}
                    {'X'.repeat(Number(watchLongitud) || 6)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-emerald-400 font-bold bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    {watchCantidad} códigos de {watchPorcentaje}% OFF
                  </span>
                </div>
              </div>

              {/* Categorías Aplicables */}
              <div>
                <label className="block text-xs font-semibold text-off-white/80 mb-2">
                  Categorías en las que aplica el descuento <span className="text-rose-400">*</span>
                </label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIAS_DISPONIBLES.map((cat) => {
                    const isSelected =
                      cat.id === 'todas'
                        ? watchCategorias.includes('todas')
                        : watchCategorias.includes(cat.id);

                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleCategoriaForm(cat.id)}
                        className={cn(
                          'px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border',
                          isSelected
                            ? 'bg-conservation-gold text-forest-green-dark border-conservation-gold shadow-sm'
                            : 'bg-white/5 text-off-white/70 border-white/10 hover:bg-white/10'
                        )}
                      >
                        {cat.label}
                      </button>
                    );
                  })}
                </div>
                {errors.categorias_aplicables && (
                  <p className="text-xs text-rose-400 mt-1">{errors.categorias_aplicables.message}</p>
                )}
              </div>

              {/* Vigencia Opcional */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-white/10">
                <div>
                  <label className="block text-xs font-semibold text-off-white/80 mb-1.5">
                    Fecha de Inicio (Opcional)
                  </label>
                  <input
                    type="date"
                    {...register('fecha_inicio')}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-conservation-gold outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-off-white/80 mb-1.5">
                    Fecha de Fin / Expiración (Opcional)
                  </label>
                  <input
                    type="date"
                    {...register('fecha_fin')}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm text-white focus:border-conservation-gold outline-none"
                  />
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold text-off-white/70 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isPending}
                  className="flex items-center gap-2 bg-conservation-gold text-forest-green-dark px-6 py-2.5 rounded-xl text-xs font-bold hover:bg-yellow-400 transition-colors shadow-lg shadow-yellow-500/10 disabled:opacity-50"
                >
                  {isSubmitting || isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generando códigos...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" />
                      Generar {watchCantidad} Códigos
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINAR CÓDIGO INDIVIDUAL */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-sm bg-[#0e1e17] border border-white/15 rounded-3xl p-6 shadow-2xl text-off-white space-y-4">
            <h3 className="text-base font-bold text-white">¿Eliminar este código?</h3>
            <p className="text-xs text-off-white/60">
              Esta acción eliminará de forma permanente el código seleccionado. Solo se pueden eliminar códigos no canjeados.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold text-off-white/70 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminarCodigo(deleteConfirmId)}
                className="px-4 py-2 text-xs font-bold bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
              >
                Eliminar Código
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR ELIMINAR LOTE NO USADOS */}
      {deleteLoteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
          <div className="w-full max-w-md bg-[#0e1e17] border border-white/15 rounded-3xl p-6 shadow-2xl text-off-white space-y-4">
            <h3 className="text-base font-bold text-white">¿Eliminar códigos no canjeados del lote?</h3>
            <p className="text-xs text-off-white/60">
              Se eliminarán todos los códigos pendientes del lote &quot;{deleteLoteConfirm}&quot;. Los códigos que ya hayan sido canjeados se conservarán para el historial de ventas.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeleteLoteConfirm(null)}
                className="px-4 py-2 text-xs font-semibold text-off-white/70 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleEliminarLoteNoUsados(deleteLoteConfirm)}
                className="px-4 py-2 text-xs font-bold bg-rose-500 text-white rounded-xl hover:bg-rose-600 transition-colors"
              >
                Eliminar Códigos Pendientes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
