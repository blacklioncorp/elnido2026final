import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "MXN"): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function sanitizeHtml(text: string): string {
  if (!text) return text;
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
    .replace(/javascript:/gi, '');
}

/**
 * Deduce la URL de la versión WebP optimizada (card o large) a partir de la original.
 * Ej: https://.../especies/123.jpg -> https://.../especies/123-card.webp
 */
export function getOptimizedUrl(originalUrl: string | null | undefined, size: 'card' | 'large'): string {
  if (!originalUrl) return ''
  // Si ya es un webp con -card o -large, no lo tocamos
  if (originalUrl.includes('-card.webp') || originalUrl.includes('-large.webp')) {
    return originalUrl
  }
  
  try {
    const url = new URL(originalUrl)
    const pathname = url.pathname
    const lastDotIndex = pathname.lastIndexOf('.')
    if (lastDotIndex !== -1) {
      const pathWithoutExt = pathname.substring(0, lastDotIndex)
      url.pathname = `${pathWithoutExt}-${size}.webp`
      return url.toString()
    }
  } catch (e) {
    // Si no es URL válida o falla el parsing, intentamos por regex básico
    return originalUrl.replace(/\.[^/.]+$/, `-${size}.webp`)
  }
  return originalUrl
}
