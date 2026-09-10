'use server';

import { createAdminSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { headers } from 'next/headers';
import { tipoEntradaSchema, eventoSchema, membresiaSchema, loteDescuentoSchema } from './schemas';
import { descuentoLimiter } from '@/lib/rate-limit';

// Obtener tipos de entrada
export async function getTiposEntrada() {
  try {
    const supabase = await createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('tipos_producto')
      .select('*')
      .in('categoria', ['entrada', 'paquete_familiar'])
      .order('created_at', { ascending: false });
    
    if (error) return { error: error.message, data: [] };
    return { data: data ?? [], error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al obtener tipos de entrada', data: [] };
  }
}

// Crear tipo de entrada
export async function crearTipoEntrada(datos: unknown) {
  try {
    const validado = tipoEntradaSchema.parse(datos);
    const supabase = await createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('tipos_producto')
      .insert({
        nombre: validado.nombre,
        descripcion: validado.descripcion || null,
        precio: validado.precio,
        categoria: validado.categoria,
        activo: validado.activo,
        metadata: { validez_dias: 1 },
      })
      .select()
      .single();
    
    if (error) return { error: error.message, data: null };
    return { data, error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al crear tipo de entrada', data: null };
  }
}

// Actualizar tipo de entrada
export async function actualizarTipoEntrada(id: string, datos: unknown) {
  try {
    const validado = tipoEntradaSchema.parse(datos);
    const supabase = await createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('tipos_producto')
      .update({
        nombre: validado.nombre,
        descripcion: validado.descripcion || null,
        precio: validado.precio,
        categoria: validado.categoria,
        activo: validado.activo,
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) return { error: error.message, data: null };
    return { data, error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al actualizar tipo de entrada', data: null };
  }
}

// Toggle activo tipo de producto (entrada o evento)
export async function toggleActivoProducto(id: string, activo: boolean) {
  try {
    const supabase = await createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('tipos_producto')
      .update({ activo })
      .eq('id', id)
      .select()
      .single();

    if (error) return { error: error.message, data: null };
    return { data, error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al cambiar estado', data: null };
  }
}

// Eliminar (desactivar inteligentemente si tiene compras asociadas)
export async function eliminarTipoEntrada(id: string) {
  try {
    const supabase = await createAdminSupabaseClient();
    
    // Verificar si tiene compras asociadas en compra_items o compras
    const { data: compras } = await supabase
      .from('compra_items')
      .select('id')
      .eq('tipo_producto_id', id)
      .limit(1);
    
    if (compras && compras.length > 0) {
      // Desactivar en lugar de eliminar
      const { data, error } = await supabase
        .from('tipos_producto')
        .update({ activo: false })
        .eq('id', id)
        .select()
        .single();
      return { data, error: error ? error.message : null, desactivado: true };
    }
    
    const { error } = await supabase
      .from('tipos_producto')
      .delete()
      .eq('id', id);
    
    return { error: error ? error.message : null, desactivado: false };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al eliminar', desactivado: false };
  }
}

// Eventos
export async function getEventos() {
  try {
    const supabase = await createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('tipos_producto')
      .select('*')
      .eq('categoria', 'evento')
      .order('created_at', { ascending: false });
    
    if (error) return { error: error.message, data: [] };
    return { data: data ?? [], error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al obtener eventos', data: [] };
  }
}

export async function crearEvento(datos: unknown) {
  try {
    const validado = eventoSchema.parse(datos);
    const supabase = await createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('tipos_producto')
      .insert({
        nombre: validado.nombre,
        descripcion: validado.descripcion || null,
        precio: validado.precio,
        categoria: 'evento',
        activo: validado.activo,
        metadata: {
          fecha: validado.fecha,
          hora: validado.hora,
          cupo: validado.cupo_maximo,
        },
      })
      .select()
      .single();
    
    if (error) return { error: error.message, data: null };
    return { data, error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al crear evento', data: null };
  }
}

export async function actualizarEvento(id: string, datos: unknown) {
  try {
    const validado = eventoSchema.parse(datos);
    const supabase = await createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('tipos_producto')
      .update({
        nombre: validado.nombre,
        descripcion: validado.descripcion || null,
        precio: validado.precio,
        activo: validado.activo,
        metadata: {
          fecha: validado.fecha,
          hora: validado.hora,
          cupo: validado.cupo_maximo,
        },
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) return { error: error.message, data: null };
    return { data, error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al actualizar evento', data: null };
  }
}

export async function eliminarEvento(id: string) {
  try {
    const supabase = await createAdminSupabaseClient();

    // Verificar si tiene compras asociadas
    const { data: compras } = await supabase
      .from('compra_items')
      .select('id')
      .eq('tipo_producto_id', id)
      .limit(1);
    
    if (compras && compras.length > 0) {
      const { data, error } = await supabase
        .from('tipos_producto')
        .update({ activo: false })
        .eq('id', id)
        .select()
        .single();
      return { data, error: error ? error.message : null, desactivado: true };
    }

    const { error } = await supabase
      .from('tipos_producto')
      .delete()
      .eq('id', id);
    
    return { error: error ? error.message : null, desactivado: false };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al eliminar evento', desactivado: false };
  }
}

// Ventas
export async function getVentasBoletos() {
  try {
    const supabase = await createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('compras')
      .select('*, compra_items(*), clientes(nombre, email)')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) return { error: error.message, data: [] };
    return { data: data ?? [], error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al obtener ventas', data: [] };
  }
}

// ==========================================
// MEMBRESÍAS GUARDIÁN
// ==========================================

export async function getMembresias() {
  try {
    const supabase = await createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('tipos_producto')
      .select('*')
      .eq('categoria', 'membresia')
      .order('precio', { ascending: true });
    
    if (error) return { error: error.message, data: [] };
    return { data: data ?? [], error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al obtener membresías', data: [] };
  }
}

export async function crearMembresia(datos: unknown) {
  try {
    const validado = membresiaSchema.parse(datos);
    const supabase = await createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('tipos_producto')
      .insert({
        nombre: validado.nombre,
        descripcion: validado.descripcion || null,
        precio: validado.precio,
        categoria: 'membresia',
        activo: validado.activo,
        es_popular: validado.es_popular,
        metadata: {
          accesos: validado.accesos,
          saldo: validado.saldo,
          descuento: validado.descuento,
          validez_dias: validado.validez_dias,
        },
      })
      .select()
      .single();
    
    if (error) return { error: error.message, data: null };
    revalidatePath('/boletos');
    return { data, error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al crear membresía', data: null };
  }
}

export async function actualizarMembresia(id: string, datos: unknown) {
  try {
    const validado = membresiaSchema.parse(datos);
    const supabase = await createAdminSupabaseClient();
    
    const { data, error } = await supabase
      .from('tipos_producto')
      .update({
        nombre: validado.nombre,
        descripcion: validado.descripcion || null,
        precio: validado.precio,
        activo: validado.activo,
        es_popular: validado.es_popular,
        metadata: {
          accesos: validado.accesos,
          saldo: validado.saldo,
          descuento: validado.descuento,
          validez_dias: validado.validez_dias,
        },
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) return { error: error.message, data: null };
    revalidatePath('/boletos');
    return { data, error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al actualizar membresía', data: null };
  }
}

export async function togglePopularMembresia(id: string, es_popular: boolean) {
  try {
    const supabase = await createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('tipos_producto')
      .update({ es_popular })
      .eq('id', id)
      .select()
      .single();

    if (error) return { error: error.message, data: null };
    revalidatePath('/boletos');
    return { data, error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al cambiar estado popular', data: null };
  }
}

export async function eliminarMembresia(id: string) {
  try {
    const supabase = await createAdminSupabaseClient();
    
    // Verificar si tiene compras asociadas
    const { data: compras } = await supabase
      .from('compra_items')
      .select('id')
      .eq('tipo_producto_id', id)
      .limit(1);
    
    if (compras && compras.length > 0) {
      const { data, error } = await supabase
        .from('tipos_producto')
        .update({ activo: false })
        .eq('id', id)
        .select()
        .single();
      revalidatePath('/boletos');
      return { data, error: error ? error.message : null, desactivado: true };
    }
    
    const { error } = await supabase
      .from('tipos_producto')
      .delete()
      .eq('id', id);
    
    if (error) return { error: error.message, desactivado: false };
    revalidatePath('/boletos');
    return { error: null, desactivado: false };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al eliminar membresía', desactivado: false };
  }
}

// ==========================================
// DÍAS DE VENTA
// ==========================================

export async function getDiasVenta() {
  try {
    const supabase = await createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('dias_venta')
      .select('*')
      .order('dia_semana', { ascending: true });
    
    if (error) return { error: error.message, data: [] };
    return { data: data ?? [], error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al obtener días de venta', data: [] };
  }
}

export async function toggleDiaVenta(diaSemana: number, habilitado: boolean) {
  try {
    const supabase = await createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('dias_venta')
      .update({ habilitado, updated_at: new Date().toISOString() })
      .eq('dia_semana', diaSemana)
      .select()
      .single();
    
    if (error) return { error: error.message, data: null };
    revalidatePath('/boletos');
    return { data, error: null };
  } catch (err: unknown) {
    return { error: err instanceof Error ? err.message : 'Error al actualizar día de venta', data: null };
  }
}

// ==========================================
// CÓDIGOS DE DESCUENTO (UN SOLO USO + LOTES)
// ==========================================

function generarCodigoRandom(prefijo: string | null | undefined, longitud: number): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  let randomPart = '';
  for (let i = 0; i < longitud; i++) {
    randomPart += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const cleanPrefijo = prefijo ? prefijo.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '') : '';
  return cleanPrefijo ? `${cleanPrefijo}-${randomPart}` : randomPart;
}

export async function getCodigosDescuento(filtros?: {
  lote?: string;
  estado?: 'todos' | 'disponibles' | 'usados';
  busqueda?: string;
}) {
  try {
    const supabase = await createAdminSupabaseClient();
    let query = supabase
      .from('codigos_descuento')
      .select('*')
      .order('created_at', { ascending: false });

    if (filtros?.lote && filtros.lote !== 'todos') {
      query = query.eq('lote', filtros.lote);
    }

    if (filtros?.estado === 'disponibles') {
      query = query.eq('usado', false).eq('activo', true);
    } else if (filtros?.estado === 'usados') {
      query = query.eq('usado', true);
    }

    if (filtros?.busqueda) {
      const busqueda = filtros.busqueda.trim().toUpperCase();
      query = query.ilike('codigo', `%${busqueda}%`);
    }

    const { data, error } = await query;

    if (error) return { error: error.message, data: [] };
    return { data: data ?? [], error: null };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : 'Error al obtener códigos de descuento',
      data: [],
    };
  }
}

export async function getLotesResumen() {
  try {
    const supabase = await createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('codigos_descuento')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return { error: error.message, data: [] };

    // Agrupar por nombre de lote
    const mapa = new Map<string, {
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
    }>();

    for (const item of data ?? []) {
      const existing = mapa.get(item.lote);
      if (!existing) {
        mapa.set(item.lote, {
          lote: item.lote,
          porcentaje_descuento: Number(item.porcentaje_descuento),
          categorias_aplicables: item.categorias_aplicables || [],
          total: 1,
          usados: item.usado ? 1 : 0,
          disponibles: !item.usado && item.activo ? 1 : 0,
          activos: item.activo ? 1 : 0,
          max_items_por_compra: item.max_items_por_compra ?? null,
          max_descuento_monto: item.max_descuento_monto ? Number(item.max_descuento_monto) : null,
          fecha_inicio: item.fecha_inicio,
          fecha_fin: item.fecha_fin,
          created_at: item.created_at,
        });
      } else {
        existing.total += 1;
        if (item.usado) existing.usados += 1;
        if (!item.usado && item.activo) existing.disponibles += 1;
        if (item.activo) existing.activos += 1;
      }
    }

    return { data: Array.from(mapa.values()), error: null };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : 'Error al agrupar lotes',
      data: [],
    };
  }
}

export async function generarLoteCodigos(datos: unknown) {
  try {
    const validado = loteDescuentoSchema.parse(datos);
    const supabase = await createAdminSupabaseClient();

    // Obtener email del admin que genera el lote
    const { data: { user } } = await supabase.auth.getUser();
    const adminEmail = user?.email ?? 'admin';

    // Obtener códigos existentes para evitar colisiones
    const { data: existentes } = await supabase
      .from('codigos_descuento')
      .select('codigo');
    
    const codigosExistentesSet = new Set((existentes ?? []).map((c) => c.codigo.toUpperCase()));

    const codigosNuevos: string[] = [];
    const setNuevos = new Set<string>();

    let intentos = 0;
    const maxIntentos = validado.cantidad * 20;

    while (setNuevos.size < validado.cantidad && intentos < maxIntentos) {
      intentos++;
      const code = generarCodigoRandom(validado.prefijo, validado.longitud_aleatoria);
      if (!codigosExistentesSet.has(code) && !setNuevos.has(code)) {
        setNuevos.add(code);
        codigosNuevos.push(code);
      }
    }

    if (codigosNuevos.length < validado.cantidad) {
      return {
        error: `Solo se pudieron generar ${codigosNuevos.length} códigos únicos. Intenta con un prefijo diferente o mayor longitud.`,
        data: null,
      };
    }

    const registrosParaInsertar = codigosNuevos.map((codigo) => ({
      codigo,
      lote: validado.lote.trim(),
      porcentaje_descuento: validado.porcentaje_descuento,
      categorias_aplicables: validado.categorias_aplicables,
      activo: validado.activo,
      usado: false,
      max_items_por_compra: validado.max_items_por_compra ?? 4,
      max_descuento_monto: validado.max_descuento_monto ? Number(validado.max_descuento_monto) : null,
      fecha_inicio: validado.fecha_inicio ? new Date(validado.fecha_inicio).toISOString() : null,
      fecha_fin: validado.fecha_fin ? new Date(validado.fecha_fin).toISOString() : null,
      creado_por: adminEmail,
    }));

    // Inserción en bloques de 100 si es necesario
    const { data, error } = await supabase
      .from('codigos_descuento')
      .insert(registrosParaInsertar)
      .select();

    if (error) return { error: error.message, data: null };

    return { data, error: null, cantidad: codigosNuevos.length };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : 'Error al generar lote de códigos',
      data: null,
    };
  }
}

export async function toggleActivoCodigo(id: string, activo: boolean) {
  try {
    const supabase = await createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('codigos_descuento')
      .update({ activo })
      .eq('id', id)
      .select()
      .single();

    if (error) return { error: error.message, data: null };
    return { data, error: null };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : 'Error al actualizar código',
      data: null,
    };
  }
}

export async function toggleActivoLote(lote: string, activo: boolean) {
  try {
    const supabase = await createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('codigos_descuento')
      .update({ activo })
      .eq('lote', lote)
      .select();

    if (error) return { error: error.message, data: null };
    return { data, error: null };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : 'Error al actualizar lote',
      data: null,
    };
  }
}

export async function eliminarCodigo(id: string) {
  try {
    const supabase = await createAdminSupabaseClient();
    
    // Verificar si ya fue usado
    const { data: codigo } = await supabase
      .from('codigos_descuento')
      .select('usado')
      .eq('id', id)
      .single();

    if (codigo?.usado) {
      return { error: 'No se puede eliminar un código que ya fue canjeado', data: null };
    }

    const { error } = await supabase
      .from('codigos_descuento')
      .delete()
      .eq('id', id);

    if (error) return { error: error.message, data: null };
    return { error: null, data: true };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : 'Error al eliminar código',
      data: null,
    };
  }
}

export async function eliminarLoteNoUsados(lote: string) {
  try {
    const supabase = await createAdminSupabaseClient();
    
    // Eliminar solo los que NO han sido usados
    const { data, error } = await supabase
      .from('codigos_descuento')
      .delete()
      .eq('lote', lote)
      .eq('usado', false)
      .select();

    if (error) return { error: error.message, data: null };
    return { error: null, data, eliminados: data?.length ?? 0 };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : 'Error al eliminar lote',
      data: null,
    };
  }
}

export async function validarCodigoDescuentoPublico(
  codigoRaw: string,
  categoriasCarrito: string[] = [],
  cantidadItems: number = 1,
  subtotalCarrito: number = 0
) {
  try {
    // Rate limiting: máximo 10 intentos de validación por IP cada minuto
    const h = await headers();
    const ip = h.get('x-forwarded-for') ?? h.get('x-real-ip') ?? 'unknown';
    const rateLimit = descuentoLimiter.check(ip);
    if (!rateLimit.success) {
      return { valid: false, error: 'Demasiados intentos. Espera un momento.' };
    }

    const codigo = codigoRaw.trim().toUpperCase();
    if (!codigo) {
      return { valid: false, error: 'Por favor ingresa un código de descuento' };
    }

    const supabase = await createAdminSupabaseClient();

    // 1. Buscar en codigos_descuento
    const { data: descRow, error } = await supabase
      .from('codigos_descuento')
      .select('*')
      .ilike('codigo', codigo)
      .maybeSingle();

    if (error) {
      return { valid: false, error: 'Error al consultar código de descuento' };
    }

    if (descRow) {
      if (!descRow.activo) {
        return { valid: false, error: 'Este código de descuento está inactivo' };
      }

      if (descRow.usado) {
        return { valid: false, error: 'Este código de descuento ya ha sido utilizado' };
      }

      const ahora = new Date();
      if (descRow.fecha_inicio && new Date(descRow.fecha_inicio) > ahora) {
        return { valid: false, error: 'Este código de descuento aún no está vigente' };
      }

      if (descRow.fecha_fin && new Date(descRow.fecha_fin) < ahora) {
        return { valid: false, error: 'Este código de descuento ha expirado' };
      }

      // Validar límite de items por compra
      if (descRow.max_items_por_compra && cantidadItems > descRow.max_items_por_compra) {
        return {
          valid: false,
          error: `Este código solo aplica hasta ${descRow.max_items_por_compra} item${descRow.max_items_por_compra !== 1 ? 's' : ''}`,
        };
      }

      // Validar monto máximo de descuento
      if (descRow.max_descuento_monto && subtotalCarrito > 0) {
        const descuentoEstimado = (subtotalCarrito * Number(descRow.porcentaje_descuento)) / 100;
        if (descuentoEstimado > Number(descRow.max_descuento_monto)) {
          return {
            valid: false,
            error: `Este código tiene un descuento máximo de $${descRow.max_descuento_monto}`,
          };
        }
      }

      // Validar categorías aplicables
      const categorias = descRow.categorias_aplicables || [];
      const aplicaATodas = categorias.length === 0 || categorias.includes('todas');

      if (!aplicaATodas && categoriasCarrito.length > 0) {
        const coincide = categoriasCarrito.some((cat) => categorias.includes(cat));
        if (!coincide) {
          const nombresCategorias = categorias
            .map((c) => (c === 'entrada' ? 'entradas' : c === 'membresia' ? 'membresías' : c === 'evento' ? 'eventos' : c))
            .join(', ');
          return {
            valid: false,
            error: `Este cupón solo es válido para: ${nombresCategorias}`,
          };
        }
      }

      return {
        valid: true,
        codigo: descRow.codigo,
        porcentaje: Number(descRow.porcentaje_descuento),
        categorias_aplicables: descRow.categorias_aplicables,
        max_items_por_compra: descRow.max_items_por_compra,
        max_descuento_monto: descRow.max_descuento_monto,
      };
    }

    // 2. Fallback a tabla legacy campanas
    const { data: campana } = await supabase
      .from('campanas')
      .select('*')
      .eq('codigo_descuento', codigo)
      .eq('activa', true)
      .maybeSingle();

    if (campana && campana.porcentaje_descuento) {
      const ahora = Date.now();
      const expirado =
        (campana.fecha_inicio && new Date(campana.fecha_inicio).getTime() > ahora) ||
        (campana.fecha_fin && new Date(campana.fecha_fin).getTime() < ahora);

      if (expirado) {
        return { valid: false, error: 'Este código de descuento ha expirado' };
      }

      return {
        valid: true,
        codigo: campana.codigo_descuento,
        porcentaje: Number(campana.porcentaje_descuento),
        categorias_aplicables: ['todas'],
      };
    }

    return { valid: false, error: 'Código de descuento no encontrado o no válido' };
  } catch (err: unknown) {
    return {
      valid: false,
      error: err instanceof Error ? err.message : 'Error inesperado al validar código',
    };
  }
}
