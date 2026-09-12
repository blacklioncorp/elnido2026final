'use server';

import { createAdminSupabaseClient } from '@/lib/supabase-server';
import { revalidatePath } from 'next/cache';
import { getFeriadosMexicoPorMes } from '@/lib/feriados-mexico';

export interface DiaEspecial {
  id: string;
  fecha: string;
  tipo: 'feriado' | 'evento' | 'vacaciones' | 'cerrado';
  descripcion: string | null;
  created_at?: string;
  esCalculado?: boolean;
}

export interface ReservaItem {
  id: string;
  nombre: string;
  cantidad: number;
  precio_unitario: number;
  categoria?: string;
}

export interface ReservaDia {
  id: string;
  clienteNombre: string;
  clienteEmail: string;
  cantidadPersonas: number;
  total: number;
  estado: string;
  hora: string;
  tipoProducto?: string;
  categoria?: string;
  items: ReservaItem[];
}

export interface DiaOcupacion {
  fecha: string;
  diaNumero: number;
  totalVisitantes: number;
  totalReservas: number;
  desglose: {
    entradas: number;
    paquetes: number;
    eventos: number;
    membresias: number;
    otros: number;
  };
  reservas: ReservaDia[];
  diaEspecial?: DiaEspecial | null;
}

export interface CalendarioKPIs {
  visitantesMes: number;
  diasConVisitas: number;
  diaMasOcupado: {
    fecha: string;
    visitantes: number;
  } | null;
  promedioDiario: number;
}

export interface CalendarioResponse {
  year: number;
  month: number;
  kpis: CalendarioKPIs;
  diasMap: Record<string, DiaOcupacion>;
  diasEspeciales: DiaEspecial[];
  error: string | null;
}

/**
 * Obtiene los datos del calendario para un mes y año específicos, con filtros opcionales.
 */
