import Image from 'next/image'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { MapPin, Calendar, Lock, Eye, Leaf } from 'lucide-react'
import { getOptimizedUrl } from '@/lib/utils'
import { getEntradasPublicas } from '@/app/actions/bitacora'

export const dynamic = 'force-dynamic'

// Fallback estático mientras no haya DB
const FALLBACK = [
  {
    id: 1, titulo: 'Avistamiento de quetzal hembra en zona norte',
    contenido: 'Registro fotográfico de una hembra de quetzal construyendo nido en el árbol #17 del cuadrante B. Primer avistamiento de nidificación en esta zona.',
    created_at: '2025-05-28', imageUrl: '/images/quetzal.png',
    visibilidad: 'publico', fauna: { nombre: 'Quetzal' },
  },
  {
    id: 2, titulo: 'Monitoreo nocturno: actividad de jaguar',
    contenido: 'Cámaras trampa captaron el desplazamiento de un macho adulto (aprox. 90kg) a lo largo del corredor sur.',
    created_at: '2025-05-22', imageUrl: '/images/monitoreo_nocturno.png',
    visibilidad: 'padrinos', fauna: { nombre: 'Jaguar' },
  },
  {
    id: 3, titulo: 'Calidad del agua en estanques de axolotl',
    contenido: 'Medición semanal de parámetros. pH: 7.2, temperatura: 16°C, amoniaco: 0.02 ppm. Todo dentro de rangos óptimos.',
    created_at: '2025-05-19', imageUrl: '/images/calidad_agua_axolotl.png',
    visibilidad: 'mixto', fauna: { nombre: 'Axolotl' },
  },
  {
    id: 4, titulo: 'Plantación de especies nativas para reforestación',
    contenido: 'Se plantaron 45 ejemplares de aguacate silvestre y 30 de mata palo en el área de expansión del santuario.',
    created_at: '2025-05-10', imageUrl: '/images/naturaleza.png',
    visibilidad: 'publico', fauna: null,
  },
]

const VISIB_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  publico:  { icon: <Eye className="h-3 w-3" />,    label: 'Público',       color: 'text-sky-400 bg-sky-500/10 border-sky-500/20' },
  padrinos: { icon: <Lock className="h-3 w-3" />,   label: 'Padrinos',      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20' },
  mixto:    { icon: <Leaf className="h-3 w-3" />,   label: 'Mixto',         color: 'text-amber-400 bg-amber-500/10 border-amber-500/20' },
}

export default async function DiarioDeCampoPage() {
  let dbEntradas: any[] = []
  try {
    dbEntradas = await getEntradasPublicas()
  } catch { /* fallback */ }

  const entradas = dbEntradas.length > 0 ? dbEntradas : FALLBACK

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative py-24 px-4 text-center">
        <div className="absolute inset-0 bg-gradient-to-b from-forest-green-dark to-forest-green-dark/90 pointer-events-none" />
        <div className="relative z-10">
          <p className="text-conservation-gold font-semibold tracking-widest uppercase text-sm mb-3">Registro Científico</p>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tighter text-off-white mb-4">Diario de Campo</h1>
          <p className="text-off-white/50 max-w-xl mx-auto">Seguimiento en tiempo real de las actividades de conservación y monitoreo en El Nido.</p>
        </div>
      </div>

      {/* Banner freemium */}
      <div className="bg-conservation-gold/10 border-y border-conservation-gold/20 py-4 px-4 mb-12">
        <div className="container mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
          <p className="text-off-white/70 flex items-center gap-2">
            <Lock className="h-4 w-4 text-conservation-gold" />
            Algunas entradas son exclusivas para <strong className="text-conservation-gold">Padrinos</strong>. Únete para acceso completo.
          </p>
          <Link href="/membresias" className="bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-bold px-5 py-2 rounded-xl text-sm transition-all whitespace-nowrap">
            Ser Padrino →
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-24 max-w-4xl">
        <div className="space-y-6">
          {entradas.map((entrada: any) => {
            const cfg = VISIB_CONFIG[entrada.visibilidad] ?? VISIB_CONFIG.publico
            const isLocked = entrada.visibilidad === 'padrinos'

            return (
              <div key={entrada.id}
                className={`flex gap-6 bg-forest-green-light/30 border rounded-2xl overflow-hidden transition-all duration-300 ${isLocked ? 'border-purple-500/20 opacity-90' : 'border-white/10 hover:border-conservation-gold/30'}`}>

                {/* Imagen */}
                {(entrada.imagen_url || entrada.imageUrl) && (
                  <div className="relative w-40 md:w-56 flex-shrink-0 hidden sm:block">
                    <Image
                      src={entrada.imagen_url ? getOptimizedUrl(entrada.imagen_url, 'card') : entrada.imageUrl}
                      alt={entrada.titulo}
                      fill className="object-cover"
                    />
                    {isLocked && <div className="absolute inset-0 bg-forest-green-dark/60 backdrop-blur-[2px] flex items-center justify-center"><Lock className="h-6 w-6 text-purple-400" /></div>}
                  </div>
                )}

                <div className="p-6 flex flex-col justify-center flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    {entrada.fauna?.nombre && (
                      <span className="text-conservation-gold text-xs font-medium bg-conservation-gold/10 px-2 py-0.5 rounded-full">
                        {entrada.fauna.nombre}
                      </span>
                    )}
                    <span className="text-off-white/40 text-xs flex items-center gap-1">
                      <Calendar className="h-3 w-3" /> {formatDate(entrada.created_at)}
                    </span>
                  </div>

                  <h2 className="text-lg font-bold text-off-white mb-2">{entrada.titulo}</h2>

                  {isLocked ? (
                    <div>
                      <p className="text-off-white/40 text-sm line-clamp-1 blur-sm select-none">{entrada.contenido}</p>
                      <Link href="/membresias" className="inline-flex items-center gap-1.5 mt-3 text-purple-400 text-sm font-medium hover:text-purple-300 transition-colors">
                        <Lock className="h-3.5 w-3.5" /> Desbloquear con membresía Padrino
                      </Link>
                    </div>
                  ) : (
                    <p className="text-off-white/60 text-sm leading-relaxed">{entrada.contenido}</p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
