'use server'

import { Resend } from 'resend'
import { z } from 'zod'

const resend = new Resend(process.env.RESEND_API_KEY)

const contactoSchema = z.object({
  name: z.string().min(1, 'El nombre es requerido'),
  email: z.string().email('Correo electrónico inválido'),
  subject: z.string().min(1, 'El asunto es requerido'),
  message: z.string().min(1, 'El mensaje es requerido'),
})

export async function enviarMensajeContacto(formData: FormData) {
  try {
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      subject: formData.get('subject') as string,
      message: formData.get('message') as string,
    }

    const validatedFields = contactoSchema.safeParse(data)

    if (!validatedFields.success) {
      return {
        success: false,
        error: 'Por favor, completa todos los campos correctamente.',
      }
    }

    const { name, email, subject, message } = validatedFields.data

    // TODO: Ajustar el correo de envío ('from') cuando se tenga el dominio verificado
    const { data: emailData, error } = await resend.emails.send({
      from: 'Contacto El Nido <onboarding@resend.dev>',
      to: 'info@elnido.mx', // Aquí puedes poner el correo donde quieres recibir los mensajes
      subject: `Nuevo mensaje de contacto: ${subject}`,
      html: `
        <h2>Nuevo mensaje de contacto desde la web</h2>
        <p><strong>Nombre:</strong> ${name}</p>
        <p><strong>Correo:</strong> ${email}</p>
        <p><strong>Asunto:</strong> ${subject}</p>
        <br/>
        <p><strong>Mensaje:</strong></p>
        <p>${message.replace(/\n/g, '<br/>')}</p>
      `,
      replyTo: email,
    })

    if (error) {
      console.error('Error al enviar correo con Resend:', error)
      return { success: false, error: 'Ocurrió un error al enviar el mensaje. Inténtalo de nuevo más tarde.' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error inesperado en enviarMensajeContacto:', error)
    return { success: false, error: 'Ocurrió un error inesperado.' }
  }
}
