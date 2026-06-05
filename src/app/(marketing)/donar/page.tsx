'use client'

import { useState } from 'react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js'
import { STRIPE_PUBLISHABLE_KEY, DONATION_AMOUNTS } from '@/lib/payments'
import { formatCurrency } from '@/lib/utils'
import { toast } from 'sonner'
import { Shield, Heart, Leaf } from 'lucide-react'

// Load stripe - key will be empty in demo mode
const stripePromise = STRIPE_PUBLISHABLE_KEY
  ? loadStripe(STRIPE_PUBLISHABLE_KEY)
  : null

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      fontSize: '16px',
      color: '#F7F3E8',
      fontFamily: '"Inter", sans-serif',
      '::placeholder': { color: '#F7F3E8' + '60' },
      iconColor: '#D4A843',
    },
    invalid: { color: '#ef4444', iconColor: '#ef4444' },
  },
}

function DonationForm({ amount }: { amount: number }) {
  const stripe = useStripe()
  const elements = useElements()
  const [loading, setLoading] = useState(false)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!stripe || !elements) {
      toast.error('Stripe no está disponible. Configura NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.')
      return
    }
    setLoading(true)
    // TODO: Crear PaymentIntent desde el servidor y confirmar aquí
    // const { error, paymentMethod } = await stripe.createPaymentMethod({ ... })
    await new Promise((r) => setTimeout(r, 1500))
    toast.success(`¡Gracias, ${name || 'guardián'}! Tu donación de ${formatCurrency(amount)} está siendo procesada.`)
    setLoading(false)
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
        <label className="block text-sm font-medium text-off-white/80 mb-1.5">Información de Pago</label>
        <div className="px-4 py-3.5 rounded-xl bg-white/10 border border-white/20 focus-within:border-conservation-gold focus-within:ring-1 focus-within:ring-conservation-gold transition-colors">
          <CardElement options={CARD_ELEMENT_OPTIONS} />
        </div>
        {!STRIPE_PUBLISHABLE_KEY && (
          <p className="mt-2 text-xs text-conservation-gold/80 flex items-center gap-1">
            <span>⚠</span> Modo demo — configura NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY para procesar pagos reales
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full mt-2 bg-conservation-gold hover:bg-conservation-gold/90 disabled:opacity-60 text-forest-green-dark font-extrabold py-4 px-8 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-conservation-gold/20 text-lg flex items-center justify-center gap-2"
      >
        {loading ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
            </svg>
            Procesando...
          </span>
        ) : (
          <>
            <Heart className="h-5 w-5" />
            Donar {formatCurrency(amount)}
          </>
        )}
      </button>
    </form>
  )
}

export default function DonarPage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(50)
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
                { icon: <Heart className="h-5 w-5 mx-auto mb-1 text-conservation-gold" />, label: 'Recibo deducible' },
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
              <h2 className="text-sm font-semibold text-off-white/60 uppercase tracking-widest mb-4">Selecciona el Monto (USD)</h2>
              <div className="grid grid-cols-4 gap-3 mb-4">
                {DONATION_AMOUNTS.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => { setSelectedAmount(amount); setCustomAmount('') }}
                    className={`py-3 rounded-xl font-bold text-lg transition-all duration-200 ${
                      selectedAmount === amount && !customAmount
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

            {/* Stripe form */}
            <Elements stripe={stripePromise}>
              <DonationForm amount={finalAmount} />
            </Elements>
          </div>
        </div>
      </div>
    </div>
  )
}
