import { create } from 'zustand'

export interface CartItem {
  tipoProductoId: string
  nombre: string
  precio: number
  cantidad: number
  categoria: string
  metadata?: Record<string, unknown>
}

interface CartStore {
  items: CartItem[]
  fechaVisita: string | null
  codigoDescuento: string | null
  descuentoAplicado: number
  setFechaVisita: (fecha: string) => void
  setCodigoDescuento: (codigo: string | null, descuento: number) => void
  addItem: (item: Omit<CartItem, 'cantidad'>) => void
  removeItem: (id: string) => void
  updateCantidad: (id: string, cantidad: number) => void
  getSubtotal: () => number
  getTotal: () => number
  getCantidadTotal: () => number
  clear: () => void
}

export const useCartStore = create<CartStore>((set, get) => ({
  items: [],
  fechaVisita: null,
  codigoDescuento: null,
  descuentoAplicado: 0,
  setFechaVisita: (fecha) => set({ fechaVisita: fecha }),
  setCodigoDescuento: (codigo, descuento) =>
    set({ codigoDescuento: codigo, descuentoAplicado: descuento }),
  addItem: (item) => {
    const items = get().items
    const existing = items.find((i) => i.tipoProductoId === item.tipoProductoId)
    if (existing) {
      set({
        items: items.map((i) =>
          i.tipoProductoId === item.tipoProductoId
            ? { ...i, cantidad: i.cantidad + 1 }
            : i,
        ),
      })
    } else {
      set({ items: [...items, { ...item, cantidad: 1 }] })
    }
  },
  removeItem: (id) =>
    set({ items: get().items.filter((i) => i.tipoProductoId !== id) }),
  updateCantidad: (id, cantidad) => {
    if (cantidad <= 0) {
      get().removeItem(id)
      return
    }
    set({
      items: get().items.map((i) =>
        i.tipoProductoId === id ? { ...i, cantidad } : i,
      ),
    })
  },
  getSubtotal: () =>
    get().items.reduce((sum, i) => sum + i.precio * i.cantidad, 0),
  getTotal: () => {
    const subtotal = get().getSubtotal()
    return subtotal - (subtotal * get().descuentoAplicado) / 100
  },
  getCantidadTotal: () => get().items.reduce((sum, i) => sum + i.cantidad, 0),
  clear: () =>
    set({
      items: [],
      fechaVisita: null,
      codigoDescuento: null,
      descuentoAplicado: 0,
    }),
}))
