'use client';

import { useState, useEffect, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  ToggleLeft, 
  ToggleRight, 
  Ticket, 
  Search, 
  Loader2, 
  AlertCircle, 
  X,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/database.types';
import { tipoEntradaSchema, type TipoEntradaInput } from '@/app/(admin)/admin/boletos/schemas';
import {
  getTiposEntrada,
  crearTipoEntrada,
  actualizarTipoEntrada,
  eliminarTipoEntrada,
  toggleActivoProducto
} from '@/app/(admin)/admin/boletos/actions';

type TipoProducto = Database['public']['Tables']['tipos_producto']['Row'];

export default function TiposEntradaTab() {
  const [items, setItems] = useState<TipoProducto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isPending, startTransition] = useTransition();

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TipoEntradaInput>({
    resolver: zodResolver(tipoEntradaSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      precio: 0,
      categoria: 'entrada',
      activo: true,
    },
  });

  const activoValue = watch('activo');

  const cargarDatos = async () => {
    setLoading(true);
    const res = await getTiposEntrada();
    if (res.error) {
      toast.error(res.error);
    } else {
      setItems(res.data);
    }
    setLoading(false);
  };

  useEffect(() => {
    cargarDatos();
  }, []);

  const abrirCrear = () => {
    setEditingId(null);
    reset({
      nombre: '',
      descripcion: '',
      precio: 0,
      categoria: 'entrada',
      activo: true,
    });
    setModalOpen(true);
  };

  const abrirEditar = (item: TipoProducto) => {
    setEditingId(item.id);
    reset({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      precio: item.precio,
      categoria: (item.categoria as 'entrada' | 'paquete_familiar') || 'entrada',
      activo: item.activo,
    });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const onSubmit = async (values: TipoEntradaInput) => {
    if (editingId) {
      const res = await actualizarTipoEntrada(editingId, values);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Tipo de entrada actualizado exitosamente');
        cerrarModal();
        cargarDatos();
      }
    } else {
      const res = await crearTipoEntrada(values);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Tipo de entrada creado exitosamente');
        cerrarModal();
        cargarDatos();
      }
    }
  };

  const handleToggle = (item: TipoProducto) => {
    startTransition(async () => {
      const nuevoEstado = !item.activo;
      const res = await toggleActivoProducto(item.id, nuevoEstado);
      if (res.error) {
        toast.error(res.error);
      } else {
        setItems(prev => prev.map(p => p.id === item.id ? { ...p, activo: nuevoEstado } : p));
        toast.success(nuevoEstado ? 'Entrada activada' : 'Entrada desactivada');
      }
    });
  };

  const confirmarEliminacion = async () => {
    if (!deleteConfirmId) return;
    startTransition(async () => {
      const res = await eliminarTipoEntrada(deleteConfirmId);
      if (res.error) {
        toast.error(res.error);
      } else if (res.desactivado) {
        toast.info('Tiene compras registradas: se ha desactivado en vez de borrar para proteger el historial.');
        cargarDatos();
      } else {
        toast.success('Tipo de entrada eliminado');
        setItems(prev => prev.filter(p => p.id !== deleteConfirmId));
      }
      setDeleteConfirmId(null);
    });
  };

  const itemsFiltrados = items.filter(i => 
    i.nombre.toLowerCase().includes(search.toLowerCase()) ||
    (i.descripcion && i.descripcion.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Controles de Barra Superior */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-off-white/40" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Buscar tipo de entrada o paquete..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-off-white placeholder-off-white/40 text-sm focus:outline-none focus:border-conservation-gold/50 transition-colors"
          />
        </div>

        <button
          onClick={abrirCrear}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-conservation-gold text-forest-green-dark font-semibold text-sm hover:bg-yellow-400 transition-all shadow-lg hover:shadow-yellow-500/20 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Nuevo Tipo de Entrada
        </button>
      </div>

      {/* Lista / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-off-white/60">
          <Loader2 className="h-8 w-8 animate-spin text-conservation-gold mb-3" />
          <p className="text-sm">Cargando catálogo de entradas...</p>
        </div>
      ) : itemsFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-white/10 bg-white/[0.02] text-center">
          <Ticket className="h-12 w-12 text-off-white/20 mb-3" />
          <h3 className="text-lg font-medium text-off-white">No hay tipos de entrada</h3>
          <p className="text-sm text-off-white/50 mt-1 max-w-sm">
            {search ? 'No se encontraron resultados con ese criterio de búsqueda.' : 'Crea el primer tipo de boleto o paquete para habilitar las ventas.'}
          </p>
          {!search && (
            <button
              onClick={abrirCrear}
              className="mt-4 px-4 py-2 rounded-xl bg-conservation-gold/20 text-conservation-gold text-sm font-semibold border border-conservation-gold/30 hover:bg-conservation-gold/30 transition-all"
            >
              Crear Entrada Ahora
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {itemsFiltrados.map((item) => (
            <div
              key={item.id}
              className={cn(
                "group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200",
                item.activo 
                  ? "bg-white/5 border-white/10 hover:border-conservation-gold/30 hover:bg-white/[0.07]" 
                  : "bg-white/[0.02] border-white/5 opacity-70"
              )}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <span className={cn(
                    "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider",
                    item.categoria === 'paquete_familiar'
                      ? "bg-purple-500/20 text-purple-300 border-purple-500/30"
                      : "bg-quetzal-blue/20 text-quetzal-blue border-quetzal-blue/30"
                  )}>
                    {item.categoria === 'paquete_familiar' ? 'Paquete Familiar' : 'Entrada General'}
                  </span>
                  
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleToggle(item)}
                      disabled={isPending}
                      className="text-off-white/60 hover:text-white transition-colors p-1"
                      title={item.activo ? 'Desactivar entrada' : 'Activar entrada'}
                    >
                      {item.activo ? (
                        <ToggleRight className="h-6 w-6 text-emerald-400" />
                      ) : (
                        <ToggleLeft className="h-6 w-6 text-off-white/40" />
                      )}
                    </button>
                    <button
                      onClick={() => abrirEditar(item)}
                      className="p-1.5 rounded-lg text-off-white/60 hover:text-quetzal-blue hover:bg-white/10 transition-all"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(item.id)}
                      className="p-1.5 rounded-lg text-off-white/60 hover:text-red-400 hover:bg-white/10 transition-all"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-lg font-bold text-off-white group-hover:text-conservation-gold transition-colors">
                  {item.nombre}
                </h3>
                
                <p className="text-sm text-off-white/60 mt-1 line-clamp-2">
                  {item.descripcion || 'Sin descripción detallada.'}
                </p>
              </div>

              <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                <div>
                  <span className="text-xs text-off-white/40 block">Precio por boleto</span>
                  <span className="text-2xl font-black text-conservation-gold tracking-tight">
                    ${Number(item.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    <span className="text-xs text-off-white/50 ml-1 font-normal">MXN</span>
                  </span>
                </div>

                <span className={cn(
                  "text-xs px-2.5 py-1 rounded-md font-medium",
                  item.activo ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                )}>
                  {item.activo ? 'Público Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Crear / Editar con React Hook Form + Zod */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg rounded-2xl bg-forest-green-dark border border-white/15 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-conservation-gold/10 text-conservation-gold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-off-white">
                    {editingId ? 'Editar Tipo de Entrada' : 'Nuevo Tipo de Entrada'}
                  </h2>
                  <p className="text-xs text-off-white/60">
                    Configura el nombre, precio y categoría disponible en boletería
                  </p>
                </div>
              </div>
              <button
                onClick={cerrarModal}
                className="p-1.5 rounded-lg text-off-white/50 hover:text-off-white hover:bg-white/10 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Nombre */}
              <div>
                <label className="block text-xs font-semibold text-off-white/80 uppercase tracking-wider mb-1.5">
                  Nombre del Producto / Boleto *
                </label>
                <input
                  type="text"
                  {...register('nombre')}
                  placeholder="Ej. Entrada General Adulto, Paquete 4 Personas..."
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl bg-white/5 border text-off-white text-sm focus:outline-none transition-colors",
                    errors.nombre ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-conservation-gold/50"
                  )}
                />
                {errors.nombre && (
                  <p className="text-xs text-red-400 mt-1">{errors.nombre.message}</p>
                )}
              </div>

              {/* Categoría y Precio */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-off-white/80 uppercase tracking-wider mb-1.5">
                    Categoría *
                  </label>
                  <select
                    {...register('categoria')}
                    className="w-full px-4 py-2.5 rounded-xl bg-[#09251B] border border-white/10 text-off-white text-sm focus:outline-none focus:border-conservation-gold/50"
                  >
                    <option value="entrada">Entrada Regular</option>
                    <option value="paquete_familiar">Paquete Familiar</option>
                  </select>
                  {errors.categoria && (
                    <p className="text-xs text-red-400 mt-1">{errors.categoria.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-off-white/80 uppercase tracking-wider mb-1.5">
                    Precio (MXN) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-off-white/40 font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('precio', { valueAsNumber: true })}
                      placeholder="0.00"
                      className={cn(
                        "w-full pl-8 pr-4 py-2.5 rounded-xl bg-white/5 border text-off-white text-sm font-semibold focus:outline-none transition-colors",
                        errors.precio ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-conservation-gold/50"
                      )}
                    />
                  </div>
                  {errors.precio && (
                    <p className="text-xs text-red-400 mt-1">{errors.precio.message}</p>
                  )}
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-off-white/80 uppercase tracking-wider mb-1.5">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={3}
                  {...register('descripcion')}
                  placeholder="Incluye acceso al aviario principal, guía educativo y recorrido botánico..."
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-off-white text-sm focus:outline-none focus:border-conservation-gold/50 transition-colors resize-none"
                />
              </div>

              {/* Toggle Activo */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <div>
                  <p className="text-sm font-semibold text-off-white">Activar para venta</p>
                  <p className="text-xs text-off-white/50">Si está activo, los visitantes podrán comprarlo en la boletería online.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setValue('activo', !activoValue)}
                  className="p-1 text-off-white/80 hover:text-white transition-colors"
                >
                  {activoValue ? (
                    <ToggleRight className="h-7 w-7 text-emerald-400" />
                  ) : (
                    <ToggleLeft className="h-7 w-7 text-off-white/40" />
                  )}
                </button>
              </div>

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
                <button
                  type="button"
                  onClick={cerrarModal}
                  className="px-4 py-2.5 rounded-xl bg-white/5 text-off-white/70 hover:text-off-white hover:bg-white/10 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-conservation-gold text-forest-green-dark font-bold text-sm hover:bg-yellow-400 transition-all shadow-lg disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editingId ? 'Guardar Cambios' : 'Crear Entrada'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmación de Eliminación */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-forest-green-dark border border-red-500/30 p-6 shadow-2xl space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-red-500/10 text-red-400 shrink-0">
                <AlertCircle className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-off-white">¿Confirmas la eliminación?</h3>
                <p className="text-sm text-off-white/60 mt-1">
                  Si este tipo de entrada ya tiene compras registradas en el sistema, el sistema lo <strong>desactivará automáticamente</strong> para salvaguardar los registros contables y comprobantes de los clientes.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-white/10">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                disabled={isPending}
                className="px-4 py-2 rounded-xl bg-white/5 text-off-white/70 hover:text-white text-sm font-medium transition-colors"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmarEliminacion}
                disabled={isPending}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Proceder
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
