import { species } from '@/lib/species';
import { IUCN_LABELS, IUCN_COLORS } from '@/lib/iucn';
import { formatCurrency } from '@/lib/utils';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Heart } from 'lucide-react';

export async function generateStaticParams() {
  return species.map((s) => ({ slug: s.id }));
}

interface Props { params: Promise<{ slug: string }> }

export default async function SpeciePage({ params }: Props) {
  const { slug } = await params;
  const specie = species.find((s) => s.id === slug);
  if (!specie) notFound();

  const iucnColor = IUCN_COLORS[specie.iucnStatus];
  const iucnLabel = IUCN_LABELS[specie.iucnStatus];

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <Link href="/apadrinar" className="inline-flex items-center gap-2 text-off-white/50 hover:text-off-white transition-colors text-sm mb-10">
        <ArrowLeft className="h-4 w-4" /> Volver a especies
      </Link>

      <div className="grid md:grid-cols-2 gap-12 items-start">
        {/* Image */}
        <div className="relative rounded-3xl overflow-hidden aspect-square shadow-2xl">
          <Image src={specie.imageUrl} alt={specie.name} fill className="object-cover" />
          <div
            className="absolute top-4 left-4 px-3 py-1.5 rounded-full text-white text-sm font-bold shadow-lg"
            style={{ backgroundColor: iucnColor + 'CC' }}
          >
            {specie.iucnStatus} · {iucnLabel}
          </div>
        </div>

        {/* Details */}
        <div>
          <p className="text-off-white/40 text-sm italic mb-1">{specie.scientificName}</p>
          <h1 className="text-5xl font-extrabold text-off-white tracking-tight mb-4">{specie.name}</h1>
          <p className="text-off-white/70 leading-relaxed mb-6">{specie.description}</p>

          <div className="flex items-center gap-2 text-off-white/50 text-sm mb-8">
            <MapPin className="h-4 w-4 text-conservation-gold" />
            {specie.habitat}
          </div>

          {/* Sponsorship card */}
          <div className="bg-forest-green-light/60 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
            <h2 className="text-2xl font-bold text-off-white mb-2">Sé su Guardián</h2>
            <p className="text-off-white/60 text-sm mb-5">
              Tu apadrinamiento mensual financia directamente el cuidado, la investigación y los esfuerzos de reintroducción del {specie.name} en su hábitat natural.
            </p>
            <div className="flex items-center justify-between mb-5">
              <div>
                <p className="text-off-white/40 text-xs">Contribución mensual</p>
                <p className="text-conservation-gold text-3xl font-extrabold">{formatCurrency(specie.monthlyAmount)}<span className="text-off-white/40 text-sm font-normal">/mes</span></p>
              </div>
            </div>
            <Link
              href="/donar"
              className="flex items-center justify-center gap-2 w-full bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-extrabold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] shadow-lg shadow-conservation-gold/20 text-lg"
            >
              <Heart className="h-5 w-5" /> ¡Quiero Apadrinar!
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
