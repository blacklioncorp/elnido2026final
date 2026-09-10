import { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { GraduationCap, School, Globe, Award, Heart, Feather } from 'lucide-react'
import CarruselFundador from '@/components/fundador/CarruselFundador'

export const metadata: Metadata = {
  title: 'Quiénes Somos | El Nido',
  description: 'Un hombre. Una visión. Un santuario.',
}

export default function QuienesSomosPage() {
  const bgImage = "/hero/1_Quetzal_Chucho.svg"

  return (
    <div className="min-h-screen bg-forest-green-dark">
      {/* Hero Principal */}
      <section className="relative pt-40 pb-32 overflow-hidden bg-gradient-to-br from-forest-green-dark to-quetzal-blue">
        <div className="absolute inset-0 z-0">
          <Image 
            src={bgImage} 
            alt="Quetzal" 
            fill
            className="object-cover opacity-25"
            priority
          />
          <div className="absolute inset-0 bg-black/75" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold text-off-white leading-tight mb-6 drop-shadow-xl">
            Quiénes Somos
          </h1>
          <p className="text-xl md:text-3xl text-conservation-gold font-light tracking-wide drop-shadow-md">
            Un hombre. Una visión. Un santuario.
          </p>
        </div>
      </section>

      {/* Sección 1: Santuario de Aves El Nido */}
      <section className="py-24 relative z-10">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-quetzal-blue mb-8">
            Santuario de Aves El Nido
          </h2>
          <p className="text-xl leading-relaxed text-off-white/90 font-light">
            El Nido es un santuario dedicado a cuidar la vida y brindar segundas oportunidades a los animales que han sido confiados a nuestro cuidado. Es también un espacio de encuentro con la naturaleza que busca despertar respeto, amor y compromiso por toda forma de vida.
          </p>
        </div>
      </section>

      {/* Sección 2: Dr. Jesús Estudillo López */}
      <section className="py-24 bg-forest-green-light/10 relative overflow-hidden">
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex flex-col md:flex-row gap-16 items-start">
            {/* Foto e info */}
            <div className="w-full md:w-1/3 text-center md:sticky md:top-32">
              <div className="w-[200px] h-[200px] mx-auto rounded-full shadow-2xl border-4 border-off-white/10 mb-6 relative overflow-hidden flex items-start justify-center">
                <Image
                  src="/fundador/dr_ovalo.jpg"
                  alt="Dr. Jesús Estudillo López"
                  fill
                  className="object-cover !h-[139%]"
                  sizes="200px"
                />
              </div>
              <h3 className="text-2xl font-bold text-off-white mb-4">Dr. Jesús Estudillo López</h3>
              <div className="inline-flex flex-col gap-2">
                <span className="inline-block px-4 py-1.5 rounded-full border border-conservation-gold/30 text-conservation-gold text-xs font-medium bg-conservation-gold/5 backdrop-blur-md">
                  Fundador
                </span>
                <span className="text-sm text-off-white/70">
                  Médico Veterinario Zootecnista<br/>Ornitólogo | Conservacionista
                </span>
              </div>
            </div>

            {/* Biografía y Timeline */}
            <div className="w-full md:w-2/3 space-y-12">
              <div className="prose prose-lg prose-invert max-w-none text-off-white/80">
                <p>
                  El Santuario de Aves El Nido nació de la visión del Dr. Jesús Estudillo López, quien dedicó más de cuatro décadas a la investigación, protección y conservación de la fauna silvestre.
                </p>
                <p>
                  Médico Veterinario Zootecnista egresado de la UNAM, realizó estudios de maestría en Patología Aviar en la Universidad de Ohio y fue becario de la Fundación Rockefeller. Realizó importantes aportaciones a la avicultura mexicana mediante el desarrollo de vacunas contra enfermedades infecciosas de las aves y destacó internacionalmente por su trabajo en reproducción y conservación de especies amenazadas.
                </p>
                <p>
                  En sus expediciones por los trópicos contribuyó al conocimiento y conservación de numerosas especies. En 1975, en Bolivia, descubrió una de las especies de crácidos más raras, <em>Crax estudilloi</em>, nombrada en su honor. Su trayectoria fue reconocida, entre otros, con el Premio Global 500 de las Naciones Unidas, otorgado en 1993.
                </p>
                <p>
                  Su mayor legado es El Nido, concebido como un espacio para la conservación y reproducción de aves y transformado con los años en un santuario donde el bienestar de cada individuo es parte esencial de la conservación.
                </p>
              </div>

              {/* Timeline */}
              <div className="mt-16 pt-12 border-t border-white/10">
                <h4 className="text-2xl font-bold text-quetzal-blue mb-8 text-center md:text-left">Línea de Tiempo</h4>
                <div className="space-y-6">
                  {[
                    { year: '1960s', title: 'Graduado UNAM - Médico Veterinario Zootecnista', icon: GraduationCap },
                    { year: '1970s', title: 'Ohio State University - Patología Aviar', icon: School },
                    { year: '1975', title: 'Descubre Crax estudilloi en Bolivia', icon: Globe },
                    { year: '1993', title: 'Premio Global 500 de las Naciones Unidas', icon: Award },
                    { year: '2000s', title: 'Funda El Nido', icon: Heart },
                    { year: '2026', title: 'Su legado sigue vivo', icon: Feather },
                  ].map((item, i) => (
                    <div key={i} className="flex flex-col md:flex-row items-center md:items-start gap-4 p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm shadow-xl transition-all hover:bg-white/10">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-quetzal-blue/20 text-quetzal-blue shrink-0 mb-4 md:mb-0">
                        <item.icon size={24} />
                      </div>
                      <div className="text-center md:text-left">
                        <span className="block text-conservation-gold font-bold mb-1">{item.year}</span>
                        <span className="text-off-white/90 text-lg">{item.title}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Carrusel Pantalla Completa */}
      <section className="py-12 bg-forest-green-dark">
        <CarruselFundador />
      </section>

      {/* Sección 3: Nuestro Legado */}
      <section className="py-32 relative z-10">
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <p className="text-2xl md:text-3xl italic text-conservation-gold mb-12 leading-relaxed font-serif">
            "La visión del Dr. Estudillo permanece viva en El Nido: servir a la vida, protegerla y despertar en cada persona el deseo de cuidarla."
          </p>
          <Link
            href="/donativos"
            className="inline-block rounded-full bg-conservation-gold px-10 py-4 text-lg font-bold text-forest-green-dark shadow-lg transition-all hover:bg-yellow-400 hover:scale-105"
          >
            Conviértete en Guardián
          </Link>
        </div>
      </section>
    </div>
  )
}
