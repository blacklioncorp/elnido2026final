import { Metadata } from 'next'
import Link from 'next/link'
import { Star, CheckCircle, ArrowRight, ShieldCheck, Heart, Sparkles, User, LayoutDashboard, LogIn } from 'lucide-react'
import ListaEsperaForm from './ListaEsperaForm'

export const metadata: Metadata = {
  title: 'Programa Guardián | Santuario El Nido',
  description: 'Tu apoyo protege una vida. Conviértete en Guardián del Santuario El Nido y sé parte de la conservación de la fauna silvestre en México.',
}

const BENEFICIOS_PROXIMOS = [
  {
    titulo: 'Seguimiento personalizado de tu especie',
    descripcion: 'Reportes clínicos, evolución nutricional y avances del cuidado diario.',
  },
  {
    titulo: 'Acceso al mapa de liberación',
    descripcion: 'Visualización satelital y etapas del proceso de reintroducción a su hábitat natural.',
  },
  {
    titulo: 'Bitácora exclusiva con fotos premium',
    descripcion: 'Galería de alta resolución y videos detrás de cámaras de nuestros cuidadores y biólogos.',
  },
  {
    titulo: 'Descuentos en eventos y talleres',
    descripcion: 'Entrada preferencial y beneficios en cursos de educación ambiental y visitas guiadas.',
  },
  {
    titulo: 'Saldo para consumo en tienda',
    descripcion: 'Descuentos y créditos especiales en la tienda oficial y cafetería del santuario.',
  },
]

export default function GuardianInfoPage() {
  return (
    <div className="min-h-screen bg-forest-green-dark">
      {/* SECCIÓN 1: HERO */}
      <section className="relative pt-36 pb-24 md:pt-44 md:pb-32 overflow-hidden bg-gradient-to-br from-forest-green-dark via-[#0d3b2e] to-quetzal-blue">
        {/* Glow & ambient decorations */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-conservation-gold/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-10 w-72 h-72 bg-quetzal-blue/20 rounded-full blur-2xl pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10 text-center max-w-4xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/20 text-conservation-gold text-sm font-semibold mb-6 backdrop-blur-md shadow-sm">
            <Star className="w-4 h-4 fill-conservation-gold" />
            <span>Programa Guardián</span>
          </div>

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-off-white tracking-tight leading-tight mb-6">
            Tu apoyo protege una vida.
          </h1>

          {/* Description */}
          <p className="text-lg md:text-xl text-off-white/90 leading-relaxed max-w-2xl mx-auto mb-10 font-normal">
            Con tu apoyo, ayudas a cuidar, proteger y brindar una segunda oportunidad a las aves del Santuario El Nido. Juntos podemos seguir cuidando la vida y la biodiversidad mexicana.
          </p>

          {/* CTA Button */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/donativos"
              className="inline-flex items-center justify-center gap-3 bg-conservation-gold text-forest-green-dark px-8 py-4 rounded-full font-bold text-base hover:bg-conservation-gold/90 hover:scale-105 active:scale-95 transition-all duration-200 shadow-xl shadow-black/20"
            >
              <span>Conviértete en Guardián</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* SECCIÓN 2: BENEFICIOS (PRÓXIMAMENTE) */}
      <section className="py-20 md:py-28 bg-off-white text-forest-green-dark">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-forest-green-dark/10 text-forest-green-dark text-xs font-bold uppercase tracking-wider mb-4">
              <span>🚧 Próximamente</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-forest-green-dark mb-4">
              Muy pronto podrás acceder a beneficios exclusivos como:
            </h2>
            <p className="text-forest-green-dark/70 text-base max-w-xl mx-auto">
              Estamos preparando una experiencia digital única para conectarte directamente con el impacto de tu aportación.
            </p>
          </div>

          {/* Checklist de Beneficios */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto mb-12">
            {BENEFICIOS_PROXIMOS.map((beneficio, index) => (
              <div
                key={index}
                className="flex items-start gap-3.5 p-4 rounded-2xl bg-white border border-forest-green-dark/10 shadow-sm hover:border-conservation-gold/50 transition-colors"
              >
                <CheckCircle className="w-5 h-5 text-forest-green-dark shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-forest-green-dark text-sm sm:text-base mb-0.5">
                    {beneficio.titulo}
                  </h3>
                  <p className="text-xs sm:text-sm text-forest-green-dark/70">
                    {beneficio.descripcion}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Waitlist Form with Action */}
          <div className="mt-8">
            <ListaEsperaForm />
          </div>
        </div>
      </section>

      {/* SECCIÓN 3: APADRINAR MIENTRAS TANTO */}
      <section className="py-16 md:py-20 bg-quetzal-blue/10 border-y border-white/10">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <p className="text-conservation-gold font-semibold uppercase tracking-wider text-xs md:text-sm mb-2">
            Mientras tanto:
          </p>
          <h2 className="text-2xl md:text-3xl font-bold text-off-white mb-6">
            Puedes apadrinar una especie desde $50/mes
          </h2>
          <p className="text-off-white/80 text-sm md:text-base mb-8 max-w-lg mx-auto">
            Tu apadrinamiento mensual financia la nutrición especializada, medicinas y cuidados continuos de los ejemplares que más lo necesitan.
          </p>
          <Link
            href="/donativos"
            className="inline-flex items-center justify-center gap-2 bg-quetzal-blue hover:bg-quetzal-blue/90 text-off-white font-bold px-8 py-3.5 rounded-full transition-all duration-200 hover:scale-105 shadow-lg shadow-quetzal-blue/20 text-sm sm:text-base"
          >
            <Heart className="w-4 h-4 fill-current" />
            <span>Apadrinar una especie</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* SECCIÓN 4: ¿YA ERES GUARDIÁN? */}
      <section className="py-16 md:py-24 bg-forest-green-dark border-t border-white/10">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/5 border border-white/10 text-conservation-gold mb-4">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-off-white mb-3">
            ¿Ya eres Guardián?
          </h2>
          <p className="text-off-white/70 text-sm mb-8 max-w-md mx-auto">
            Consulta el estado de tus aportaciones, especies apadrinadas y avances de conservación desde tu panel personal.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/30 text-off-white font-semibold text-sm hover:bg-white/10 hover:border-white/50 transition-all duration-200"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar sesión</span>
            </Link>
            <Link
              href="/guardian"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full border border-white/30 text-off-white font-semibold text-sm hover:bg-white/10 hover:border-white/50 transition-all duration-200"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Ver mi Dashboard</span>
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
