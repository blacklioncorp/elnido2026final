// Integración con Facebook / Meta (Pixel y compartir)
// TODO: Agregar NEXT_PUBLIC_FACEBOOK_PIXEL_ID en .env.local

export const FB_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID ?? "";

export type FBEventName =
  | "PageView"
  | "Donate"
  | "InitiateCheckout"
  | "Purchase"
  | "Lead"
  | "CompleteRegistration";

// TODO: Habilitar cuando FB SDK esté cargado en el cliente
// declare global { interface Window { fbq?: (...args: unknown[]) => void } }

export function trackEvent(event: FBEventName, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  // if (window.fbq) window.fbq("track", event, params);
  if (process.env.NODE_ENV === "development") {
    console.log("[FB Pixel]", event, params);
  }
}
