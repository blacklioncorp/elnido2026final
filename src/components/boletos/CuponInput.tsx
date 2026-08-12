'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Check, Loader2, Tag, X } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { useCartStore } from '@/store/cart-store'

export default function CuponInput() {
  const [codigo, setCodigo] = useState('')
  const [loading, setLoading] = useState(false)
  const codigoDescuento = useCartStore((s) => s.codigoDescuento)
  const descuentoAplicado = useCartStore((s) => s.descuentoAplicado)
  const setCodigoDescuento = useCartStore((s) => s.setCodigoDescuento)

  const aplicar = async () => {
    const code = codigo.trim().toUpperCase()
    if (!code) return
    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase
      .from('campanas')
      .select('*')
      .eq('codigo_descuento', code)
      .eq('activa', true)
      .maybeSingle()
    setLoading(false)

    const ahora = Date.now()
    const expirado =
      !!data &&
      ((data.fecha_inicio && new Date(data.fecha_inicio).getTime() > ahora) ||
        (data.fecha_fin && new Date(data.fecha_fin).getTime() < ahora))

    if (error || !data || !data.porcentaje_descuento || expirado) {
      toast.error('Código inválido o expirado')
      return
    }

    setCodigoDescuento(code, Number(data.porcentaje_descuento))
    toast.success(`${data.porcentaje_descuento}% de descuento aplicado`)
    setCodigo('')
  }

  if (codigoDescuento) {
    return (
      <div className="flex items-center justify-between rounded-lg border border-conservation-gold/50 bg-conservation-gold/10 px-3 py-2">
        <span className="flex items-center gap-2 text-sm text-forest-green-dark">
          <Check className="h-4 w-4 text-conservation-gold" />
          <span className="font-semibold">{codigoDescuento}</span>
          <span className="text-forest-green-dark/60">−{descuentoAplicado}%</span>
        </span>
        <button
          type="button"
          onClick={() => setCodigoDescuento(null, 0)}
          className="text-forest-green-dark/50 transition-colors hover:text-forest-green-dark"
          aria-label="Quitar código"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <Tag className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-forest-green-dark/40" />
        <input
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && aplicar()}
          placeholder="Código de descuento"
          className="w-full rounded-lg border border-forest-green-dark/15 bg-white py-2 pl-9 pr-3 text-sm text-forest-green-dark placeholder:text-forest-green-dark/40 focus:border-quetzal-blue focus:outline-none"
        />
      </div>
      <button
        type="button"
        onClick={aplicar}
        disabled={loading}
        className="rounded-lg bg-forest-green-dark px-4 py-2 text-sm font-semibold text-off-white transition-colors hover:bg-forest-green-light disabled:opacity-60"
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aplicar'}
      </button>
    </div>
  )
}
