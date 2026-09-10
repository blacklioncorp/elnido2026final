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
  Search, 
  Loader2, 
  AlertCircle, 
  X,
  Sparkles,
  Shield,
  Star,
  Ticket,
  Wallet,
  Percent,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Database } from '@/lib/database.types';
import { membresiaSchema, type MembresiaInput } from '@/app/(admin)/admin/boletos/schemas';
import {
  getMembresias,
  crearMembresia,
  actualizarMembresia,
  eliminarMembresia,
  toggleActivoProducto,
  togglePopularMembresia
} from '@/app/(admin)/admin/boletos/actions';

type TipoProducto = Database['public']['Tables']['tipos_producto']['Row'];

interface MembresiaMetadata {
  accesos?: number;
  saldo?: number;
  descuento?: number;
  descuento_eventos?: number;
  validez_dias?: number;
}

export default function MembresiasTab() {
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
  } = useForm<MembresiaInput>({
    resolver: zodResolver(membresiaSchema),
    defaultValues: {
      nombre: '',
      descripcion: '',
      precio: 0,
      activo: true,
      es_popular: false,
      accesos: 1,
      saldo: 200,
      descuento: 15,
      validez_dias: 365,
    },
  });

  const activoValue = watch('activo');
  const esPopularValue = watch('es_popular');

  const cargarDatos = async () => {
    setLoading(true);
    const res = await getMembresias();
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
      activo: true,
      es_popular: false,
      accesos: 1,
      saldo: 200,
      descuento: 15,
      validez_dias: 365,
    });
    setModalOpen(true);
  };

  const abrirEditar = (item: TipoProducto) => {
    setEditingId(item.id);
    const meta = (item.metadata || {}) as MembresiaMetadata;
    reset({
      nombre: item.nombre,
      descripcion: item.descripcion || '',
      precio: Number(item.precio),
      activo: item.activo,
      es_popular: item.es_popular ?? false,
      accesos: meta.accesos ?? 1,
      saldo: meta.saldo ?? 0,
      descuento: meta.descuento ?? meta.descuento_eventos ?? 15,
      validez_dias: meta.validez_dias ?? 365,
    });
    setModalOpen(true);
  };

  const cerrarModal = () => {
    setModalOpen(false);
    setEditingId(null);
  };

  const onSubmit = async (values: MembresiaInput) => {
    if (editingId) {
      const res = await actualizarMembresia(editingId, values);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Membresía actualizada exitosamente');
        cerrarModal();
        cargarDatos();
      }
    } else {
      const res = await crearMembresia(values);
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Membresía creada exitosamente');
        cerrarModal();
        cargarDatos();
      }
    }
  };

  const handleToggleActivo = (item: TipoProducto) => {
    startTransition(async () => {
      const nuevoEstado = !item.activo;
      const res = await toggleActivoProducto(item.id, nuevoEstado);
      if (res.error) {
        toast.error(res.error);
      } else {
        setItems(prev => prev.map(p => p.id === item.id ? { ...p, activo: nuevoEstado } : p));
        toast.success(nuevoEstado ? 'Membresía activada' : 'Membresía desactivada');
      }
    });
  };

  const handleTogglePopular = (item: TipoProducto) => {
    startTransition(async () => {
      const nuevoPopular = !item.es_popular;
      const res = await togglePopularMembresia(item.id, nuevoPopular);
      if (res.error) {
        toast.error(res.error);
      } else {
        setItems(prev => prev.map(p => p.id === item.id ? { ...p, es_popular: nuevoPopular } : p));
        toast.success(nuevoPopular ? 'Membresía marcada como más popular' : 'Membresía desmarcada');
      }
    });
  };

  const confirmarEliminacion = async () => {
    if (!deleteConfirmId) return;
    startTransition(async () => {
      const res = await eliminarMembresia(deleteConfirmId);
      if (res.error) {
        toast.error(res.error);
      } else if (res.desactivado) {
        toast.info('Tiene compras registradas: se ha desactivado para salvaguardar el historial contable.');
        cargarDatos();
      } else {
        toast.success('Membresía eliminada correctamente');
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
            placeholder="Buscar membresía Guardián..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-off-white placeholder-off-white/40 text-sm focus:outline-none focus:border-conservation-gold/50 transition-colors"
          />
        </div>

        <button
          onClick={abrirCrear}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-conservation-gold text-forest-green-dark font-semibold text-sm hover:bg-yellow-400 transition-all shadow-lg hover:shadow-yellow-500/20 active:scale-95"
        >
          <Plus className="h-4 w-4" />
          Nueva Membresía
        </button>
      </div>

      {/* Grid de Membresías */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-off-white/60">
          <Loader2 className="h-8 w-8 animate-spin text-conservation-gold mb-3" />
          <p className="text-sm">Cargando membresías Guardián...</p>
        </div>
      ) : itemsFiltrados.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-white/10 bg-white/[0.02] text-center">
          <Shield className="h-12 w-12 text-off-white/20 mb-3" />
          <h3 className="text-lg font-medium text-off-white">No hay membresías registradas</h3>
          <p className="text-sm text-off-white/50 mt-1 max-w-sm">
            {search ? 'No se encontraron membresías con ese término de búsqueda.' : 'Crea niveles de membresía para el programa Guardián de El Nido.'}
          </p>
          {!search && (
            <button
              onClick={abrirCrear}
              className="mt-4 px-4 py-2 rounded-xl bg-conservation-gold/20 text-conservation-gold text-sm font-semibold border border-conservation-gold/30 hover:bg-conservation-gold/30 transition-all"
            >
              Crear Membresía Ahora
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {itemsFiltrados.map((item) => {
            const meta = (item.metadata || {}) as MembresiaMetadata;
            const accesos = meta.accesos ?? 1;
            const saldo = meta.saldo ?? 0;
            const descuento = meta.descuento ?? meta.descuento_eventos ?? 15;
            const validez = meta.validez_dias ?? 365;

            return (
              <div
                key={item.id}
                className={cn(
                  "group relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-200",
                  item.es_popular 
                    ? "border-conservation-gold/50 bg-conservation-gold/[0.04] shadow-lg shadow-yellow-500/5" 
                    : item.activo 
                    ? "bg-white/5 border-white/10 hover:border-conservation-gold/30 hover:bg-white/[0.07]" 
                    : "bg-white/[0.02] border-white/5 opacity-70"
                )}
              >
                {/* Header de la tarjeta */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-wider">
                        <Shield className="h-3 w-3" />
                        Guardián
                      </span>
                      {item.es_popular && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-conservation-gold text-forest-green-dark shadow-sm">
                          <Star className="h-3 w-3 fill-current" />
                          Más Popular
                        </span>
                      )}
                    </div>

                    {/* Acciones */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleTogglePopular(item)}
                        disabled={isPending}
                        className={cn(
                          "p-1.5 rounded-lg transition-colors",
                          item.es_popular 
                            ? "text-conservation-gold bg-yellow-500/10 hover:bg-yellow-500/20" 
                            : "text-off-white/40 hover:text-conservation-gold hover:bg-white/10"
                        )}
                        title={item.es_popular ? 'Quitar etiqueta Más Popular' : 'Marcar como Más Popular'}
                      >
                        <Star className={cn("h-4 w-4", item.es_popular && "fill-current")} />
                      </button>
                      <button
                        onClick={() => handleToggleActivo(item)}
                        disabled={isPending}
                        className="text-off-white/60 hover:text-white transition-colors p-1"
                        title={item.activo ? 'Desactivar membresía' : 'Activar membresía'}
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

                  <h3 className="text-xl font-bold text-off-white group-hover:text-conservation-gold transition-colors">
                    {item.nombre}
                  </h3>
                  
                  {item.descripcion && (
                    <p className="text-sm text-off-white/60 mt-1 line-clamp-2">
                      {item.descripcion}
                    </p>
                  )}

                  {/* Lista de beneficios configurados */}
                  <div className="mt-4 space-y-2 border-t border-white/10 pt-3 text-xs text-off-white/80">
                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-quetzal-blue/15 text-quetzal-blue">
                        <Ticket className="h-3.5 w-3.5" />
                      </span>
                      <span>
                        <strong>{accesos}</strong> {accesos === 1 ? 'acceso incluido' : 'accesos incluidos'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
                        <Wallet className="h-3.5 w-3.5" />
                      </span>
                      <span>
                        <strong>${saldo.toLocaleString('es-MX')} MXN</strong> saldo para consumo
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-yellow-500/15 text-conservation-gold">
                        <Percent className="h-3.5 w-3.5" />
                      </span>
                      <span>
                        <strong>{descuento}%</strong> descuento en eventos/talleres
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/15 text-purple-300">
                        <Calendar className="h-3.5 w-3.5" />
                      </span>
                      <span>
                        Validez por <strong>{validez} días</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer de la tarjeta con precio */}
                <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-off-white/40 block">Aportación anual</span>
                    <span className="text-2xl font-black text-conservation-gold tracking-tight">
                      ${Number(item.precio).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                      <span className="text-xs text-off-white/50 ml-1 font-normal">MXN</span>
                    </span>
                  </div>

                  <span className={cn(
                    "text-xs px-2.5 py-1 rounded-md font-medium",
                    item.activo ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                  )}>
                    {item.activo ? 'Venta Activa' : 'Inactiva'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Crear / Editar Membresía */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="relative w-full max-w-xl my-8 rounded-2xl bg-forest-green-dark border border-white/15 p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-conservation-gold/10 text-conservation-gold">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-off-white">
                    {editingId ? 'Editar Membresía' : 'Nueva Membresía Guardián'}
                  </h2>
                  <p className="text-xs text-off-white/60">
                    Configura la tarifa fija, accesos y beneficios exclusivos del programa Guardián
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
                  Nombre de la Membresía *
                </label>
                <input
                  type="text"
                  {...register('nombre')}
                  placeholder="Ej. Guardián Básico, Guardián Plus, Guardián Supremo..."
                  className={cn(
                    "w-full px-4 py-2.5 rounded-xl bg-white/5 border text-off-white text-sm focus:outline-none transition-colors",
                    errors.nombre ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-conservation-gold/50"
                  )}
                />
                {errors.nombre && (
                  <p className="text-xs text-red-400 mt-1">{errors.nombre.message}</p>
                )}
              </div>

              {/* Precio y Validez */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-off-white/80 uppercase tracking-wider mb-1.5">
                    Precio Anual Fijo (MXN) *
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

                <div>
                  <label className="block text-xs font-semibold text-off-white/80 uppercase tracking-wider mb-1.5">
                    Validez (en días) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    {...register('validez_dias', { valueAsNumber: true })}
                    placeholder="365"
                    className={cn(
                      "w-full px-4 py-2.5 rounded-xl bg-white/5 border text-off-white text-sm font-semibold focus:outline-none transition-colors",
                      errors.validez_dias ? "border-red-500 focus:border-red-500" : "border-white/10 focus:border-conservation-gold/50"
                    )}
                  />
                  {errors.validez_dias && (
                    <p className="text-xs text-red-400 mt-1">{errors.validez_dias.message}</p>
                  )}
                </div>
              </div>

              {/* Beneficios: Accesos, Saldo, Descuento */}
              <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3">
                <h4 className="text-xs font-bold text-conservation-gold uppercase tracking-wider">
                  Beneficios incluidos en la Membresía
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-off-white/70 mb-1">
                      Accesos incluidos *
                    </label>
                    <input
                      type="number"
                      min="1"
                      {...register('accesos', { valueAsNumber: true })}
                      placeholder="1"
                      className={cn(
                        "w-full px-3 py-2 rounded-xl bg-white/5 border text-off-white text-sm focus:outline-none transition-colors",
                        errors.accesos ? "border-red-500" : "border-white/10 focus:border-conservation-gold/50"
                      )}
                    />
                    {errors.accesos && (
                      <p className="text-[11px] text-red-400 mt-1">{errors.accesos.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-off-white/70 mb-1">
                      Saldo consumo (MXN)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('saldo', { valueAsNumber: true })}
                      placeholder="200"
                      className={cn(
                        "w-full px-3 py-2 rounded-xl bg-white/5 border text-off-white text-sm focus:outline-none transition-colors",
                        errors.saldo ? "border-red-500" : "border-white/10 focus:border-conservation-gold/50"
                      )}
                    />
                    {errors.saldo && (
                      <p className="text-[11px] text-red-400 mt-1">{errors.saldo.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-off-white/70 mb-1">
                      % Descuento eventos
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      {...register('descuento', { valueAsNumber: true })}
                      placeholder="15"
                      className={cn(
                        "w-full px-3 py-2 rounded-xl bg-white/5 border text-off-white text-sm focus:outline-none transition-colors",
                        errors.descuento ? "border-red-500" : "border-white/10 focus:border-conservation-gold/50"
                      )}
                    />
                    {errors.descuento && (
                      <p className="text-[11px] text-red-400 mt-1">{errors.descuento.message}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div>
                <label className="block text-xs font-semibold text-off-white/80 uppercase tracking-wider mb-1.5">
                  Descripción (Opcional)
                </label>
                <textarea
                  rows={2}
                  {...register('descripcion')}
                  placeholder="Incluye credencial personalizada de Guardián, pasaporte digital y acceso prioritario..."
                  className="w-full px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-off-white text-sm focus:outline-none focus:border-conservation-gold/50 transition-colors resize-none"
                />
              </div>

              {/* Toggles: Es Popular y Activo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Toggle Más Popular */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <div>
                    <p className="text-xs font-semibold text-off-white flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 text-conservation-gold fill-current" />
                      ¿Más popular?
                    </p>
                    <p className="text-[11px] text-off-white/50">Destaca con insignia dorada en boletera.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setValue('es_popular', !esPopularValue)}
                    className="p-1 text-off-white/80 hover:text-white transition-colors"
                  >
                    {esPopularValue ? (
                      <ToggleRight className="h-7 w-7 text-conservation-gold" />
                    ) : (
                      <ToggleLeft className="h-7 w-7 text-off-white/40" />
                    )}
                  </button>
                </div>

                {/* Toggle Activo */}
                <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.03] border border-white/10">
                  <div>
                    <p className="text-xs font-semibold text-off-white">Activar venta</p>
                    <p className="text-[11px] text-off-white/50">Visible en la boletera pública.</p>
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
                  {editingId ? 'Guardar Cambios' : 'Crear Membresía'}
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
                  Si esta membresía ya tiene compras de clientes asociadas, el sistema la <strong>desactivará automáticamente</strong> para proteger los registros de transacciones y estados de cuenta.
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
