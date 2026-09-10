import SpecieCard from "@/components/apadrinar/SpecieCard";
import { species } from "@/lib/species";

export default function ApadrinarPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-14">
        <p className="text-conservation-gold font-semibold tracking-widest uppercase text-sm mb-3">Programa de Apadrinamiento</p>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-off-white">Apadrina una Especie</h1>
        <p className="text-off-white/50 mt-4 max-w-xl mx-auto">
          Tu contribución mensual financia directamente el cuidado, la investigación y la reintroducción de estas especies en su hábitat natural.
        </p>
      </div>
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {species.map((specie, i) => (
          <SpecieCard key={specie.id} specie={specie} index={i} />
        ))}
      </div>
    </div>
  );
}
