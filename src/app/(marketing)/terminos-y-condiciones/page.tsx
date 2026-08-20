import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Términos y Condiciones | El Nido',
  description: 'Términos y condiciones de uso de la plataforma de donaciones y servicios de El Nido.',
}

export default function TerminosYCondicionesPage() {
  const heroImage = "https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/especies/plumas-Himalayo.svg"

  return (
    <div className="min-h-screen bg-forest-green-dark">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <Image 
            src={heroImage} 
            alt="Fondo Plumas" 
            fill
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-green-dark/50 via-forest-green-dark/80 to-forest-green-dark" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full border border-quetzal-blue/30 text-quetzal-blue font-bold tracking-wider text-xs uppercase bg-quetzal-blue/5 backdrop-blur-md mb-6">
            Documento Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-off-white leading-tight mb-4">
            Términos y Condiciones
          </h1>
          <p className="text-off-white/60">Última actualización: Agosto 2026</p>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-24 relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-forest-green-light/20 backdrop-blur-md border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl text-off-white/80 space-y-8">
            
            <div>
              <h2 className="text-2xl font-bold text-quetzal-blue mb-4">1. Aceptación de los Términos</h2>
              <p className="leading-relaxed">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi tristique congue odio ac venenatis. Suspendisse eleifend elit in nulla venenatis, at varius magna tristique. Al acceder a esta plataforma, aceptas estar sujeto a estos términos.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-quetzal-blue mb-4">2. Donaciones y Pagos</h2>
              <p className="leading-relaxed">
                Nullam euismod congue libero. Integer vitae mi non diam sodales tristique ut ut nulla. Maecenas sit amet aliquet sem, nec elementum enim:
              </p>
              <ul className="list-disc list-inside mt-4 space-y-2 text-off-white/70">
                <li>Las donaciones son procesadas a través de Stripe.</li>
                <li>Las donaciones recurrentes pueden ser canceladas en cualquier momento.</li>
                <li>No se ofrecen reembolsos salvo excepciones legales.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-quetzal-blue mb-4">3. Propiedad Intelectual</h2>
              <p className="leading-relaxed">
                Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Todo el contenido multimedia es propiedad de El Nido.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-bold text-quetzal-blue mb-4">4. Limitación de Responsabilidad</h2>
              <p className="leading-relaxed">
                Donec eu libero sit amet quam egestas semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra.
              </p>
            </div>

            <div className="pt-8 border-t border-white/10 text-sm text-off-white/50 text-center">
              Si tienes dudas acerca de los Términos y Condiciones, por favor contáctanos en <a href="mailto:legal@elnido.org.mx" className="text-quetzal-blue hover:underline">legal@elnido.org.mx</a>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
