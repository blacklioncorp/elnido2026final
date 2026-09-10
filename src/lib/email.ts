import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!_resend) _resend = new Resend(key)
  return _resend
}

interface EmailConfirmacionParams {
  to: string
  nombre: string
  producto: string
  esMembresia: boolean
  qrDataUrl: string
}

/**
 * Envía el correo de confirmación con el QR adjunto. Best-effort: si Resend
 * no está configurado o falla, no interrumpe el flujo de confirmación.
 */
export async function enviarEmailConfirmacion(
  params: EmailConfirmacionParams,
): Promise<void> {
  const resend = getResend()
  if (!resend) return

  const { to, nombre, producto, esMembresia, qrDataUrl } = params
  const from = process.env.RESEND_FROM ?? 'El Nido <onboarding@resend.dev>'

  const instruccion = esMembresia
    ? 'Preséntate en taquilla con este QR para recibir y activar tu pulsera Guardián.'
    : 'Muestra este QR en taquilla el día de tu visita.'

  // El QR llega como data URL (base64); se adjunta como PNG.
  const base64 = qrDataUrl.replace(/^data:image\/png;base64,/, '')

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#0B2B26;color:#F7F3E8;padding:32px;border-radius:16px;max-width:520px;margin:auto">
      <h1 style="color:#D4A843;margin:0 0 8px">¡Gracias, ${nombre}!</h1>
      <p style="margin:0 0 16px">Tu compra de <strong>${producto}</strong> se completó con éxito.</p>
      <div style="background:#1A4A3A;padding:20px;border-radius:12px;text-align:center">
        <img src="cid:qr-elnido" alt="Código QR" width="220" height="220" style="background:#fff;padding:8px;border-radius:8px" />
        <p style="margin:16px 0 0;font-size:14px">${instruccion}</p>
      </div>
      <p style="margin:24px 0 0;font-size:12px;color:#F7F3E899">El Nido — Santuario de Fauna Mexicana</p>
    </div>
  `

  try {
    await resend.emails.send({
      from,
      to,
      subject: `Tu ${esMembresia ? 'membresía' : 'entrada'} en El Nido 🪶`,
      html,
      attachments: [
        {
          filename: 'boleto-elnido.png',
          content: base64,
          contentId: 'qr-elnido',
        },
      ],
    })
  } catch {
    // Silencioso: la confirmación en pantalla no depende del email.
  }
}
