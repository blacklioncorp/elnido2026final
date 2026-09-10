import Image from 'next/image'
import Link from 'next/link'
import { getFauna } from '@/app/actions/fauna'
import { getOptimizedUrl } from '@/lib/utils'
import { species } from '@/lib/species'
import type { FaunaTipo } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

const TIPOS: { key: FaunaTipo | 'todos'; label: string }[] = [
  { key: 'todos',    label: 'Todos' },
  { key: 'ave',      label: 'Aves' },
  { key: 'mamifero', label: 'Mamíferos' },
  { key: 'reptil',   label: 'Reptiles' },
  { key: 'felino',   label: 'Felinos' },
  { key: 'primate',  label: 'Primates' },
  { key: 'otro',     label: 'Otros' },
]

const TIPO_COLORS: Record<FaunaTipo, string> = {
  ave:      'bg-sky-500/20 text-sky-300 border-sky-500/30',
  mamifero: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  reptil:   'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  felino:   'bg-orange-500/20 text-orange-300 border-orange-500/30',
  primate:  'bg-purple-500/20 text-purple-300 border-purple-500/30',
  otro:     'bg-white/10 text-off-white/60 border-white/10',
}

export default async function FaunaPage() {
  let dbEspecies: any[] = []
  try {
    dbEspecies = await getFauna(true)
  } catch { /* fallback a datos estáticos */ }

  const hayDatos = dbEspecies.length > 0

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative py-28 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-forest-green-dark via-forest-green-dark/90 to-forest-green-dark pointer-events-none" />
        <div className="relative z-10">
          <p className="text-conservation-gold font-semibold tracking-widest uppercase text-sm mb-4">Biodiversidad Mexicana</p>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-off-white mb-6">
            Nuestros Residentes
          </h1>
          <p className="text-off-white/50 max-w-xl mx-auto text-lg">
            Conoce a las especies que habitan en El Nido y aprende sobre su situación de conservación.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-24">
        {hayDatos ? (
          /* ── Vista desde Supabase ── */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {dbEspecies.map(e => (
              <Link key={e.id} href={`/fauna/${e.slug}`}
                className="group relative bg-forest-green-light/20 border border-white/10 rounded-3xl overflow-hidden hover:border-conservation-gold/40 transition-all duration-500 hover:shadow-2xl hover:shadow-conservation-gold/10 hover:-translate-y-1">
                <div className="relative h-60 overflow-hidden">
                  {e.imagen_url
                    ? <Image src={getOptimizedUrl(e.imagen_url, 'card')} alt={e.nombre} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-110 transition-transform duration-700" />
                    : <div className="h-full bg-forest-green-light/40 flex items-center justify-center text-5xl">🦁</div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-green-dark/80 to-transparent" />
                  <div className="absolute bottom-4 left-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${TIPO_COLORS[e.tipo as FaunaTipo]}`}>
                      {e.tipo}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-extrabold text-off-white group-hover:text-conservation-gold transition-colors tracking-tight">{e.nombre}</h2>
                  {e.nombre_cientifico && <p className="text-off-white/40 text-sm italic mb-3">{e.nombre_cientifico}</p>}
                  {e.descripcion && <p className="text-off-white/60 text-sm leading-relaxed line-clamp-2">{e.descripcion}</p>}
                  <div className="mt-4 text-conservation-gold text-sm font-semibold group-hover:gap-3 flex items-center gap-1.5 transition-all">
                    Ver historia →
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          /* ── Fallback datos estáticos ── */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {species.map(s => (
              <Link key={s.id} href={`/fauna/${s.id}`}
                className="group bg-forest-green-light/20 border border-white/10 rounded-3xl overflow-hidden hover:border-conservation-gold/40 transition-all duration-500 hover:shadow-2xl hover:shadow-conservation-gold/10 hover:-translate-y-1">
                <div className="relative h-60 overflow-hidden">
                  <Image src={s.imageUrl} alt={s.name} fill className="object-cover group-hover:scale-110 transition-transform duration-700" />
                  <div className="absolute inset-0 bg-gradient-to-t from-forest-green-dark/80 to-transparent" />
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-extrabold text-off-white group-hover:text-conservation-gold transition-colors tracking-tight">{s.name}</h2>
                  <p className="text-off-white/40 text-sm italic mb-3">{s.scientificName}</p>
                  <p className="text-off-white/60 text-sm leading-relaxed line-clamp-2">{s.description}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
