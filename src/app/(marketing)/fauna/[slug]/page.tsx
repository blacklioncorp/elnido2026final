import { species } from '@/lib/species'
import { IUCN_LABELS, IUCN_COLORS } from '@/lib/iucn'
import { formatCurrency } from '@/lib/utils'
import Image from 'next/image'
import LightboxImage from '@/components/ui/LightboxImage'
import { getOptimizedUrl } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, Heart, BookOpen, Calendar } from 'lucide-react'
import { getFaunaBySlug } from '@/app/actions/fauna'
import { getEntradasByFauna } from '@/app/actions/bitacora'
import { formatDate } from '@/lib/utils'

interface Props { params: Promise<{ slug: string }> }

export const dynamic = 'force-dynamic'

export default async function SpeciePage({ params }: Props) {
  const { slug } = await params

  // Intentar Supabase primero
  let dbEspecie: any = null
  let bitacora: any[] = []
  try {
    dbEspecie = await getFaunaBySlug(slug)
    if (dbEspecie) {
      bitacora = await getEntradasByFauna(dbEspecie.id)
    }
  } catch { /* fallback */ }

  // Fallback a datos estáticos si no hay en DB
  if (!dbEspecie) {
    const specie = species.find(s => s.id === slug)
    if (!specie) notFound()

    const iucnColor = IUCN_COLORS[specie.iucnStatus]
    const iucnLabel = IUCN_LABELS[specie.iucnStatus]

    return (
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <Link href="/fauna" className="inline-flex items-center gap-2 text-off-white/50 hover:text-off-white transition-colors text-sm mb-10">
          <ArrowLeft className="h-4 w-4" /> Volver a especies
        </Link>
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div className="relative rounded-3xl overflow-hidden aspect-square shadow-2xl">
            <Image src={specie.imageUrl} alt={specie.name} fill className="object-cover" />
            <div className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-white text-sm font-bold shadow-lg" style={{ backgroundColor: iucnColor + 'CC' }}>
              {specie.iucnStatus} · {iucnLabel}
            </div>
          </div>
          <div>
            <p className="text-off-white/40 text-sm italic mb-1">{specie.scientificName}</p>
            <h1 className="text-5xl font-extrabold text-off-white tracking-tight mb-4">{specie.name}</h1>
            <p className="text-off-white/70 leading-relaxed mb-6">{specie.description}</p>
            <div className="flex items-center gap-2 text-off-white/50 text-sm mb-8">
              <MapPin className="h-4 w-4 text-conservation-gold" />{specie.habitat}
            </div>
            <div className="bg-forest-green-light/60 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
              <h2 className="text-2xl font-bold text-off-white mb-2">Sé su Guardián</h2>
              <p className="text-off-white/60 text-sm mb-5">Tu apadrinamiento mensual financia directamente el cuidado del {specie.name}.</p>
              <p className="text-conservation-gold text-3xl font-extrabold mb-5">{formatCurrency(specie.monthlyAmount)}<span className="text-off-white/40 text-sm font-normal">/mes</span></p>
              <Link href="/donar" className="flex items-center justify-center gap-2 w-full bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-extrabold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02]">
                <Heart className="h-5 w-5" /> ¡Quiero Apadrinar!
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Vista desde Supabase
  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative h-[60vh] min-h-[400px] overflow-hidden">
        {dbEspecie.imagen_url
          ? <Image src={getOptimizedUrl(dbEspecie.imagen_url, 'large')} alt={dbEspecie.nombre} fill priority className="object-cover" />
          : <div className="h-full bg-forest-green-light/40" />}
        <div className="absolute inset-0 bg-gradient-to-t from-forest-green-dark via-forest-green-dark/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-8 md:p-16">
          <Link href="/fauna" className="inline-flex items-center gap-2 text-off-white/60 hover:text-off-white transition-colors text-sm mb-4">
            <ArrowLeft className="h-4 w-4" /> Volver a Fauna
          </Link>
          <p className="text-off-white/50 italic mb-1">{dbEspecie.nombre_cientifico}</p>
          <h1 className="text-5xl md:text-7xl font-extrabold text-off-white tracking-tighter">{dbEspecie.nombre}</h1>
          {dbEspecie.tipo && (
            <span className="inline-block mt-3 px-3 py-1 bg-conservation-gold/20 text-conservation-gold border border-conservation-gold/30 rounded-full text-sm font-semibold capitalize">
              {dbEspecie.tipo}
            </span>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-2 space-y-10">
            {/* Descripción */}
            {dbEspecie.descripcion && (
              <section>
                <h2 className="text-2xl font-bold text-off-white mb-4 tracking-tight">Sobre esta especie</h2>
                <p className="text-off-white/70 leading-relaxed">{dbEspecie.descripcion}</p>
              </section>
            )}

            {/* Historia */}
            {dbEspecie.historia && (
              <section>
                <h2 className="text-2xl font-bold text-off-white mb-4 tracking-tight">Historia de Conservación</h2>
                <div className="text-off-white/70 leading-relaxed space-y-4">
                  {dbEspecie.historia.split('\n\n').map((p: string, i: number) => <p key={i}>{p}</p>)}
                </div>
              </section>
            )}

            {/* Galería */}
            {Array.isArray(dbEspecie.galeria) && dbEspecie.galeria.length > 0 && (
              <section>
                <h2 className="text-2xl font-bold text-off-white mb-4 tracking-tight">Galería</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {dbEspecie.galeria.map((url: string, i: number) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden">
                      <LightboxImage 
                        src={url} 
                        alt={`${dbEspecie.nombre} ${i + 1}`} 
                        fill 
                        className="object-cover hover:scale-105 transition-transform duration-300"
                        gallery={dbEspecie.galeria}
                        currentGalleryIndex={i}
                        onNavigate={() => {}}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Bitácora de campo */}
            {bitacora.length > 0 && (
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <BookOpen className="h-5 w-5 text-conservation-gold" />
                  <h2 className="text-2xl font-bold text-off-white tracking-tight">Bitácora de Campo</h2>
                </div>
                <div className="space-y-4">
                  {bitacora.map(entrada => (
                    <div key={entrada.id} className="bg-forest-green-light/30 border border-white/10 rounded-2xl p-5 hover:border-white/20 transition-colors">
                      <div className="flex items-center gap-2 text-off-white/40 text-xs mb-2">
                        <Calendar className="h-3 w-3" /> {formatDate(entrada.created_at)}
                      </div>
                      <h3 className="text-off-white font-bold mb-2">{entrada.titulo}</h3>
                      <p className="text-off-white/60 text-sm leading-relaxed line-clamp-3">{entrada.contenido}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>

          {/* Sidebar — Apadrinar */}
          <div className="md:col-span-1">
            <div className="sticky top-8 bg-forest-green-light/30 border border-white/10 rounded-2xl p-6">
              <h3 className="text-xl font-bold text-off-white mb-2">Sé su Guardián</h3>
              <p className="text-off-white/60 text-sm mb-6">Tu apoyo mensual financia directamente el cuidado de {dbEspecie.nombre} en El Nido.</p>
              <Link href="/donar" className="flex items-center justify-center gap-2 w-full bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-extrabold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02]">
                <Heart className="h-5 w-5" /> Apadrinar
              </Link>
              <Link href="/fauna" className="flex items-center justify-center gap-2 w-full mt-3 text-off-white/50 hover:text-off-white text-sm transition-colors py-2">
                ← Ver todas las especies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
