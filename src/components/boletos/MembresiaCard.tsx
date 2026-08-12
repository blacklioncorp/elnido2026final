'use client'

import { motion } from 'framer-motion'
import { Check, Ticket, Wallet, Percent } from 'lucide-react'
import { useCartStore } from '@/store/cart-store'
import { formatCurrency } from '@/lib/utils'
import { getMetadata, type TipoProducto } from '@/lib/boletos'

export default function MembresiaCard({
  membresia,
}: {
  membresia: TipoProducto
}) {
  const items = useCartStore((s) => s.items)
  const addItem = useCartStore((s) => s.addItem)

  const meta = getMetadata(membresia)
  const esPremium = membresia.nombre.toLowerCase().includes('premium')
  const enCarrito = items.some((i) => i.tipoProductoId === membresia.id)

  const beneficios = [
    {
      icon: Ticket,
      texto:
        meta.accesos === 1
          ? '1 acceso incluido'
          : `${meta.accesos} accesos incluidos`,
    },
    {
      icon: Wallet,
      texto: `${formatCurrency(meta.saldo ?? 0)} de saldo para consumo`,
    },
    {
      icon: Percent,
      texto: `${meta.descuento_eventos ?? 15}% de descuento en eventos y talleres`,
    },
  ]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4 }}
      className={`relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm ${
        esPremium
          ? 'border-conservation-gold shadow-conservation-gold/20'
          : 'border-forest-green-dark/10'
      }`}
    >
      {esPremium && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-conservation-gold px-4 py-1 text-xs font-bold uppercase tracking-wide text-forest-green-dark">
          Más popular
        </span>
      )}

      <h3 className="text-xl font-bold text-forest-green-dark">
        {membresia.nombre}
      </h3>
      {membresia.descripcion && (
        <p className="mt-1 text-sm text-forest-green-dark/60">
          {membresia.descripcion}
        </p>
      )}

      <ul className="mt-5 space-y-3">
        {beneficios.map(({ icon: Icon, texto }, i) => (
          <li
            key={i}
            className="flex items-center gap-3 text-sm text-forest-green-dark"
          >
            <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-quetzal-blue/10">
              <Icon className="h-4 w-4 text-quetzal-blue" />
            </span>
            {texto}
          </li>
        ))}
      </ul>

      <p className="mt-6 text-4xl font-extrabold text-quetzal-blue">
        {formatCurrency(Number(membresia.precio))}
        <span className="text-base font-medium text-forest-green-dark/50">
          {' '}
          / año
        </span>
      </p>

      <button
        type="button"
        disabled={enCarrito}
        onClick={() =>
          addItem({
            tipoProductoId: membresia.id,
            nombre: membresia.nombre,
            precio: Number(membresia.precio),
            categoria: membresia.categoria,
            metadata: membresia.metadata,
          })
        }
        className={`mt-6 flex items-center justify-center gap-2 rounded-full px-6 py-3 font-semibold transition-all ${
          enCarrito
            ? 'cursor-default bg-forest-green-light/10 text-forest-green-light'
            : 'bg-conservation-gold text-forest-green-dark hover:scale-[1.02]'
        }`}
      >
        {enCarrito ? (
          <>
            <Check className="h-5 w-5" /> Agregado
          </>
        ) : (
          'Quiero ser Guardián'
        )}
      </button>
    </motion.div>
  )
}
