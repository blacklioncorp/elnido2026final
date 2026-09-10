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
  CalendarDays, 
  Clock, 
  Users, 
  Search, 
  Loader2, 
  AlertCircle, 
  X,
  Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/database.types';
import { eventoSchema, type EventoInput } from '@/app/(admin)/admin/boletos/schemas';
import {
  getEventos,
  crearEvento,
  actualizarEvento,
  eliminarEvento,
  toggleActivoProducto
} from '@/app/(admin)/admin/boletos/actions';

type TipoProducto = Database['public']['Tables']['tipos_producto']['Row'];

interface EventoMetadata {
  fecha?: string;
  hora?: string;
  cupo?: number;
}

export default function EventosTab() {
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
  } = useForm<EventoInput>({
    resolver: zodResolver(eventoSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      precio: 0,
      fecha: '',
      hora: '',
      cupo_maximo: 50,
      activo: true,
    },
  });

  const activoValue = watch('activo');

  const cargarDatos = async () => {
    setLoading(true);
    const res = await getEventos();
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
      fecha: new Date().toISOString().split('T')[0],
      hora: '10:00',
      cupo_maximo: 50,
      activo: true,
    });
    setModalOpen(true);
  };

  const abrirEditar = (item: TipoProducto) => {
    setEditingId(item.id);
    const meta = (item.metadata as EventoMetadata) || {};
    reset({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      precio: item.precio,
      fecha: meta.fecha || '',
      hora: meta.hora || '',
      cupo_maximo: meta.cupo ? Number(meta.cupo) : 50,
      activo: item.activo,
    });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const onSubmit = async (values: EventoInput) => {
    if (editingId) {
      const res = await actualizarEvento(editingId, values);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Evento actualizado exitosamente');
        cerrarModal();
        cargarDatos();
      }
    } else {
      const res = await crearEvento(values);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Evento creado exitosamente');
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
        toast.success(nuevoEstado ? 'Evento activado' : 'Evento desactivado');
      }
    });
  };

  const confirmarEliminacion = async () => {
    if (!deleteConfirmId) return;
    startTransition(async () => {
      const res = await eliminarEvento(deleteConfirmId);
      if (res.error) {
        toast.error(res.error);
      } else if (res.desactivado) {
        toast.info('Tiene compras registradas: se ha desactivado en vez de borrar.');
        cargarDatos();
      } else {
        toast.success('Evento eliminado correctamente');
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
            placeholder="Buscar eventos especiales..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-off-white placeholder-off-white/40 text-sm focus:outline-none focus:border-conservation-gold/50 transition-colors"
          />
        </div>

        <button
          onClick={abrirCrear}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-conservation-gold text-forest-green-dark font-semibold text-sm hover:bg-yellow-400 transition-all shadow-lg hover:shadow-yellow-500/20 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Nuevo Evento Especial
        </button>
      </div>

      {/* Lista / Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-off-white/60">
          <Loader2 className="h-8 w-8 animate-spin text-conservation-gold mb-3" />
          <p className="text-sm">Cargando eventos programados...</p>
        </div>
      ) : itemsFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-white/10 bg-white/[0.02] text-center">
          <CalendarDays className="h-12 w-12 text-off-white/20 mb-3" />
          <h3 className="text-lg font-medium text-off-white">No hay eventos especiales</h3>
          <p className="text-sm text-off-white/50 mt-1 max-w-sm">
            {search ? 'No se encontraron resultados con ese criterio.' : 'Crea recorridos nocturnos, talleres de conservación o eventos temáticos.'}
          </p>
          {!search && (
            <button
              onClick={abrirCrear}
              className="mt-4 px-4 py-2 rounded-xl bg-conservation-gold/20 text-conservation-gold text-sm font-semibold border border-conservation-gold/30 hover:bg-conservation-gold/30 transition-all"
            >
              Crear Evento Ahora
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {itemsFiltrados.map((item) => {
            const meta = (item.metadata as EventoMetadata) || {};
            return (
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
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border uppercase tracking-wider bg-conservation-gold/20 text-conservation-gold border-conservation-gold/30">
                      Evento Especial
                    </span>
                    
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleToggle(item)}
                        disabled={isPending}
                        className="text-off-white/60 hover:text-white transition-colors p-1"
                        title={item.activo ? 'Desactivar evento' : 'Activar evento'}
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

                  {/* Metadata de Fecha, Hora y Cupo */}
                  <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-off-white/75">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <CalendarDays className="h-3.5 w-3.5 text-conservation-gold shrink-0" />
                      <span className="truncate">{meta.fecha || 'Por definir'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Clock className="h-3.5 w-3.5 text-quetzal-blue shrink-0" />
                      <span className="truncate">{meta.hora || '10:00'}</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <Users className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                      <span className="truncate">{meta.cupo ? `${meta.cupo} pers.` : 'Sin límite'}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-off-white/40 block">Precio de admisión</span>
                    <span className="text-2xl font-black text-conservation-gold tracking-tight">
                      ${Number(item.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      <span className="text-xs text-off-white/50 ml-1 font-normal">MXN</span>
                    </span>
                  </div>

                  <span className={cn(
                    "text-xs px-2.5 py-1 rounded-md font-medium",
                    item.activo ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  )}>
                    {item.activo ? 'Venta Abierta' : 'Inactivo'}
                  </span>
                </div>
              </div>
            );
          })}
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
                    {editingId ? 'Editar Evento Especial' : 'Nuevo Evento Especial'}
                  </h2>
                  <p className="text-xs text-off-white/60">
                    Define la fecha, horario, aforo máximo y precio de entrada
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
                  Nombre del Evento *
                </label>
                <input
                  type="text"
                  {...register('nombre')}
                  placeholder="Ej. Noche de Búhos y Rapaces, Taller Ornitológico..."
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl bg-white/5 border text-off-white text-sm focus:outline-none transition-colors",
                    errors.nombre ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-conservation-gold/50"
                  )}
                />
                {errors.nombre && (
                  <p className="text-xs text-red-400 mt-1">{errors.nombre.message}</p>
                )}
              </div>

              {/* Fecha, Hora y Cupo */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-off-white/80 uppercase tracking-wider mb-1.5">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    {...register('fecha')}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-xl bg-white/5 border text-off-white text-sm focus:outline-none transition-colors",
                      errors.fecha ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-conservation-gold/50"
                    )}
                  />
                  {errors.fecha && (
                    <p className="text-xs text-red-400 mt-1">{errors.fecha.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-off-white/80 uppercase tracking-wider mb-1.5">
                    Hora *
                  </label>
                  <input
                    type="time"
                    {...register('hora')}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-xl bg-white/5 border text-off-white text-sm focus:outline-none transition-colors",
                      errors.hora ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-conservation-gold/50"
                    )}
                  />
                  {errors.hora && (
                    <p className="text-xs text-red-400 mt-1">{errors.hora.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-off-white/80 uppercase tracking-wider mb-1.5">
                    Cupo Máx *
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...register('cupo_maximo', { valueAsNumber: true })}
                    className={cn(
                      "w-full px-3 py-2.5 rounded-xl bg-white/5 border text-off-white text-sm focus:outline-none transition-colors",
                      errors.cupo_maximo ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-conservation-gold/50"
                    )}
                  />
                  {errors.cupo_maximo && (
                    <p className="text-xs text-red-400 mt-1">{errors.cupo_maximo.message}</p>
                  )}
                </div>
              </div>

              {/* Precio */}
              <div>
                <label className="block text-xs font-semibold text-off-white/80 uppercase tracking-wider mb-1.5">
                  Precio por Entrada (MXN) *
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

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-off-white/80 uppercase tracking-wider mb-1.5">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={3}
                  {...register('descripcion')}
                  placeholder="Detalles sobre las dinámicas, qué llevar y recomendaciones para los asistentes..."
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-off-white text-sm focus:outline-none focus:border-conservation-gold/50 transition-colors resize-none"
                />
              </div>

              {/* Toggle Activo */}
              <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                <div>
                  <p className="text-sm font-semibold text-off-white">Publicar evento</p>
                  <p className="text-xs text-off-white/50">Permite que el evento sea visible para reservas online.</p>
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
                  {editingId ? 'Guardar Cambios' : 'Crear Evento'}
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
                <h3 className="text-lg font-bold text-off-white">¿Eliminar este evento?</h3>
                <p className="text-sm text-off-white/60 mt-1">
                  Si este evento ya tiene boletos vendidos, el sistema lo <strong>desactivará automáticamente</strong> para proteger los comprobantes de los visitantes.
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
