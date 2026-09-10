import { Resend } from 'resend'

let _resend: Resend | null = null

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  if (!_resend) _resend = new Resend(key)
  return _resend
}

const FROM = process.env.RESEND_FROM ?? 'El Nido <onboarding@resend.dev>'

/**
 * Confirmation email sent immediately to an individual donor.
 */
export async function enviarEmailConfirmacionDonacion(params: {
  to: string
  donanteNombre: string
  donanteUsername: string | null
  nombreEspecie: string
  nombreAnimal?: string | null
  monto: number
}): Promise<void> {
  const resend = getResend()
  if (!resend) return

  const { to, donanteNombre, donanteUsername, nombreEspecie, nombreAnimal, monto } = params
  const alias = donanteUsername ?? donanteNombre
  const especie = nombreAnimal ? `${nombreEspecie} (${nombreAnimal})` : nombreEspecie
  const montoFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto)

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#0B2B26;color:#F7F3E8;padding:32px;border-radius:16px;max-width:520px;margin:auto">
      <h1 style="color:#D4A843;margin:0 0 8px">¡Gracias, ${alias}! 🦜</h1>
      <p style="margin:0 0 16px">Tu donativo de <strong style="color:#D4A843">${montoFmt}</strong> para <strong>${especie}</strong> ha sido recibido con éxito.</p>
      <div style="background:#1A4A3A;padding:20px;border-radius:12px;margin-bottom:20px">
        <p style="margin:0 0 8px;font-size:14px">✅ Ya apareces en la barra de progreso como <strong>Guardián</strong>.</p>
        <p style="margin:0;font-size:14px">🌿 Tu apoyo contribuye directamente a la conservación de esta especie en El Nido.</p>
      </div>
      <div style="text-align:center;margin-bottom:24px">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://elnido2026final.vercel.app'}/donativos"
           style="background:#D4A843;color:#0B2B26;font-weight:bold;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block">
          Ver barra de progreso
        </a>
      </div>
      <p style="margin:0;font-size:12px;color:#F7F3E899">El Nido — Santuario de Fauna Mexicana</p>
    </div>
  `

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `¡Tu donativo para ${especie} fue recibido! 🐾`,
      html,
    })
  } catch {
    // Best-effort: no interrupts the payment flow
  }
}

/**
 * Batch email sent to ALL donors of a card when the goal is reached.
 */
export async function enviarEmailMetaCumplida(params: {
  emails: string[]
  nombreEspecie: string
  nombreAnimal?: string | null
  metaMonto: number
  totalDonantes: number
}): Promise<void> {
  const resend = getResend()
  if (!resend || params.emails.length === 0) return

  const { emails, nombreEspecie, nombreAnimal, metaMonto, totalDonantes } = params
  const especie = nombreAnimal ? `${nombreEspecie} (${nombreAnimal})` : nombreEspecie
  const metaFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(metaMonto)
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://elnido2026final.vercel.app'

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#0B2B26;color:#F7F3E8;padding:32px;border-radius:16px;max-width:520px;margin:auto">
      <h1 style="color:#D4A843;margin:0 0 8px">¡Lo logramos! 🎉</h1>
      <h2 style="margin:0 0 16px;font-size:20px">${especie} alcanzó su meta</h2>
      <div style="background:#1A4A3A;padding:20px;border-radius:12px;margin-bottom:20px">
        <p style="margin:0 0 8px;font-size:16px">
          Gracias a ti y a <strong>${totalDonantes}</strong> guardián${totalDonantes !== 1 ? 'es' : ''} más,
          hemos alcanzado la meta de <strong style="color:#D4A843">${metaFmt}</strong>.
        </p>
        <p style="margin:0;font-size:14px;color:#F7F3E899">Tu donativo marcó la diferencia. ¡Eres un verdadero Guardián del santuario!</p>
      </div>
      <div style="text-align:center;margin-bottom:16px">
        <a href="${base}/donativos"
           style="background:#D4A843;color:#0B2B26;font-weight:bold;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block;margin-right:8px">
          Apadrinar otra especie
        </a>
      </div>
      <p style="margin:0;font-size:12px;color:#F7F3E899">El Nido — Santuario de Fauna Mexicana</p>
    </div>
  `

  // Send individually (Resend free tier doesn't support batch to multiple)
  for (const email of emails) {
    try {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: `¡Lo logramos! ${especie} alcanzó su meta 🏆`,
        html,
      })
    } catch {
      // Continue even if one email fails
    }
  }
}

