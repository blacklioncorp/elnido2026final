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

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";

  let d: Date;
  if (typeof date === "string") {
    // Si es formato YYYY-MM-DD o YYYY/MM/DD (fecha pura sin hora)
    const match = date.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (match) {
      const [, y, m, day] = match;
      d = new Date(Number(y), Number(m) - 1, Number(day), 12, 0, 0);
    } else {
      d = new Date(date);
    }
  } else {
    d = date;
  }

  if (isNaN(d.getTime())) return "";

  return new Intl.DateTimeFormat("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(d);
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
 * Devuelve la URL de imagen optimizada.
 * - Imágenes antiguas (con -original.webp): convierte al tamaño solicitado (-card / -large).
 * - Imágenes nuevas (subidas con el sistema actual): ya vienen optimizadas, se devuelven tal cual.
 */
export function getOptimizedUrl(originalUrl: string | null | undefined, _size: 'card' | 'large'): string {
  if (!originalUrl) return ''

  // Variantes antiguas ya procesadas: devolver sin cambios
  if (originalUrl.includes('-card.webp') || originalUrl.includes('-large.webp')) {
    return originalUrl
  }

  try {
    const url = new URL(originalUrl)
    const pathname = url.pathname

    // Solo las imágenes antiguas tienen el sufijo -original.webp → convertir al tamaño pedido
    if (pathname.endsWith('-original.webp')) {
      url.pathname = pathname.replace('-original.webp', `-${_size}.webp`)
      return url.toString()
    }

    // Imágenes nuevas: una sola versión optimizada, devolver la URL original intacta
    return originalUrl
  } catch {
    // Si no es URL válida y tiene -original, intentar reemplazo por string
    if (originalUrl.endsWith('-original.webp')) {
      return originalUrl.replace('-original.webp', `-${_size}.webp`)
    }
    return originalUrl
  }
}
