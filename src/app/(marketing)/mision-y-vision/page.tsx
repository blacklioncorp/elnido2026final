import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Misión y Visión | El Nido',
  description: 'Conoce nuestra misión, visión y los valores que impulsan la conservación de la fauna en peligro de extinción en México.',
}

export default function MisionYVisionPage() {
  const heroImage = "https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/especies/Quetzal-Chucho.svg"

  return (
    <div className="min-h-screen bg-forest-green-dark">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 overflow-hidden">
        {/* Background Decorative */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-conservation-gold/10 rounded-full blur-[100px] translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-quetzal-blue/10 rounded-full blur-[120px] -translate-x-1/3 translate-y-1/3" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col md:flex-row items-center gap-12 max-w-6xl mx-auto">
            <div className="flex-1 space-y-6">
              <span className="inline-block px-4 py-1.5 rounded-full border border-conservation-gold/30 text-conservation-gold font-bold tracking-wider text-xs uppercase bg-conservation-gold/5 backdrop-blur-md">
                Acerca de El Nido
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-off-white leading-tight">
                Nuestra <span className="text-transparent bg-clip-text bg-gradient-to-r from-conservation-gold to-yellow-400">Misión</span> y <span className="text-transparent bg-clip-text bg-gradient-to-r from-quetzal-blue to-emerald-400">Visión</span>
              </h1>
              <p className="text-lg md:text-xl text-off-white/70 max-w-xl leading-relaxed">

              </p>
            </div>
            <div className="flex-1 relative w-full aspect-square max-w-md">
              <div className="absolute inset-0 bg-gradient-to-tr from-forest-green-light/20 to-quetzal-blue/20 rounded-[3rem] rotate-6 scale-105 transition-transform hover:rotate-12 duration-700" />
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm rounded-[3rem] border border-white/10 overflow-hidden flex items-center justify-center p-8">
                <Image
                  src={heroImage}
                  alt="Quetzal El Nido"
                  fill
                  className="object-contain p-8 drop-shadow-2xl hover:scale-110 transition-transform duration-700"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-20 relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-16">

            {/* Mision */}
            <div className="bg-forest-green-light/20 backdrop-blur-md border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl">
              <h2 className="text-3xl font-bold text-conservation-gold mb-6 flex items-center gap-4">
                <span className="w-12 h-12 rounded-2xl bg-conservation-gold/10 flex items-center justify-center text-2xl">🎯</span>
                Nuestra Misión
              </h2>
              <div className="space-y-4 text-off-white/80 leading-relaxed text-lg">
                <p>
                  Inspiramos e impulsamos a las personas para que cuiden la vida, a través de la protección de especies de aves y otros animales en peligro de extinción, brindando experiencias y mensajes de descubrimiento, encuentro y respeto por la naturaleza.
                </p>
                <p>

                </p>
              </div>
            </div>

            {/* Vision */}
            <div className="bg-forest-green-light/20 backdrop-blur-md border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-quetzal-blue/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
              <h2 className="text-3xl font-bold text-quetzal-blue mb-6 flex items-center gap-4 relative z-10">
                <span className="w-12 h-12 rounded-2xl bg-quetzal-blue/10 flex items-center justify-center text-2xl">🔭</span>
                Nuestra Visión
              </h2>
              <div className="space-y-4 text-off-white/80 leading-relaxed text-lg relative z-10">
                <p>
                  Somos un santuario con más de 50 años de experiencia reproduciendo especies en peligro de extinción.
                  En un espacio cerrado de 7 hectáreas en medio del área metropolitana (20 min de la Ciudad de México), recreamos una selva para que especies como el quetzal y el jaguar se puedan reproducir.
                </p>
                <p>
                  Desarrollamos experiencias organizadas a diferentes niveles educativos para INSPIRAR E IMPULSAR el cuidado por la vida.
                </p>
              </div>
            </div>

            {/* Valores */}
            <div className="bg-forest-green-light/20 backdrop-blur-md border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl">
              <h2 className="text-3xl font-bold text-off-white mb-8 text-center">Nuestros Valores</h2>
              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { icon: '🌿', title: 'Conservación', desc: ' ' },
                  { icon: '🤝', title: 'Compromiso', desc: ' ' },
                  { icon: '❤️', title: 'Respeto', desc: ' ' }
                ].map((v, i) => (
                  <div key={i} className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto rounded-full bg-white/5 flex items-center justify-center text-3xl border border-white/10">
                      {v.icon}
                    </div>
                    <h3 className="text-xl font-bold text-off-white">{v.title}</h3>
                    <p className="text-off-white/60 text-sm">{v.desc}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
