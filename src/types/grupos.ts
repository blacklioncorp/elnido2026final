export type NivelEducativo = 'preescolar' | 'primaria' | 'secundaria' | 'preparatoria' | 'licenciatura';

export interface ActividadPaquete {
  nombre: string;
  duracion: string; // ej: "45 min"
}

export interface ItinerarioItem {
  actividad: string;
  duracion: string;
}

export interface PaqueteEducativo {
  id: string;
  nombre: string;
  slug: string;
  nivel: NivelEducativo;
  duracion_horas: number;
  precio_por_persona: number;
  min_personas: number;
  max_personas: number;
  descripcion: string;
  que_incluye: string[] | null;
  que_no_incluye: string[] | null;
  itinerario: ItinerarioItem[] | null; // JSONB
  instalaciones: string[] | null;
  alineacion_sep: string[] | null;
  incluye_transporte: boolean;
  precio_transporte: number | null;
  incluye_lunch: boolean;
  precio_lunch: number | null;
  imagen_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export type EstadoCotizacion = 'pendiente' | 'respondida' | 'confirmada' | 'cancelada';

export interface Cotizacion {
  id: string;
  paquete_id: string;
  cliente_nombre: string;
  cliente_email: string;
  cliente_telefono: string | null;
  escuela: string | null;
  personas: number;
  fecha_deseada: string;
  incluye_lunch: boolean;
  incluye_transporte: boolean;
  total_estimado: number;
  mensaje: string | null;
  estado: EstadoCotizacion;
  created_at: string;
  updated_at: string;
  
  // Relacion opcional (si se hace join con paquete)
  paquetes_educativos?: PaqueteEducativo;
}
