'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DONATION_AMOUNTS } from '@/lib/payments'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { Shield, Heart, Leaf, Loader2 } from 'lucide-react'
import { createDonacionGenericaCheckout } from '@/app/actions/donaciones'

function DonationForm({ amount }: { amount: number }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [esRecurrente, setEsRecurrente] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (amount <= 0) {
      toast.error('El monto debe ser mayor a cero.')
      return
    }

    setLoading(true)
    
    const result = await createDonacionGenericaCheckout({
      nombre: name,
      email: email,
      monto: amount,
      esRecurrente,
    })

    if ('error' in result) {
      toast.error(result.error)
      setLoading(false)
      return
    }

    // Redirigir a Stripe Checkout
    router.push(result.url)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-off-white/80 mb-1.5">Nombre Completo</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tu nombre"
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-conservation-gold focus:outline-none focus:ring-1 focus:ring-conservation-gold text-off-white placeholder-off-white/30 transition-colors"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-off-white/80 mb-1.5">Correo Electrónico</label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@correo.com"
          className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-conservation-gold focus:outline-none focus:ring-1 focus:ring-conservation-gold text-off-white placeholder-off-white/30 transition-colors"
        />
      </div>

      <div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={esRecurrente}
            onChange={(e) => setEsRecurrente(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-white/20 bg-white/10 text-conservation-gold focus:ring-conservation-gold accent-conservation-gold flex-shrink-0"
          />
          <div className="flex-1">
            <span className="block font-bold text-off-white mb-0.5">
              ☑️ Hacer este donativo mensual
            </span>
            <span className="block text-xs text-off-white/60 leading-relaxed">
              Tu donativo se renovará automáticamente cada mes. Puedes cancelar cuando quieras.
            </span>
          </div>
        </label>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 bg-conservation-gold hover:bg-conservation-gold/90 disabled:opacity-60 text-forest-green-dark font-extrabold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-conservation-gold/20 text-lg flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <Loader2 className="animate-spin h-5 w-5" />
            Procesando...
          </span>
        ) : (
          <>
            <Heart className="h-5 w-5" />
            {esRecurrente ? `Donar ${formatCurrency(amount)}/mes` : `Donar ${formatCurrency(amount)}`}
          </>
        )}
      </button>
    </form>
  )
}

export default function DonarPage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(500)
  const [customAmount, setCustomAmount] = useState('')

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : selectedAmount

  return (
    <div className="min-h-screen py-20 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10">
          <p className="text-conservation-gold font-semibold tracking-widest uppercase text-sm mb-3">Marca la Diferencia</p>
          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tighter text-off-white mb-4">Haz Tu Donación</h1>
          <p className="text-off-white/60 text-lg">Tu apoyo protege vidas y hábitats.</p>
        </div>

        <div className="bg-forest-green-light/40 backdrop-blur-xl rounded-3xl border border-white/10 shadow-2xl overflow-hidden">
          {/* Impact banner */}
          <div className="bg-conservation-gold/10 border-b border-white/10 px-8 py-5">
            <div className="grid grid-cols-3 gap-4 text-center">
              {[
                { icon: <Leaf className="h-5 w-5 mx-auto mb-1 text-conservation-gold" />, label: '100% para conservación' },
                { icon: <Shield className="h-5 w-5 mx-auto mb-1 text-conservation-gold" />, label: 'Pago seguro con Stripe' },
                { icon: <Heart className="h-5 w-5 mx-auto mb-1 text-conservation-gold" />, label: 'Impacto directo' },
              ].map((item) => (
                <div key={item.label}>
                  {item.icon}
                  <p className="text-xs text-off-white/70">{item.label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-8">
            {/* Amount selection */}
            <div className="mb-8">
              <h2 className="text-sm font-semibold text-off-white/60 uppercase tracking-widest mb-4">Selecciona el Monto (MXN)</h2>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {DONATION_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => { setSelectedAmount(amount); setCustomAmount('') }}
                    className={`py-3 rounded-xl font-bold text-lg transition-all duration-200 ${selectedAmount === amount && !customAmount
                      ? 'bg-conservation-gold text-forest-green-dark scale-105 shadow-md shadow-conservation-gold/30'
                      : 'bg-white/10 text-off-white hover:bg-white/20 border border-white/10'
                      }`}
                  >
                    ${amount}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                placeholder="Otro monto..."
                value={customAmount}
                onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(0) }}
                className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-conservation-gold focus:outline-none focus:ring-1 focus:ring-conservation-gold text-off-white placeholder-off-white/30 transition-colors"
              />
            </div>

            <DonationForm amount={finalAmount} />
          </div>
        </div>
      </div>
    </div>
  )
}