export async function getCalendarioData(
  year: number,
  month: number, // 1 a 12
  categoriaFiltro: string = 'todos'
): Promise<CalendarioResponse> {
  try {
    const supabase = await createAdminSupabaseClient();

    const monthStr = String(month).padStart(2, '0');
    const lastDayOfMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${monthStr}-01`;
    const endDate = `${year}-${monthStr}-${String(lastDayOfMonth).padStart(2, '0')}`;

    // 1. Obtener feriados calculados automáticamente de forma inteligente
    const feriadosCalculados = getFeriadosMexicoPorMes(year, month);
    const diasEspecialesMap = new Map<string, DiaEspecial>();

    feriadosCalculados.forEach((f) => {
      diasEspecialesMap.set(f.fecha, {
        id: `calc-${f.fecha}`,
        fecha: f.fecha,
        tipo: f.tipo,
        descripcion: f.descripcion,
        created_at: new Date().toISOString(),
        esCalculado: true,
      });
    });

    // 2. Obtener días especiales personalizados de Supabase (que pueden sobrescribir o complementar)
    const { data: diasEspData, error: errorEsp } = await supabase
      .from('dias_especiales')
      .select('*')
      .gte('fecha', startDate)
      .lte('fecha', endDate);

    if (errorEsp) {
      console.error('Error al obtener dias_especiales:', errorEsp);
    }

    (diasEspData || []).forEach((d) => {
      diasEspecialesMap.set(d.fecha, {
        ...d,
        esCalculado: false,
      } as DiaEspecial);
    });

    // 2. Obtener compras programadas para este mes
    const { data: comprasData, error: errorCompras } = await supabase
      .from('compras')
      .select(`
        id,
        cliente_id,
        tipo_producto_id,
        total,
        estado,
        fecha_visita,
        cantidad_personas,
        created_at,
        clientes (
          nombre,
          email
        ),
        compra_items (
          id,
          nombre,
          cantidad,
          precio_unitario,
          categoria
        ),
        tipos_producto (
          nombre,
          categoria
        )
      `)
      .gte('fecha_visita', startDate)
      .lte('fecha_visita', endDate)
      .neq('estado', 'cancelado')
      .order('created_at', { ascending: false });

    if (errorCompras) {
      console.error('Error al obtener compras para el calendario:', errorCompras);
      return {
        year,
        month,
        kpis: {
          visitantesMes: 0,
          diasConVisitas: 0,
          diaMasOcupado: null,
          promedioDiario: 0,
        },
        diasMap: {},
        diasEspeciales: diasEspData as DiaEspecial[] || [],
        error: errorCompras.message,
      };
    }

    // 3. Procesar y agrupar datos por fecha
    const diasMap: Record<string, DiaOcupacion> = {};

    // Inicializar todos los días del mes
    for (let day = 1; day <= lastDayOfMonth; day++) {
      const fechaKey = `${year}-${monthStr}-${String(day).padStart(2, '0')}`;
      diasMap[fechaKey] = {
        fecha: fechaKey,
        diaNumero: day,
        totalVisitantes: 0,
        totalReservas: 0,
        desglose: {
          entradas: 0,
          paquetes: 0,
          eventos: 0,
          membresias: 0,
          otros: 0,
        },
        reservas: [],
        diaEspecial: diasEspecialesMap.get(fechaKey) || null,
      };
    }

    // Agregar datos de compras a cada día
    for (const compra of comprasData || []) {
      const fecha = compra.fecha_visita;
      if (!fecha || !diasMap[fecha]) continue;

      const items = (compra.compra_items as unknown as ReservaItem[]) || [];
      const prodCategoria = compra.tipos_producto?.categoria || (items[0]?.categoria) || 'entrada';
      const prodNombre = compra.tipos_producto?.nombre || (items[0]?.nombre) || 'Boleto';

      // Comprobar si aplica el filtro de categoría
      let aplicaFiltro = true;
      if (categoriaFiltro !== 'todos') {
        const coincideProducto = prodCategoria === categoriaFiltro;
        const coincideItems = items.some((i) => i.categoria === categoriaFiltro);
        if (!coincideProducto && !coincideItems) {
          aplicaFiltro = false;
        }
      }

      if (!aplicaFiltro) continue;

      // Calcular personas
      let personas = compra.cantidad_personas || 1;
      // Si hay items y la cantidad_personas es 0/default, calcular de los items
      if (!compra.cantidad_personas && items.length > 0) {
        personas = items.reduce((acc, curr) => acc + (curr.cantidad || 0), 0);
      }

      const dia = diasMap[fecha];
      dia.totalVisitantes += personas;
      dia.totalReservas += 1;

      // Desglose por categoría
      if (prodCategoria === 'entrada') {
        dia.desglose.entradas += personas;
      } else if (prodCategoria === 'paquete_familiar') {
        dia.desglose.paquetes += personas;
      } else if (prodCategoria === 'evento') {
        dia.desglose.eventos += personas;
      } else if (prodCategoria === 'membresia') {
        dia.desglose.membresias += personas;
      } else {
        dia.desglose.otros += personas;
      }

      // Agregar reserva al listado del día
      dia.reservas.push({
        id: compra.id,
        clienteNombre: compra.clientes?.nombre || 'Cliente Anónimo',
        clienteEmail: compra.clientes?.email || 'Sin correo',
        cantidadPersonas: personas,
        total: compra.total || 0,
        estado: compra.estado || 'completado',
        hora: new Date(compra.created_at).toLocaleTimeString('es-MX', {
          hour: '2-digit',
          minute: '2-digit',
        }),
        tipoProducto: prodNombre,
        categoria: prodCategoria,
        items,
      });
    }

    // 4. Calcular KPIs
    let visitantesMes = 0;
    let diasConVisitas = 0;
    let diaMasOcupado: { fecha: string; visitantes: number } | null = null;

    Object.values(diasMap).forEach((dia) => {
      if (dia.totalVisitantes > 0) {
        visitantesMes += dia.totalVisitantes;
        diasConVisitas += 1;

        if (!diaMasOcupado || dia.totalVisitantes > diaMasOcupado.visitantes) {
          diaMasOcupado = {
            fecha: dia.fecha,
            visitantes: dia.totalVisitantes,
          };
        }
      }
    });

    const promedioDiario = diasConVisitas > 0 ? Math.round((visitantesMes / diasConVisitas) * 10) / 10 : 0;

    return {
      year,
      month,
      kpis: {
        visitantesMes,
        diasConVisitas,
        diaMasOcupado,
        promedioDiario,
      },
      diasMap,
      diasEspeciales: Array.from(diasEspecialesMap.values()),
      error: null,
    };
  } catch (err: unknown) {
    console.error('Error inesperado en getCalendarioData:', err);
    return {
      year,
      month,
      kpis: {
        visitantesMes: 0,
        diasConVisitas: 0,
        diaMasOcupado: null,
        promedioDiario: 0,
      },
      diasMap: {},
      diasEspeciales: [],
      error: err instanceof Error ? err.message : 'Error inesperado',
    };
  }
}

/**
 * Guarda o actualiza un día especial / feriado en la base de datos
 */
export async function guardarDiaEspecial(
  fecha: string,
  tipo: 'feriado' | 'evento' | 'vacaciones' | 'cerrado',
  descripcion: string
) {
  try {
    const supabase = await createAdminSupabaseClient();
    const { data, error } = await supabase
      .from('dias_especiales')
      .upsert(
        {
          fecha,
          tipo,
          descripcion: descripcion.trim(),
        },
        { onConflict: 'fecha' }
      )
      .select()
      .single();

    if (error) {
      return { error: error.message, data: null };
    }

    revalidatePath('/admin/boletos/calendario');
    return { data, error: null };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : 'Error al guardar día especial',
      data: null,
    };
  }
}

/**
 * Elimina un día especial de la base de datos
 */
export async function eliminarDiaEspecial(id: string) {
  try {
    const supabase = await createAdminSupabaseClient();
    const { error } = await supabase
      .from('dias_especiales')
      .delete()
      .eq('id', id);

    if (error) {
      return { error: error.message, success: false };
    }

    revalidatePath('/admin/boletos/calendario');
    return { error: null, success: true };
  } catch (err: unknown) {
    return {
      error: err instanceof Error ? err.message : 'Error al eliminar día especial',
      success: false,
    };
  }
}
