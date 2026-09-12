'use client';

import { useState, useEffect } from 'react';
import { 
  Search, 
  RefreshCw, 
  ShoppingCart, 
  DollarSign, 
  Ticket, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Eye, 
  User, 
  Calendar,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { getVentasBoletos } from '@/app/(admin)/admin/boletos/actions';

const PAGE_SIZE = 15;

interface CompraItem {
  id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  categoria?: string;
}

interface Cliente {
  nombre: string | null;
  email: string | null;
}

interface CompraConDetalles {
  id: string;
  cliente_id: string | null;
  total: number;
  estado: string;
  created_at: string;
  fecha_visita: string | null;
  cantidad_personas: number;
  stripe_session_id: string | null;
  metadata?: Record<string, any> | null;
  compra_items?: CompraItem[];
  clientes?: Cliente | null;
}

export default function VentasTab({ initialSearch = '' }: { initialSearch?: string }) {
  const [ventas, setVentas] = useState<CompraConDetalles[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [selectedVenta, setSelectedVenta] = useState<CompraConDetalles | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const cargarVentas = async () => {
    setLoading(true);
    const res = await getVentasBoletos();
    if (res.data) {
      setVentas(res.data as unknown as CompraConDetalles[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarVentas();
  }, []);

  useEffect(() => {
    if (initialSearch) {
      setSearch(initialSearch);
    }
  }, [initialSearch]);

  // Filtrado — al cambiar filtros, volver a página 1
  const ventasFiltradas = ventas.filter((v) => {
    const matchesSearch = 
      (v.clientes?.nombre && v.clientes.nombre.toLowerCase().includes(search.toLowerCase())) ||
      (v.clientes?.email && v.clientes.email.toLowerCase().includes(search.toLowerCase())) ||
      (v.fecha_visita && v.fecha_visita.includes(search)) ||
      v.id.toLowerCase().includes(search.toLowerCase()) ||
      (v.compra_items && v.compra_items.some(i => i.nombre.toLowerCase().includes(search.toLowerCase())));

    const matchesStatus = statusFilter === 'todos' || v.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Paginación
  const totalPages = Math.max(1, Math.ceil(ventasFiltradas.length / PAGE_SIZE));
  const paginaActual = Math.min(currentPage, totalPages);
  const ventasPagina = ventasFiltradas.slice((paginaActual - 1) * PAGE_SIZE, paginaActual * PAGE_SIZE);

  const handleSearchChange = (v: string) => { setSearch(v); setCurrentPage(1); };
  const handleStatusChange = (v: string) => { setStatusFilter(v); setCurrentPage(1); };

  // Métricas
  const totalRecaudado = ventas.reduce((acc, v) => acc + (v.estado === 'completado' || v.estado === 'activado' ? Number(v.total) : 0), 0);
  const ordenesCompletadas = ventas.filter(v => v.estado === 'completado' || v.estado === 'activado').length;
  const boletosTotales = ventas.reduce((acc, v) => {
    if (v.compra_items && v.compra_items.length > 0) {
      return acc + v.compra_items.reduce((sub, item) => sub + item.cantidad, 0);
    }
    return acc + (v.cantidad_personas || 1);
  }, 0);

  const getBadgeEstado = (estado: string) => {
    switch (estado) {
      case 'completado':
      case 'activado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="h-3 w-3" /> Completado
          </span>
        );
      case 'pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <Clock className="h-3 w-3" /> Pendiente
          </span>
        );
      case 'cancelado':
      case 'expirado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
            <XCircle className="h-3 w-3" /> {estado}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-off-white border border-white/20 capitalize">
            {estado}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Tarjetas de Métricas (KPIs) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-conservation-gold/10 text-conservation-gold">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-off-white/50 uppercase tracking-wider font-semibold">Total Recaudado</p>
            <p className="text-2xl font-black text-conservation-gold mt-0.5">
              ${totalRecaudado.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-quetzal-blue/10 text-quetzal-blue">
            <ShoppingCart className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-off-white/50 uppercase tracking-wider font-semibold">Órdenes Totales</p>
            <p className="text-2xl font-black text-off-white mt-0.5">{ventas.length}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-off-white/50 uppercase tracking-wider font-semibold">Ventas Exitosas</p>
            <p className="text-2xl font-black text-emerald-400 mt-0.5">{ordenesCompletadas}</p>
          </div>
        </div>

        <div className="p-5 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
            <Ticket className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-off-white/50 uppercase tracking-wider font-semibold">Boletos Emitidos</p>
            <p className="text-2xl font-black text-purple-400 mt-0.5">{boletosTotales}</p>
          </div>
        </div>
      </div>

      {/* Controles de Búsqueda y Filtros */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-1 max-w-2xl">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-off-white/40" />
            <input
              type="text"
              value={search}
              onChange={e => handleSearchChange(e.target.value)}
              placeholder="Buscar por cliente, correo o ID de orden..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white/5 border border-white/10 text-off-white placeholder-off-white/40 text-sm focus:outline-none focus:border-conservation-gold/50 transition-colors"
            />
          </div>

          <select
            value={statusFilter}
            onChange={e => handleStatusChange(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#09251B] border border-white/10 text-off-white text-sm focus:outline-none focus:border-conservation-gold/50"
          >
            <option value="todos">Todos los Estados</option>
            <option value="completado">Completados / Pagados</option>
            <option value="pendiente">Pendientes</option>
            <option value="cancelado">Cancelados</option>
          </select>
        </div>

        <button
          onClick={cargarVentas}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-off-white text-sm font-medium hover:bg-white/10 transition-colors shrink-0 disabled:opacity-50"
        >
          <RefreshCw className={cn("h-4 w-4", loading && "animate-spin text-conservation-gold")} />
          Actualizar Lista
        </button>
      </div>

      {/* Tabla de Ventas */}
      <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-off-white">
            <thead className="bg-white/5 text-xs uppercase tracking-wider text-off-white/60 border-b border-white/10">
              <tr>
                <th className="px-5 py-3.5">Folio / Fecha</th>
                <th className="px-5 py-3.5">Cliente</th>
                <th className="px-5 py-3.5">Desglose Boletos</th>
                <th className="px-5 py-3.5">Visita Programada</th>
                <th className="px-5 py-3.5">Total</th>
                <th className="px-5 py-3.5">Estado</th>
                <th className="px-5 py-3.5 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-off-white/50">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-conservation-gold mb-2" />
                    Cargando transacciones recientes...
                  </td>
                </tr>
              ) : ventasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center text-off-white/40">
                    <ShoppingCart className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    No se encontraron órdenes que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                ventasPagina.map((v) => (
                  <tr key={v.id} className="hover:bg-white/[0.04] transition-colors">
                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="font-mono text-xs font-semibold text-off-white/80 block">
                        #{v.id.slice(0, 8)}
                      </span>
                      <span className="text-xs text-off-white/40">
                        {new Date(v.created_at).toLocaleDateString('es-MX', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-white/5 text-off-white/60">
                          <User className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-semibold text-off-white leading-tight">
                            {v.clientes?.nombre || 'Visitante General'}
                          </p>
                          <p className="text-xs text-off-white/50">{v.clientes?.email || 'Sin correo'}</p>
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      {v.compra_items && v.compra_items.length > 0 ? (
                        <div className="space-y-1">
                          {v.compra_items.slice(0, 2).map((item) => (
                            <span 
                              key={item.id} 
                              className="inline-block mr-2 px-2 py-0.5 rounded-md bg-white/5 text-xs text-off-white/80 font-medium"
                            >
                              {item.cantidad}x {item.nombre}
                            </span>
                          ))}
                          {v.compra_items.length > 2 && (
                            <span className="text-xs text-off-white/40">
                              +{v.compra_items.length - 2} más
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-xs text-off-white/60">
                          {v.cantidad_personas} boleto(s)
                        </span>
                      )}
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5 text-xs text-off-white/80">
                        <Calendar className="h-3.5 w-3.5 text-conservation-gold" />
                        {v.fecha_visita ? (
                          <span>{v.fecha_visita}</span>
                        ) : (
                          <span className="text-off-white/40 italic">Abierta</span>
                        )}
                      </div>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      <span className="text-base font-bold text-conservation-gold">
                        ${Number(v.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </td>

                    <td className="px-5 py-4 whitespace-nowrap">
                      {getBadgeEstado(v.estado)}
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedVenta(v)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-quetzal-blue/20 text-off-white/70 hover:text-quetzal-blue text-xs font-semibold transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" /> Ver Detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación */}
      {!loading && ventasFiltradas.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-1 text-sm text-off-white/60">
          <p>
            Mostrando{' '}
            <span className="font-semibold text-off-white">
              {(paginaActual - 1) * PAGE_SIZE + 1}–
              {Math.min(paginaActual * PAGE_SIZE, ventasFiltradas.length)}
            </span>{' '}
            de{' '}
            <span className="font-semibold text-off-white">{ventasFiltradas.length}</span>{' '}
            órdenes
          </p>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={paginaActual === 1}
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
                  <span key={`ellipsis-${idx}`} className="px-2 text-off-white/30">…</span>
                ) : (
                  <button
                    key={p}
                    onClick={() => setCurrentPage(p as number)}
                    className={cn(
                      'min-w-[36px] h-9 rounded-lg border text-xs font-semibold transition-colors',
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
              className="p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Página siguiente"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}


      {selectedVenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-forest-green-dark border border-white/15 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div>
                <h3 className="text-lg font-bold text-off-white">
                  Orden #{selectedVenta.id.slice(0, 13)}
                </h3>
                <p className="text-xs text-off-white/50">
                  Emitida el {new Date(selectedVenta.created_at).toLocaleString('es-MX')}
                </p>
              </div>
              <button
                onClick={() => setSelectedVenta(null)}
                className="p-1.5 rounded-lg text-off-white/50 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Info Cliente */}
            <div className="p-4 rounded-xl bg-white/[0.03] border border-white/5 space-y-2">
              <p className="text-xs uppercase tracking-wider font-semibold text-conservation-gold">
                Datos del Comprador
              </p>
              <div className="text-sm text-off-white space-y-0.5">
                <p><span className="text-off-white/50">Nombre:</span> {selectedVenta.clientes?.nombre || 'Visitante General'}</p>
                <p><span className="text-off-white/50">Correo:</span> {selectedVenta.clientes?.email || 'No proporcionado'}</p>
                {selectedVenta.fecha_visita && (
                  <p><span className="text-off-white/50">Fecha de visita:</span> {selectedVenta.fecha_visita}</p>
                )}
              </div>
            </div>

            {/* Desglose de Items */}
            <div>
              <p className="text-xs uppercase tracking-wider font-semibold text-off-white/60 mb-2">
                Conceptos Adquiridos
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {selectedVenta.compra_items && selectedVenta.compra_items.length > 0 ? (
                  selectedVenta.compra_items.map((item) => (
                    <div 
                      key={item.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-sm"
                    >
                      <div>
                        <span className="font-semibold text-off-white">{item.nombre}</span>
                        <span className="text-xs text-off-white/50 block">Cantidad: {item.cantidad}</span>
                      </div>
                      <span className="font-bold text-conservation-gold">
                        ${(Number(item.precio_unitario) * item.cantidad).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/5 text-sm">
                    <span className="text-off-white">Admisión General ({selectedVenta.cantidad_personas} personas)</span>
                    <span className="font-bold text-conservation-gold">
                      ${Number(selectedVenta.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Descuento si existe */}
            {selectedVenta.metadata?.codigo_descuento && (
              <div className="flex items-center justify-between p-3 rounded-xl bg-conservation-gold/10 border border-conservation-gold/20 text-xs">
                <span className="text-conservation-gold font-medium">
                  Cupón aplicado: <span className="font-bold">{selectedVenta.metadata.codigo_descuento}</span>
                </span>
                <span className="font-bold text-conservation-gold">
                  {selectedVenta.metadata.porcentaje_descuento ? `−${selectedVenta.metadata.porcentaje_descuento}% OFF` : 'Descuento aplicado'}
                </span>
              </div>
            )}

            {/* Total y Estado */}
            <div className="pt-3 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-xs text-off-white/50 block">Estado de la transacción</span>
                {getBadgeEstado(selectedVenta.estado)}
              </div>

              <div className="text-right">
                <span className="text-xs text-off-white/50 block">Monto Total</span>
                <span className="text-2xl font-black text-conservation-gold">
                  ${Number(selectedVenta.total).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
