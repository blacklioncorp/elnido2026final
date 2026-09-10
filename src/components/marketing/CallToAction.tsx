import Link from "next/link";

export default function CallToAction() {
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-quetzal-blue/20 via-forest-green-light to-forest-green-dark" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--color-conservation-gold)_0%,_transparent_60%)] opacity-10" />

      <div className="relative z-10 container mx-auto px-4 text-center">
        <p className="text-conservation-gold font-semibold tracking-widest uppercase text-sm mb-4">
          Actúa Hoy
        </p>
        <h2 className="text-4xl md:text-6xl font-extrabold text-white tracking-tighter mb-6">
          Tu Contribución es Esencial
        </h2>
        <p className="max-w-2xl mx-auto text-lg text-off-white/70 mb-10 leading-relaxed">
          Cada donación, grande o pequeña, nos ayuda a proporcionar cuidados
          críticos, expandir nuestros esfuerzos de conservación y educar al
          público. Juntos, podemos asegurar un futuro para la fauna de México.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/donar"
            className="w-full sm:w-auto bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-bold py-4 px-10 rounded-xl transition-all duration-300 hover:scale-105 shadow-lg shadow-conservation-gold/20 text-lg"
          >
            Hacer una Donación
          </Link>
          <Link
            href="/contacto"
            className="w-full sm:w-auto bg-transparent hover:bg-white/10 border-2 border-white/30 hover:border-white/60 text-white font-bold py-4 px-10 rounded-xl transition-all duration-300 text-lg"
          >
            Contáctanos
          </Link>
        </div>
      </div>
    </section>
  );
}
