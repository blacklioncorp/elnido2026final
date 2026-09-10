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
  max_personas: number;
  descripcion_corta: string;
  descripcion_larga: string;
  objetivos: string;
  actividades: any[]; // JSONB
  itinerario: ItinerarioItem[] | null; // JSONB
  instalaciones: string | null;
  alineacion_sep: string | null;
  imagen_url: string | null;
  activo: boolean;
  created_at: string;
  updated_at: string;
}

export type EstadoCotizacion = 'pendiente' | 'respondida' | 'confirmada' | 'cancelada';

export interface Cotizacion {
  id: string;
  paquete_id: string;
  nombre_contacto: string;
  email_contacto: string;
  telefono_contacto: string | null;
  nombre_institucion: string | null;
  numero_personas: number;
  fecha_deseada: string;
  incluye_lunch: boolean;
  incluye_transporte: boolean;
  mensaje: string | null;
  estado: EstadoCotizacion;
  created_at: string;
  updated_at: string;
  
  // Relacion opcional (si se hace join con paquete)
  paquetes_educativos?: PaqueteEducativo;
}
