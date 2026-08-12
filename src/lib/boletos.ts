import type { Database } from './database.types'

// Fila cruda de tipos_producto
export type TipoProducto = Database['public']['Tables']['tipos_producto']['Row']
export type Compra = Database['public']['Tables']['compras']['Row']

export type CategoriaProducto = TipoProducto['categoria']

// Metadata tipada según categoría (todas las claves son opcionales porque
// viven en un JSONB flexible en la base de datos).
export interface ProductoMetadata {
  validez_dias?: number
  edad_min?: number
  edad_max?: number
  requiere_identificacion?: boolean
  adultos?: number
  ninos?: number
  accesos?: number
  descuento_eventos?: number
  saldo?: number
  fecha?: string
  hora?: string
  cupo?: number
}

export function getMetadata(producto: TipoProducto): ProductoMetadata {
  return (producto.metadata ?? {}) as ProductoMetadata
}

export const CATEGORIA_LABELS: Record<CategoriaProducto, string> = {
  entrada: 'Entradas',
  paquete_familiar: 'Entradas',
  membresia: 'Membresías',
  evento: 'Eventos',
}
