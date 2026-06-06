// Integración con Stripe
// TODO: Agregar NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY y STRIPE_SECRET_KEY en .env.local

export const STRIPE_PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";

export const DONATION_AMOUNTS = [100, 200, 500, 1000] as const;
export type DonationAmount = (typeof DONATION_AMOUNTS)[number];

export interface DonationPayload {
  amount: number; // en centavos (MXN)
  donorName: string;
  donorEmail: string;
  speciesId?: string;
  message?: string;
}

// TODO: Implementar con Stripe SDK en server action
// import Stripe from "stripe";
// const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
// export async function createPaymentIntent(payload: DonationPayload) { ... }
