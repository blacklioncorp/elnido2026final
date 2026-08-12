export class RateLimiter {
  private store = new Map<string, { count: number; firstRequestTime: number }>()

  constructor(
    private readonly windowMs: number,
    private readonly maxRequests: number
  ) {}

  check(ip: string): { success: boolean; limit: number; remaining: number; reset: number } {
    const now = Date.now()
    const record = this.store.get(ip)

    if (!record) {
      this.store.set(ip, { count: 1, firstRequestTime: now })
      return { success: true, limit: this.maxRequests, remaining: this.maxRequests - 1, reset: now + this.windowMs }
    }

    if (now > record.firstRequestTime + this.windowMs) {
      // Ventana expirada, resetear
      this.store.set(ip, { count: 1, firstRequestTime: now })
      return { success: true, limit: this.maxRequests, remaining: this.maxRequests - 1, reset: now + this.windowMs }
    }

    if (record.count >= this.maxRequests) {
      // Excedido
      return { success: false, limit: this.maxRequests, remaining: 0, reset: record.firstRequestTime + this.windowMs }
    }

    // Incrementar
    record.count += 1
    this.store.set(ip, record)
    return { success: true, limit: this.maxRequests, remaining: this.maxRequests - record.count, reset: record.firstRequestTime + this.windowMs }
  }

  // Opcional: limpiar entradas antiguas periódicamente para no llenar la memoria
  cleanup() {
    const now = Date.now()
    for (const [ip, record] of this.store.entries()) {
      if (now > record.firstRequestTime + this.windowMs) {
        this.store.delete(ip)
      }
    }
  }
}

// Instancias globales para los distintos Server Actions
export const donacionesLimiter = new RateLimiter(60 * 1000, 5) // 5 por minuto
export const cotizacionesLimiter = new RateLimiter(60 * 60 * 1000, 3) // 3 por hora
export const loginLimiter = new RateLimiter(5 * 60 * 1000, 10) // 10 por 5 minutos

// Iniciar un timer de limpieza cada hora
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    donacionesLimiter.cleanup()
    cotizacionesLimiter.cleanup()
    loginLimiter.cleanup()
  }, 60 * 60 * 1000)
}