/**
 * Confirmation email for generic donations from /donar page.
 */
export async function enviarEmailConfirmacionDonacionGenerica(params: {
  to: string
  nombre: string
  monto: number
}): Promise<void> {
  const resend = getResend()
  if (!resend) return

  const { to, nombre, monto } = params
  const montoFmt = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto)

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#0B2B26;color:#F7F3E8;padding:32px;border-radius:16px;max-width:520px;margin:auto">
      <h1 style="color:#D4A843;margin:0 0 8px">¡Gracias, ${nombre}! 🌿</h1>
      <p style="margin:0 0 16px">Tu donación de <strong style="color:#D4A843">${montoFmt}</strong> al Santuario El Nido fue procesada con éxito.</p>
      <div style="background:#1A4A3A;padding:20px;border-radius:12px;margin-bottom:20px">
        <p style="margin:0;font-size:14px">100% de tu donación se destina directamente a la conservación de fauna mexicana.</p>
      </div>
      <p style="margin:0;font-size:12px;color:#F7F3E899">El Nido — Santuario de Fauna Mexicana</p>
    </div>
  `

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `¡Tu donación fue recibida! Gracias por proteger El Nido 🦜`,
      html,
    })
  } catch {
    // Best-effort
  }
}

/**
 * Email de notificación al cambiar el estado de suscripción (cancelar, pausar, reanudar).
 */
export async function enviarEmailEstadoSuscripcion(params: {
  to: string
  nombre: string
  nombreEspecie: string
  nombreAnimal?: string | null
  accion: 'cancelar' | 'pausar' | 'reanudar'
}): Promise<void> {
  const resend = getResend()
  if (!resend) return

  const { to, nombre, nombreEspecie, nombreAnimal, accion } = params
  const especie = nombreAnimal ? `${nombreEspecie} (${nombreAnimal})` : nombreEspecie

  const estadosMap = {
    cancelar: {
      titulo: 'Tu suscripción ha sido cancelada',
      estadoTexto: 'cancelada',
      descripcion: `Tu aportación recurrente para <strong>${especie}</strong> ha sido cancelada. Tu apoyo previo ha sido invaluable para el santuario y siempre tendrás las puertas abiertas como Guardián.`,
      subject: `Tu donación para ${especie} ha sido cancelada`,
      icono: '🍂',
    },
    pausar: {
      titulo: 'Tu suscripción ha sido pausada',
      estadoTexto: 'pausada temporalmente',
      descripcion: `Tu donativo recurrente para <strong>${especie}</strong> ha sido pausado. No se realizarán más cargos automáticos hasta que decidas reactivarlo desde tu panel de Guardián.`,
      subject: `Tu donación para ${especie} ha sido pausada`,
      icono: '⏸️',
    },
    reanudar: {
      titulo: '¡Tu suscripción ha sido reactivada!',
      estadoTexto: 'activa',
      descripcion: `Tu apadrinamiento para <strong>${especie}</strong> está activo nuevamente. ¡Gracias por seguir impulsando el vuelo y la conservación de nuestra fauna silvestre!`,
      subject: `Tu donación para ${especie} ha sido reanudada`,
      icono: '🌱',
    },
  }

  const info = estadosMap[accion]

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;background:#0B2B26;color:#F7F3E8;padding:32px;border-radius:16px;max-width:520px;margin:auto">
      <h1 style="color:#D4A843;margin:0 0 8px">${info.icono} ${info.titulo}</h1>
      <p style="margin:0 0 16px">Hola, <strong>${nombre}</strong>,</p>
      <div style="background:#1A4A3A;padding:20px;border-radius:12px;margin-bottom:20px">
        <p style="margin:0 0 8px;font-size:14px">${info.descripcion}</p>
        <p style="margin:8px 0 0;font-size:13px;color:#D4A843">Estado actual: <strong>${info.estadoTexto}</strong></p>
      </div>
      <div style="text-align:center;margin-bottom:20px">
        <a href="${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://elnido2026final.vercel.app'}/guardian"
           style="background:#D4A843;color:#0B2B26;font-weight:bold;padding:12px 28px;border-radius:8px;text-decoration:none;display:inline-block">
          Ir a mi panel Guardián
        </a>
      </div>
      <p style="margin:0;font-size:12px;color:#F7F3E899">El Nido — Santuario de Fauna Mexicana</p>
    </div>
  `

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: info.subject,
      html,
    })
  } catch (err) {
    console.error('Error al enviar email de estado de suscripción:', err)
  }
}
