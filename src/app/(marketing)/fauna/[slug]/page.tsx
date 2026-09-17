import type { Metadata } from 'next'
import { species } from '@/lib/species'
import { IUCN_LABELS, IUCN_COLORS } from '@/lib/iucn'
import { formatDate } from '@/lib/utils'
import Image from 'next/image'
import LightboxImage from '@/components/ui/LightboxImage'
import { getOptimizedUrl } from '@/lib/utils'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, MapPin, BookOpen, Calendar } from 'lucide-react'
import { getFaunaBySlug, registrarEscaneoQR } from '@/app/actions/fauna'
import { getEntradasByFauna } from '@/app/actions/bitacora'
import FaunaDonarCTA from '@/components/fauna/FaunaDonarCTA'
import { headers } from 'next/headers'

interface Props {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ donar?: string; origen?: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  let nombre = slug
  try {
    const especie = await getFaunaBySlug(slug)
    if (especie) nombre = especie.nombre
  } catch {}
  return {
    title: `${nombre} — El Nido Santuario`,
    description: `Conoce la historia de ${nombre} y únete a su conservación en El Nido.`,
  }
}

export default async function SpeciePage({ params, searchParams }: Props) {
  const { slug } = await params
  const { donar, origen } = await searchParams
  const esOrigenQR = origen === 'qr'
  const abrirDonacion = donar === 'true' || esOrigenQR

  // Intentar Supabase primero
  let dbEspecie: any = null
  let bitacora: any[] = []
  try {
    dbEspecie = await getFaunaBySlug(slug)
    if (dbEspecie) {
      bitacora = await getEntradasByFauna(dbEspecie.id)

      // Registrar escaneo silencioso si viene de QR
      if (esOrigenQR) {
        const headersList = await headers()
        const userAgent = headersList.get('user-agent')
        const referer = headersList.get('referer')
        // No bloqueante
        registrarEscaneoQR(dbEspecie.id, slug, userAgent, referer).catch(() => {})
      }
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
            <FaunaDonarCTA
              especie={{
                nombre: specie.name,
                slug: specie.id,
              }}
              abrirDonacionAuto={abrirDonacion}
            />
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
            <div className="sticky top-8 space-y-4">
              <FaunaDonarCTA
                especie={{
                  nombre: dbEspecie.nombre,
                  slug: dbEspecie.slug,
                }}
                abrirDonacionAuto={abrirDonacion}
              />
              <Link
                href="/fauna"
                className="flex items-center justify-center gap-2 w-full text-off-white/50 hover:text-off-white text-xs transition-colors py-2"
              >
                ← Ver todas las especies
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
