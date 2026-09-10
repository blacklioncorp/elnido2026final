import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!_resend) _resend = new Resend(key)
  return _resend
}

/**
 * Envía una alerta automática por correo al administrador cuando ocurre un error crítico.
 * Best-effort: nunca interrumpe el flujo principal si el envío falla.
 */
export async function notificarErrorAdmin(error: Error | unknown, contexto: string): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL
  if (!adminEmail) return

  const resend = getResend()
  if (!resend) return

  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorStack = error instanceof Error ? error.stack : ''
  const timestamp = new Date().toLocaleString('es-MX', { timeZone: 'America/Mexico_City' })
  const from = process.env.RESEND_FROM ?? 'El Nido <onboarding@resend.dev>'

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#0B2B26;color:#F7F3E8;padding:28px;border-radius:14px;max-width:600px;margin:auto">
      <h2 style="color:#D4A843;margin:0 0 12px">⚠️ Alerta de Error: ${contexto}</h2>
      <p style="margin:0 0 8px;font-size:14px"><strong>Fecha y hora:</strong> ${timestamp} (CDMX)</p>
      <div style="background:#1A4A3A;padding:16px;border-radius:8px;font-family:monospace;font-size:13px;color:#fff;overflow-x:auto;white-space:pre-wrap;margin:16px 0">
${errorMessage}${errorStack ? `\n\nStack:\n${errorStack}` : ''}
      </div>
      <p style="margin:16px 0 0;font-size:12px;color:#F7F3E880">Sistema de alertas automáticas — El Nido 2026</p>
    </div>
  `

  try {
    await resend.emails.send({
      from,
      to: adminEmail,
      subject: `⚠️ Error en El Nido: ${contexto}`,
      html,
    })
  } catch (err) {
    console.error('Error al enviar notificación al admin:', err)
  }
}
