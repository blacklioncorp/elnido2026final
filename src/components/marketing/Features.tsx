import Link from "next/link";
import { species } from "@/lib/species";

export default function Features() {
  return (
    <section className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <p className="text-conservation-gold font-semibold tracking-widest uppercase text-sm mb-3">Nuestros Residentes</p>
          <h2 className="text-4xl md:text-5xl font-extrabold tracking-tighter">Conoce a Quienes Proteges</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {species.map((animal) => (
            <div key={animal.id} className="group bg-forest-green-light/60 backdrop-blur-sm p-8 rounded-2xl shadow-lg hover:shadow-2xl border border-white/5 hover:border-conservation-gold/30 transition-all duration-500 flex flex-col">
              <h3 className="text-3xl font-bold text-conservation-gold mb-4">{animal.name}</h3>
              <p className="text-off-white/70 flex-grow mb-6 leading-relaxed">{animal.description}</p>
              <Link
                href={`/fauna/${animal.id}`}
                className="bg-transparent group-hover:bg-quetzal-blue/20 border-2 border-quetzal-blue text-off-white font-bold py-2 px-6 rounded-lg text-center transition-all duration-300 mt-auto"
              >
                Conocer más →
              </Link>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
