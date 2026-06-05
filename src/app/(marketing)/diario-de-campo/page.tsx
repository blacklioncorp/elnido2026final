import Image from 'next/image'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { MapPin, Calendar } from 'lucide-react'

const entradas = [
  {
    id: 1,
    titulo: 'Avistamiento de quetzal hembra en zona norte',
    descripcion: 'Registro fotográfico de una hembra de quetzal construyendo nido en el árbol #17 del cuadrante B. Primer avistamiento de nidificación en esta zona.',
    fecha: '2025-05-28',
    autor: 'Dra. Valentina Mora',
    zona: 'Cuadrante B - Zona Norte',
    imageUrl: '/images/quetzal.png',
  },
  {
    id: 2,
    titulo: 'Monitoreo nocturno: actividad de jaguar',
    descripcion: 'Cámaras trampa captaron el desplazamiento de un macho adulto (aprox. 90kg) a lo largo del corredor sur. Estimamos una actividad de 4.2 km en la noche.',
    fecha: '2025-05-22',
    autor: 'M.C. Rodrigo Altamirano',
    zona: 'Corredor Sur',
    imageUrl: '/images/monitoreo_nocturno.png',
  },
  {
    id: 3,
    titulo: 'Calidad del agua en estanques de axolotl',
    descripcion: 'Medición semanal de parámetros. pH: 7.2, temperatura: 16°C, amoniaco: 0.02 ppm. Todo dentro de rangos óptimos. Se realizó cambio parcial del 15% del volumen.',
    fecha: '2025-05-19',
    autor: 'Biol. Ernesto Villanueva',
    zona: 'Laboratorio Acuático',
    imageUrl: '/images/calidad_agua_axolotl.png',
  },
  {
    id: 4,
    titulo: 'Plantación de especies nativas para reforestación',
    descripcion: 'Se plantaron 45 ejemplares de aguacate silvestre (Persea drymifolia) y 30 de mata palo (Ficus cotinifolia) en el área de expansión del santuario.',
    fecha: '2025-05-10',
    autor: 'Equipo de Voluntarios',
    zona: 'Área de Expansión',
    imageUrl: '/images/naturaleza.png',
  },
]

export default function DiarioDeCampoPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-14">
        <p className="text-conservation-gold font-semibold tracking-widest uppercase text-sm mb-3">Registro Científico</p>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-off-white">Diario de Campo</h1>
        <p className="text-off-white/50 mt-4 max-w-xl mx-auto">Seguimiento en tiempo real de las actividades de conservación y monitoreo en El Nido.</p>
      </div>

      <div className="space-y-6 max-w-4xl mx-auto">
        {entradas.map((entrada) => (
          <div key={entrada.id} className="flex gap-6 bg-forest-green-light/40 border border-white/10 rounded-2xl overflow-hidden hover:border-conservation-gold/30 transition-all duration-300">
            <div className="relative w-40 md:w-56 flex-shrink-0 hidden sm:block">
              <Image src={entrada.imageUrl} alt={entrada.titulo} fill className="object-cover" />
            </div>
            <div className="p-6 flex flex-col justify-center flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <span className="text-conservation-gold text-xs font-semibold flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5" /> {formatDate(entrada.fecha)}
                </span>
                <span className="text-off-white/40 text-xs flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5" /> {entrada.zona}
                </span>
              </div>
              <h2 className="text-lg font-bold text-off-white mb-2">{entrada.titulo}</h2>
              <p className="text-off-white/60 text-sm leading-relaxed">{entrada.descripcion}</p>
              <p className="text-off-white/30 text-xs mt-3">— {entrada.autor}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
