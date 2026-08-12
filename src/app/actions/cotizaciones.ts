'use server'

import { z } from 'zod'
import { headers } from 'next/headers'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { Resend } from 'resend'
import { cotizacionesLimiter } from '@/lib/rate-limit'
import { sanitizeHtml } from '@/lib/utils'

const schema = z.object({
  paquete_id: z.string().uuid(),
  cliente_nombre: z.string().min(2, 'Nombre muy corto'),
  cliente_email: z.string().email('Email inválido'),
  cliente_telefono: z.string().optional(),
  escuela: z.string().min(2, 'Institución muy corta'),
  personas: z.number().min(10).max(60),
  fecha_deseada: z.string().optional(),
  incluye_lunch: z.boolean().default(false),
  incluye_transporte: z.boolean().default(false),
  total_estimado: z.number().optional().default(0),
  mensaje: z.string().optional(),
})

export async function enviarCotizacion(prevState: unknown, formData: FormData) {
  const h = await headers()
  const ip = h.get('x-forwarded-for') ?? 'unknown'
  const rateLimit = cotizacionesLimiter.check(ip)
  
  if (!rateLimit.success) {
    return { success: false, error: 'Demasiadas solicitudes. Espera un momento.' }
  }

  try {
    const rawData = {
      paquete_id: formData.get('paquete_id'),
      cliente_nombre: sanitizeHtml(formData.get('cliente_nombre')?.toString() || formData.get('nombre_contacto')?.toString() || ''),
      cliente_email: formData.get('cliente_email')?.toString() || formData.get('email_contacto')?.toString() || '',
      cliente_telefono: sanitizeHtml(formData.get('cliente_telefono')?.toString() || formData.get('telefono_contacto')?.toString() || ''),
      escuela: sanitizeHtml(formData.get('escuela')?.toString() || formData.get('nombre_institucion')?.toString() || ''),
      personas: Number(formData.get('personas') || formData.get('numero_personas')),
      fecha_deseada: formData.get('fecha_deseada')?.toString() || undefined,
      incluye_lunch: formData.get('incluye_lunch') === 'on' || formData.get('incluye_lunch') === 'true',
      incluye_transporte: formData.get('incluye_transporte') === 'on' || formData.get('incluye_transporte') === 'true',
      total_estimado: Number(formData.get('total_estimado') || 0),
      mensaje: sanitizeHtml(formData.get('mensaje')?.toString() || ''),
    }

    const validatedFields = schema.safeParse(rawData)

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Por favor, revisa los datos ingresados.',
        fields: validatedFields.error.flatten().fieldErrors,
      }
    }

    const supabase = await createAdminSupabaseClient()

    // Obtener info del paquete para el email
    const { data: paquete } = await supabase
      .from('paquetes_educativos')
      .select('nombre, precio_por_persona')
      .eq('id', validatedFields.data.paquete_id)
      .single()

    if (!paquete) {
      return { success: false, error: 'Paquete no encontrado.' }
    }

    // Insertar en la base de datos
    const { data: cotizacion, error } = await supabase
      .from('cotizaciones')
      .insert({
        ...validatedFields.data,
        estado: 'pendiente'
      })
      .select()
      .single()

    if (error) {
      console.error('Error insertando cotización:', error)
      return { success: false, error: 'Ocurrió un error al guardar tu solicitud. Intenta nuevamente.' }
    }

    // Enviar Emails
    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      const resend = new Resend(resendKey)
      const from = process.env.RESEND_FROM ?? 'El Nido <onboarding@resend.dev>'
      
      const { 
        cliente_nombre, cliente_email, cliente_telefono, 
        escuela, personas, fecha_deseada, 
        incluye_lunch, incluye_transporte, mensaje 
      } = validatedFields.data

      const detallesHtml = `
        <ul>
          <li><strong>Paquete:</strong> ${paquete.nombre}</li>
          <li><strong>Institución:</strong> ${escuela}</li>
          <li><strong>Contacto:</strong> ${cliente_nombre} (${cliente_email} - ${cliente_telefono || 'N/A'})</li>
          <li><strong>Personas:</strong> ${personas}</li>
          <li><strong>Fecha:</strong> ${fecha_deseada || 'Por definir'}</li>
          <li><strong>Lunch:</strong> ${incluye_lunch ? 'Sí' : 'No'}</li>
          <li><strong>Transporte:</strong> ${incluye_transporte ? 'Sí' : 'No'}</li>
          <li><strong>Mensaje:</strong> ${mensaje || 'N/A'}</li>
        </ul>
      `

      // 1. Email al Santuario
      await resend.emails.send({
        from,
        to: process.env.ADMIN_EMAIL ?? 'admin@elnido.mx', // Reemplazar con el email real o variable de entorno
        subject: `Nueva solicitud de cotización - ${paquete.nombre} - ${escuela}`,
        html: `
          <h2>Nueva solicitud de cotización para Grupos</h2>
          ${detallesHtml}
          <p>Revisa el panel de administración para responder a esta solicitud.</p>
        `,
      }).catch(console.error)

      // 2. Email de Confirmación al Usuario
      await resend.emails.send({
        from,
        to: cliente_email,
        subject: `Hemos recibido tu solicitud de cotización - El Nido 🪶`,
        html: `
          <div style="font-family:Inter,Arial,sans-serif;background:#0B2B26;color:#F7F3E8;padding:32px;border-radius:16px;max-width:520px;margin:auto">
            <h1 style="color:#D4A843;margin:0 0 8px">¡Hola ${cliente_nombre}!</h1>
            <p style="margin:0 0 16px">Hemos recibido tu solicitud de cotización para <strong>${escuela}</strong>.</p>
            <p style="margin:0 0 16px">Nuestro equipo está revisando los detalles y nos pondremos en contacto contigo pronto.</p>
            <div style="background:#1A4A3A;padding:20px;border-radius:12px;">
              <h3 style="margin-top:0">Resumen de tu solicitud:</h3>
              ${detallesHtml}
            </div>
            <p style="margin:24px 0 0;font-size:12px;color:#F7F3E899">El Nido — Santuario de Fauna Mexicana</p>
          </div>
        `,
      }).catch(console.error)
    }

    return { success: true, message: 'Cotización enviada exitosamente.' }
  } catch (error) {
    console.error('Error in enviarCotizacion action:', error)
    return { success: false, error: 'Ocurrió un error inesperado.' }
  }
}
