import type { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, Heart, Share2, ArrowRight } from 'lucide-react'
import { getStripe } from '@/lib/stripe'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import ShareButtons from '@/components/donativos/ShareButtons'

export const metadata: Metadata = {
  title: '¡Gracias por tu apoyo! — El Nido',
  description: 'Tu donativo fue procesado exitosamente. Ya eres un Guardián del Santuario El Nido.',
}

interface GraciasPageProps {
  searchParams: Promise<{ session_id?: string }>
}

export default async function GraciasPage({ searchParams }: GraciasPageProps) {
  const { session_id } = await searchParams

  let username = 'Guardián'
  let montoFmt = ''
  let especieNombre = ''
  let sessionOk = false
  let esRecurrente = false
  let seccion = ''
  let tarjetaId = ''

  if (session_id) {
    try {
      const stripe = getStripe()
      const session = await stripe.checkout.sessions.retrieve(session_id)

      if (session.payment_status === 'paid' && session.metadata?.producto === 'donacion') {
        sessionOk = true
        username = session.metadata?.donante_username ?? session.metadata?.donante_nombre ?? 'Guardián'
        const monto = Number(session.metadata?.monto ?? 0)
        esRecurrente = session.metadata?.es_recurrente === 'true'
        montoFmt = new Intl.NumberFormat('es-MX', {
          style: 'currency', currency: 'MXN', maximumFractionDigits: 0,
        }).format(monto)

        // Fetch species name if tarjeta_id exists
        tarjetaId = session.metadata?.tarjeta_id || ''
        if (tarjetaId) {
          const supabase = await createAdminSupabaseClient()
          const { data } = await supabase
            .from('tarjetas_donacion')
            .select('nombre_especie, nombre_animal, seccion')
            .eq('id', tarjetaId)
            .maybeSingle()
          if (data) {
            seccion = data.seccion || ''
            especieNombre = data.nombre_animal
              ? `${data.nombre_especie} "${data.nombre_animal}"`
              : data.nombre_especie
          }
        }
      }
    } catch {
      // If Stripe fails, still show a friendly page
    }
  }

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL ?? 'https://elnido2026final.vercel.app'}/donativos`
  const shareText = encodeURIComponent(
    `Acabo de apadrinar a ${especieNombre || 'una especie'} en @ElNido 🦜 ¡Únete y sé Guardián!`
  )

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center px-4 py-20">
      <div className="max-w-lg w-full">
        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl shadow-forest-green-dark/10 overflow-hidden border border-forest-green-dark/8">

          {/* Top banner */}
          <div
            className="px-8 py-10 text-center"
            style={{ background: 'linear-gradient(135deg, #0B2B26 0%, #1A4A3A 100%)' }}
          >
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-emerald-400/20 flex items-center justify-center">
                <CheckCircle className="h-8 w-8 text-emerald-400" />
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-off-white mb-2">
              {sessionOk ? `¡Gracias, ${username}! 🎉` : '¡Pago procesado! 🌿'}
            </h1>
            {sessionOk && montoFmt && especieNombre && (
              <p className="text-off-white/70 text-sm leading-relaxed">
                {esRecurrente ? (
                  <>¡Gracias por convertirte en Guardián mensual! Tu donativo de <span className="text-conservation-gold font-bold">{montoFmt}/mes</span> para <strong className="text-off-white">{especieNombre}</strong> se renovará automáticamente cada mes.</>
                ) : (
                  <>Tu donativo de <span className="text-conservation-gold font-bold">{montoFmt}</span> para <strong className="text-off-white">{especieNombre}</strong> ha sido recibido.</>
                )}
              </p>
            )}
            {sessionOk && (
              <div className="mt-4 bg-white/10 rounded-xl px-4 py-2 inline-block">
                <p className="text-conservation-gold text-sm font-bold">
                  ✅ Ya apareces como Guardián en la barra de progreso
                </p>
              </div>
            )}
          </div>

          {/* Body */}
          <div className="px-8 py-8 space-y-4">

            {/* Share */}
            <ShareButtons shareText={shareText} shareUrl={shareUrl} />

            {/* Action buttons */}
            {seccion === 'impulsa_vuelo' && tarjetaId ? (
              <Link
                href={`/impulsa-el-vuelo/${tarjetaId}?session_id=${session_id}`}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-off-white transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #D4A843 0%, #B8860B 100%)' }} // gold gradient for special map
              >
                <Heart className="h-4 w-4" />
                Seguir el viaje de la especie
              </Link>
            ) : (
              <Link
                href="/donativos"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-bold text-off-white transition-all hover:brightness-110"
                style={{ background: 'linear-gradient(135deg, #0B2B26 0%, #2E86AB 100%)' }}
              >
                <Heart className="h-4 w-4" />
                Ver mi donativo en la barra
              </Link>
            )}

            <Link
              href="/donativos"
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-forest-green-dark bg-forest-green-dark/5 hover:bg-forest-green-dark/10 transition-colors text-sm"
            >
              Apadrinar otra especie
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/donar"
              className="w-full text-center text-forest-green-dark/50 hover:text-forest-green-dark text-sm py-2 block transition-colors"
            >
              Donación general →
            </Link>
          </div>
        </div>

        {esRecurrente ? (
          <p className="text-center text-forest-green-dark/40 text-xs mt-6">
            Recibirás un recordatorio 3 días antes de cada cobro. Para cancelar, contacta al santuario. 🌿
          </p>
        ) : (
          <p className="text-center text-forest-green-dark/40 text-xs mt-6">
            Recibirás un correo de confirmación en breve. Gracias por proteger El Nido. 🌿
          </p>
        )}
      </div>
    </div>
  )
}
