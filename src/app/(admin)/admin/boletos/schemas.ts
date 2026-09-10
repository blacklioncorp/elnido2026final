import { z } from 'zod';

export const tipoEntradaSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional().nullable(),
  precio: z.number().min(0, 'Precio inválido'),
  categoria: z.enum(['entrada', 'paquete_familiar']),
  activo: z.boolean(),
});

export const eventoSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional().nullable(),
  precio: z.number().min(0, 'Precio inválido'),
  fecha: z.string().min(1, 'Fecha requerida'),
  hora: z.string().min(1, 'Hora requerida'),
  cupo_maximo: z.number().min(1, 'Cupo mínimo 1'),
  activo: z.boolean(),
});

export const membresiaSchema = z.object({
  nombre: z.string().min(2, 'Mínimo 2 caracteres'),
  descripcion: z.string().optional().nullable(),
  precio: z.number().min(0, 'Precio inválido'),
  activo: z.boolean(),
  es_popular: z.boolean(),
  accesos: z.number().min(1, 'Mínimo 1 acceso'),
  saldo: z.number().min(0, 'El saldo no puede ser negativo'),
  descuento: z.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%'),
  validez_dias: z.number().min(1, 'Mínimo 1 día'),
});

export const loteDescuentoSchema = z.object({
  lote: z.string().min(2, 'El nombre del lote debe tener al menos 2 caracteres'),
  porcentaje_descuento: z.number().min(1, 'El descuento mínimo es 1%').max(100, 'El descuento máximo es 100%'),
  categorias_aplicables: z.array(z.string()).min(1, 'Selecciona al menos una categoría'),
  cantidad: z.number().int().min(1, 'Mínimo 1 código').max(500, 'Máximo 500 códigos por lote'),
  prefijo: z.string().optional().nullable(),
  longitud_aleatoria: z.number().int().min(4).max(12),
  max_items_por_compra: z.number().int().min(1, 'Mínimo 1 item').optional().nullable(),
  max_descuento_monto: z.number().min(0, 'Monto inválido').optional().nullable(),
  fecha_inicio: z.string().optional().nullable(),
  fecha_fin: z.string().optional().nullable(),
  activo: z.boolean(),
});

export type TipoEntradaInput = z.infer<typeof tipoEntradaSchema>;
export type EventoInput = z.infer<typeof eventoSchema>;
export type MembresiaInput = z.infer<typeof membresiaSchema>;
export type LoteDescuentoInput = z.infer<typeof loteDescuentoSchema>;
