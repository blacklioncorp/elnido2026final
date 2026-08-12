'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Loader2, ShoppingCart, Trash2, X } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { formatCurrency, formatDate } from '@/lib/utils'
import { createCheckoutSession } from '@/app/actions/checkout'
import CuponInput from './CuponInput'

export default function CartResumen() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [telefono, setTelefono] = useState('')
  const [aceptaWhatsapp, setAceptaWhatsapp] = useState(false)
  const [aceptaNewsletter, setAceptaNewsletter] = useState(false)

  const items = useCartStore((s) => s.items)
  const fechaVisita = useCartStore((s) => s.fechaVisita)
  const codigoDescuento = useCartStore((s) => s.codigoDescuento)
  const descuentoAplicado = useCartStore((s) => s.descuentoAplicado)
  const updateCantidad = useCartStore((s) => s.updateCantidad)
  const removeItem = useCartStore((s) => s.removeItem)
  const clear = useCartStore((s) => s.clear)
  const getSubtotal = useCartStore((s) => s.getSubtotal)
  const getTotal = useCartStore((s) => s.getTotal)
  const getCantidadTotal = useCartStore((s) => s.getCantidadTotal)

  const subtotal = getSubtotal()
  const total = getTotal()
  const cantidad = getCantidadTotal()
  const requiereFecha = items.some(
    (i) => i.categoria === 'entrada' || i.categoria === 'paquete_familiar',
  )

  const proceder = async () => {
    if (items.length === 0) return
    if (!nombre.trim() || !email.trim()) {
      toast.error('Ingresa tu nombre y correo')
      return
    }
    if (requiereFecha && !fechaVisita) {
      toast.error('Selecciona la fecha de tu visita')
      return
    }
    setLoading(true)
    const res = await createCheckoutSession({
      items: items.map((i) => ({
        tipoProductoId: i.tipoProductoId,
        nombre: i.nombre,
        precio: i.precio,
        cantidad: i.cantidad,
        categoria: i.categoria,
      })),
      fechaVisita,
      clienteEmail: email.trim(),
      clienteNombre: nombre.trim(),
      clienteTelefono: telefono.trim() || null,
      aceptaWhatsapp,
      aceptaNewsletter,
      codigoDescuento,
      descuentoAplicado,
    })
    if ('url' in res) {
      window.location.href = res.url
    } else {
      toast.error(res.error)
      setLoading(false)
    }
  }

  const contenido = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-forest-green-dark/10 p-4">
        <h2 className="flex items-center gap-2 text-lg font-bold text-forest-green-dark">
          <ShoppingCart className="h-5 w-5" /> Tu carrito
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-forest-green-dark/50 md:hidden"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 p-8 text-center">
          <ShoppingCart className="h-12 w-12 text-forest-green-dark/20" />
          <p className="text-sm text-forest-green-dark/60">
            Agrega entradas o membresías para comenzar
          </p>
        </div>
      ) : (
        <>
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {fechaVisita && (
              <p className="rounded-lg bg-quetzal-blue/10 px-3 py-2 text-sm text-forest-green-dark">
                Visita: <strong>{formatDate(fechaVisita)}</strong>
              </p>
            )}

            {items.map((item) => (
              <div key={item.tipoProductoId} className="flex gap-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-forest-green-dark">
                    {item.nombre}
                  </p>
                  <p className="text-xs text-forest-green-dark/60">
                    {formatCurrency(item.precio)} c/u
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={() =>
                        updateCantidad(item.tipoProductoId, item.cantidad - 1)
                      }
                      className="h-6 w-6 rounded border border-forest-green-dark/20 text-forest-green-dark"
                    >
                      −
                    </button>
                    <span className="w-5 text-center text-forest-green-dark">
                      {item.cantidad}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        updateCantidad(item.tipoProductoId, item.cantidad + 1)
                      }
                      className="h-6 w-6 rounded border border-forest-green-dark/20 text-forest-green-dark"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="flex flex-col items-end justify-between">
                  <span className="text-sm font-bold text-forest-green-dark">
                    {formatCurrency(item.precio * item.cantidad)}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(item.tipoProductoId)}
                    className="text-forest-green-dark/40 hover:text-red-500"
                    aria-label="Eliminar"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}

            {/* Cupón */}
            <div className="border-t border-forest-green-dark/10 pt-4">
              <CuponInput />
            </div>

            {/* Datos del cliente */}
            <div className="space-y-2 border-t border-forest-green-dark/10 pt-4">
              <input
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Nombre completo"
                className="w-full rounded-lg border border-forest-green-dark/15 bg-white px-3 py-2 text-sm text-forest-green-dark placeholder:text-forest-green-dark/40 focus:border-quetzal-blue focus:outline-none"
              />
              <input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="Correo electrónico"
                className="w-full rounded-lg border border-forest-green-dark/15 bg-white px-3 py-2 text-sm text-forest-green-dark placeholder:text-forest-green-dark/40 focus:border-quetzal-blue focus:outline-none"
              />
              <input
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                type="tel"
                placeholder="Teléfono (opcional)"
                className="w-full rounded-lg border border-forest-green-dark/15 bg-white px-3 py-2 text-sm text-forest-green-dark placeholder:text-forest-green-dark/40 focus:border-quetzal-blue focus:outline-none"
              />
              <label className="flex items-center gap-2 text-xs text-forest-green-dark/70">
                <input
                  type="checkbox"
                  checked={aceptaWhatsapp}
                  onChange={(e) => setAceptaWhatsapp(e.target.checked)}
                />
                Quiero recibir avisos por WhatsApp
              </label>
              <label className="flex items-center gap-2 text-xs text-forest-green-dark/70">
                <input
                  type="checkbox"
                  checked={aceptaNewsletter}
                  onChange={(e) => setAceptaNewsletter(e.target.checked)}
                />
                Suscribirme al boletín
              </label>
            </div>
          </div>

          {/* Totales + acciones */}
          <div className="space-y-3 border-t border-forest-green-dark/10 p-4">
            <div className="space-y-1 text-sm text-forest-green-dark">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {descuentoAplicado > 0 && (
                <div className="flex justify-between text-conservation-gold">
                  <span>Descuento ({descuentoAplicado}%)</span>
                  <span>−{formatCurrency(subtotal - total)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-forest-green-dark/10 pt-1 text-base font-bold">
                <span>Total</span>
                <span>{formatCurrency(total)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={proceder}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-conservation-gold py-3 font-semibold text-forest-green-dark transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Redirigiendo…
                </>
              ) : (
                'Proceder al Pago'
              )}
            </button>
            <button
              type="button"
              onClick={clear}
              className="w-full text-center text-xs text-forest-green-dark/50 hover:text-red-500"
            >
              Vaciar carrito
            </button>
          </div>
        </>
      )}
    </div>
  )

  return (
    <>
      {/* Panel lateral en escritorio */}
      <aside className="hidden md:block">
        <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-hidden rounded-2xl border border-forest-green-dark/10 bg-white/70 shadow-xl backdrop-blur">
          {contenido}
        </div>
      </aside>

      {/* Botón flotante en móvil */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 right-4 z-40 flex items-center justify-between rounded-full bg-conservation-gold px-6 py-3 font-semibold text-forest-green-dark shadow-lg md:hidden"
      >
        <span className="flex items-center gap-2">
          <ShoppingCart className="h-5 w-5" /> Ver carrito ({cantidad})
        </span>
        <span>{formatCurrency(total)}</span>
      </button>

      {/* Drawer inferior en móvil */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-50 bg-black/40 md:hidden"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-hidden rounded-t-2xl bg-off-white"
            >
              {contenido}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
