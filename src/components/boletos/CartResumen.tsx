'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { toast } from 'sonner'
import { Loader2, ShoppingCart, Trash2, X, AlertCircle } from 'lucide-react'
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

  const faltanDatos =
    items.length === 0 ||
    (requiereFecha && !fechaVisita) ||
    !nombre.trim() ||
    !email.trim()

  const proceder = async () => {
    if (items.length === 0) return
    if (requiereFecha && !fechaVisita) {
      toast.error('📅 Selecciona la fecha de tu visita para continuar')
      const el = document.getElementById('fecha-visita-card')
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        const input = document.getElementById('fecha-visita')
        if (input) input.focus()
      }
      setOpen(false)
      return
    }
    if (!nombre.trim() || !email.trim()) {
      toast.error('Ingresa tu nombre y correo')
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
    <div className="flex h-full max-h-[90dvh] flex-col overflow-hidden bg-white">
      {/* Header fijo */}
      <div className="flex shrink-0 items-center justify-between border-b border-forest-green-dark/10 p-4 bg-white">
        <h2 className="flex items-center gap-2 text-lg font-bold text-forest-green-dark">
          <ShoppingCart className="h-5 w-5 text-forest-green-dark" /> Tu carrito
        </h2>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="p-1 rounded-lg text-forest-green-dark/60 hover:text-forest-green-dark hover:bg-forest-green-dark/5 transition-colors md:hidden"
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
          {/* Contenido con scroll vertical */}
          <div className="flex-1 min-h-0 space-y-4 overflow-y-auto p-4 overscroll-contain">
            {/* Banner de validación de fecha */}
            {requiereFecha && !fechaVisita ? (
              <div 
                onClick={() => {
                  setOpen(false)
                  const el = document.getElementById('fecha-visita-card')
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    const input = document.getElementById('fecha-visita')
                    if (input) input.focus()
                  }
                }}
                className="flex items-center gap-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 p-3 text-xs font-bold text-amber-900 cursor-pointer hover:bg-amber-500/20 transition-colors"
              >
                <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
                <span>⚠️ Falta seleccionar la fecha de tu visita. Toca aquí para elegirla.</span>
              </div>
            ) : fechaVisita ? (
              <p className="rounded-lg bg-quetzal-blue/10 px-3 py-2 text-sm text-forest-green-dark flex items-center justify-between">
                <span>Visita: <strong>{formatDate(fechaVisita)}</strong></span>
                <span className="text-xs text-emerald-700 font-semibold">✓ Fecha elegida</span>
              </p>
            ) : null}

            <div className="space-y-3">
              {items.map((item) => (
                <div key={item.tipoProductoId} className="flex gap-3 bg-forest-green-dark/[0.02] p-2.5 rounded-xl border border-forest-green-dark/5">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-forest-green-dark">
                      {item.nombre}
                    </p>
                    <p className="text-xs text-forest-green-dark/60">
                      {formatCurrency(item.precio)} c/u
                    </p>
                    <div className="mt-1.5 flex items-center gap-2 text-sm">
                      <button
                        type="button"
                        onClick={() =>
                          updateCantidad(item.tipoProductoId, item.cantidad - 1)
                        }
                        className="h-6 w-6 rounded border border-forest-green-dark/20 text-forest-green-dark hover:bg-forest-green-dark/5 flex items-center justify-center font-bold"
                      >
                        −
                      </button>
                      <span className="w-5 text-center text-forest-green-dark font-medium">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          updateCantidad(item.tipoProductoId, item.cantidad + 1)
                        }
                        className="h-6 w-6 rounded border border-forest-green-dark/20 text-forest-green-dark hover:bg-forest-green-dark/5 flex items-center justify-center font-bold"
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
                      className="text-forest-green-dark/40 hover:text-red-500 transition-colors p-1"
                      aria-label="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

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
              <label className="flex items-center gap-2 text-xs text-forest-green-dark/70 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={aceptaWhatsapp}
                  onChange={(e) => setAceptaWhatsapp(e.target.checked)}
                />
                Quiero recibir avisos por WhatsApp
              </label>
              <label className="flex items-center gap-2 text-xs text-forest-green-dark/70 cursor-pointer">
                <input
                  type="checkbox"
                  checked={aceptaNewsletter}
                  onChange={(e) => setAceptaNewsletter(e.target.checked)}
                />
                Suscribirme al boletín
              </label>
            </div>
          </div>

          {/* Footer FIXED / Sticky abajo */}
          <div className="shrink-0 sticky bottom-0 bg-white border-t border-forest-green-dark/10 p-4 space-y-3 shadow-[0_-4px_16px_rgba(0,0,0,0.06)]">
            <div className="space-y-1 text-sm text-forest-green-dark">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>{formatCurrency(subtotal)}</span>
              </div>
              {descuentoAplicado > 0 && (
                <div className="flex justify-between text-conservation-gold font-semibold">
                  <span>Descuento ({descuentoAplicado}%)</span>
                  <span>−{formatCurrency(subtotal - total)}</span>
                </div>
              )}
              <div className="flex justify-between border-t border-forest-green-dark/10 pt-1 text-base font-bold">
                <span>Total</span>
                <span className="font-extrabold text-forest-green-dark">{formatCurrency(total)}</span>
              </div>
            </div>
            <button
              type="button"
              onClick={proceder}
              disabled={loading || faltanDatos}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-conservation-gold py-3 font-bold text-forest-green-dark transition-all hover:scale-[1.01] hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed shadow-md cursor-pointer text-sm"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" /> Redirigiendo…
                </>
              ) : requiereFecha && !fechaVisita ? (
                '📅 Selecciona la fecha de visita'
              ) : !nombre.trim() || !email.trim() ? (
                'Completa tu nombre y correo'
              ) : (
                `Proceder al Pago (${formatCurrency(total)})`
              )}
            </button>
            <button
              type="button"
              onClick={clear}
              className="w-full text-center text-xs text-forest-green-dark/50 hover:text-red-500 transition-colors cursor-pointer"
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
        <div className="sticky top-24 max-h-[calc(100dvh-7rem)] flex flex-col overflow-hidden rounded-2xl border border-forest-green-dark/10 bg-white shadow-xl backdrop-blur">
          {contenido}
        </div>
      </aside>

      {/* Botón flotante en móvil */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-4 left-4 right-4 z-20 flex items-center justify-between rounded-full bg-conservation-gold px-6 py-3 font-semibold text-forest-green-dark shadow-lg md:hidden"
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
            className="fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm md:hidden"
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-h-[90dvh] flex flex-col overflow-hidden rounded-t-2xl bg-white shadow-2xl"
            >
              {contenido}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
