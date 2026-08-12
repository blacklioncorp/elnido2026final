import { create } from 'zustand'

export interface POSCliente {
  id: string
  nombre: string
  email: string
  saldo: number
  membresiaActiva: boolean
  membresiaTipo?: string
}

export interface POSItem {
  productoId: string
  nombre: string
  precio: number
  cantidad: number
}

interface POSStore {
  cajaId: string | null
  cajaNombre: string | null
  cajaTipo: string | null
  clienteActual: POSCliente | null
  itemsVenta: POSItem[]
  metodoPago: 'efectivo' | 'tarjeta' | 'saldo_rfid' | null
  
  setCaja: (id: string, nombre: string, tipo: string) => void
  setCliente: (cliente: POSCliente | null) => void
  addProducto: (producto: Omit<POSItem, 'cantidad'>) => void
  removeProducto: (productoId: string) => void
  updateCantidad: (productoId: string, cantidad: number) => void
  setMetodoPago: (metodo: 'efectivo' | 'tarjeta' | 'saldo_rfid' | null) => void
  getTotal: () => number
  resetVenta: () => void
  cerrarCaja: () => void
}

export const usePOSStore = create<POSStore>((set, get) => ({
  cajaId: null,
  cajaNombre: null,
  cajaTipo: null,
  clienteActual: null,
  itemsVenta: [],
  metodoPago: null,

  setCaja: (id, nombre, tipo) => set({ cajaId: id, cajaNombre: nombre, cajaTipo: tipo }),
  setCliente: (cliente) => set({ clienteActual: cliente, metodoPago: null }),
  
  addProducto: (producto) => set((state) => {
    const existe = state.itemsVenta.find(i => i.productoId === producto.productoId)
    if (existe) {
      return {
        itemsVenta: state.itemsVenta.map(i => 
          i.productoId === producto.productoId ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }
    }
    return { itemsVenta: [...state.itemsVenta, { ...producto, cantidad: 1 }] }
  }),

  removeProducto: (productoId) => set((state) => ({
    itemsVenta: state.itemsVenta.filter(i => i.productoId !== productoId)
  })),

  updateCantidad: (productoId, cantidad) => set((state) => {
    if (cantidad <= 0) {
      return { itemsVenta: state.itemsVenta.filter(i => i.productoId !== productoId) }
    }
    return {
      itemsVenta: state.itemsVenta.map(i => 
        i.productoId === productoId ? { ...i, cantidad } : i
      )
    }
  }),

  setMetodoPago: (metodo) => set({ metodoPago: metodo }),

  getTotal: () => {
    const { itemsVenta } = get()
    return itemsVenta.reduce((acc, item) => acc + (item.precio * item.cantidad), 0)
  },

  resetVenta: () => set({ itemsVenta: [], clienteActual: null, metodoPago: null }),
  
  cerrarCaja: () => set({ cajaId: null, cajaNombre: null, cajaTipo: null, itemsVenta: [], clienteActual: null, metodoPago: null })
}))
