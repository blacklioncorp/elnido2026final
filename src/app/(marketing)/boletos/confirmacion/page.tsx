import Link from 'next/link'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'
import { getStripe } from '@/lib/stripe'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { generarQrDataUrl } from '@/lib/qr'
import QRConfirmacion from '@/components/boletos/QRConfirmacion'

function Estado({
  icon: Icon,
  titulo,
  children,
}: {
  icon: typeof Clock
  titulo: string
  children?: React.ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-5 px-4 py-16 text-center">
      <Icon className="h-14 w-14 text-conservation-gold" />
      <h1 className="text-2xl font-bold text-off-white md:text-3xl">{titulo}</h1>
      {children}
    </div>
  )
}

export default async function ConfirmacionPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>
}) {
  const { session_id } = await searchParams

  if (!session_id) {
    return (
      <Estado icon={XCircle} titulo="Falta la referencia de pago">
        <Link href="/boletos" className="text-conservation-gold underline">
          Volver a boletos
        </Link>
      </Estado>
    )
  }

  const admin = await createAdminSupabaseClient()
  
  // Buscar la compra por session_id (Solo Lectura)
  const queryResult = await admin
    .from('compras')
    .select('*, compra_items(*)')
    .eq('stripe_session_id', session_id)
    .maybeSingle()

  const compra = queryResult.data as any

  if (!compra) {
    return (
      <Estado icon={XCircle} titulo="No encontramos tu compra">
        <Link href="/boletos" className="text-conservation-gold underline">
          Volver a boletos
        </Link>
      </Estado>
    )
  }

  // Verificar el pago con Stripe.
  let pagado = false
  try {
    const session = await getStripe().checkout.sessions.retrieve(session_id)
    pagado = session.payment_status === 'paid'
  } catch {
    return (
      <Estado icon={XCircle} titulo="No pudimos verificar tu pago">
        <p className="text-off-white/70">
          Revisa la configuración de Stripe o intenta de nuevo.
        </p>
        <Link href="/boletos" className="text-conservation-gold underline">
          Volver a boletos
        </Link>
      </Estado>
    )
  }

  if (!pagado || compra.estado === 'pendiente') {
    return (
      <Estado icon={Clock} titulo="Confirmando tu pago...">
        <p className="text-off-white/70">
          En cuanto el sistema procese tu pago, esta pantalla se actualizará automáticamente.
        </p>
        <div className="mt-4 flex gap-4">
          <Link 
            href={`/boletos/confirmacion?session_id=${session_id}`}
            className="rounded-full bg-conservation-gold px-6 py-2 font-semibold text-forest-green-dark hover:bg-yellow-400"
          >
            Verificar estado
          </Link>
        </div>
      </Estado>
    )
  }

  // Generamos el QR para visualización (el webhook ya lo persistió y envió por correo)
  const qrToken = compra.qr_code || `ELNIDO-${compra.id}`
  const qrDataUrl = await generarQrDataUrl(qrToken)

  // Datos para mostrar.
  const { data: cliente } = compra.cliente_id
    ? await admin.from('clientes').select('nombre, email').eq('id', compra.cliente_id).maybeSingle()
    : { data: null }

  const items = (compra.compra_items as any[]) || []
  const esMembresia = items.some((i) => i.categoria === 'membresia')
  const instruccion = esMembresia
    ? 'Preséntate en taquilla con este QR para recibir y activar tu pulsera Guardián.'
    : 'Muestra este QR en taquilla el día de tu visita.'

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-6 px-4 py-16 text-center">
      <CheckCircle2 className="h-14 w-14 text-conservation-gold" />
      <div>
        <h1 className="text-2xl font-bold text-off-white md:text-3xl">
          ¡Pago confirmado!
        </h1>
        <p className="mt-2 text-off-white/70">
          Gracias{cliente?.nombre ? `, ${cliente.nombre}` : ''}. Tu compra está lista.
        </p>
      </div>

      <div className="w-full max-w-sm rounded-xl border border-white/10 bg-white/5 p-4 text-left">
        <h3 className="mb-3 font-semibold text-off-white">Detalle de tu compra</h3>
        <ul className="space-y-2">
          {items.map((item, idx) => (
            <li key={idx} className="flex justify-between text-sm text-off-white/80">
              <span>{item.cantidad}x {item.nombre}</span>
              <span>${(item.cantidad * item.precio_unitario).toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>

      <QRConfirmacion qrDataUrl={qrDataUrl} instruccion={instruccion} />

      <Link
        href="/boletos"
        className="text-sm text-off-white/60 underline hover:text-off-white"
      >
        Comprar más boletos
      </Link>
    </div>
  )
}
