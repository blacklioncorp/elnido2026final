import Stripe from 'stripe'

// Inicialización perezosa: el import nunca falla aunque falte la key;
// el error solo surge al usar Stripe sin configurarlo.
let _stripe: Stripe | null = null

export function getStripe(): Stripe {
  if (!_stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error(
        'STRIPE_SECRET_KEY no está configurada. Añádela en .env.local',
      )
    }
    _stripe = new Stripe(key)
  }
  return _stripe
}
