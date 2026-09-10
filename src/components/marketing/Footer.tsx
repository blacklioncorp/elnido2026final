import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-forest-green-light/30 backdrop-blur-sm border-t border-white/10 pt-16 pb-8">
      <div className="container mx-auto px-4">
        {/* Mini-banner Visítanos */}
        <div className="mb-12 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white/5 border border-white/10 rounded-2xl p-4 sm:px-6 hover:bg-white/[0.08] transition-colors">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <span className="text-2xl">📍</span>
            <div>
              <p className="font-bold text-off-white text-sm sm:text-base">Visítanos en Ixtapaluca</p>
              <p className="text-off-white/60 text-xs">C. Progreso S/N, Santa Barbara, Ixtapaluca, Edo. Méx.</p>
            </div>
          </div>
          <Link
            href="/contacto"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-conservation-gold text-forest-green-dark text-xs sm:text-sm font-extrabold hover:bg-yellow-400 transition-all duration-200 hover:scale-105 shadow-md"
          >
            <span>📍 Visítanos en Ixtapaluca</span>
            <span>→</span>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <Image src="/images/LOGO-ELNIDO-blanco.webp" alt="El Nido" width={100} height={36} className="mb-4 object-contain" style={{ width: 'auto', height: '36px' }} />
            <p className="text-off-white/50 text-sm leading-relaxed">Un santuario dedicado a la conservación de la fauna mexicana en peligro de extinción.</p>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-off-white uppercase tracking-widest mb-4">Explorar</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/quienes-somos', label: 'Quiénes Somos' },
                { href: '/mision-y-vision', label: 'Misión y Visión' },
                { href: '/fauna', label: 'Fauna' },
                { href: '/apadrinar', label: 'Apadrinar' },
                // TODO: Reactivar cuando tenga contenido - Blog
                // { href: '/blog', label: 'Blog' },
                // TODO: Reactivar cuando tenga contenido - Diario de Campo
                // { href: '/diario-de-campo', label: 'Diario de Campo' },
              ].map(({ href, label }) => (
                <li key={href}><Link href={href} className="text-off-white/50 hover:text-conservation-gold transition-colors text-sm">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-off-white uppercase tracking-widest mb-4">Apoyar</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/donar', label: 'Hacer una Donación' },
                { href: '/apadrinar', label: 'Programa de Apadrinamiento' },
                { href: '/contacto', label: 'Contacto' },
              ].map(({ href, label }) => (
                <li key={href}><Link href={href} className="text-off-white/50 hover:text-conservation-gold transition-colors text-sm">{label}</Link></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-off-white uppercase tracking-widest mb-4">Redes</h4>
            <ul className="space-y-2.5">
              <li>
                <a href="https://www.facebook.com/santuarioelnido" target="_blank" rel="noopener noreferrer" className="text-off-white/50 hover:text-conservation-gold transition-colors text-sm">
                  Facebook
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-off-white/30 text-sm">&copy; {new Date().getFullYear()} El Nido. Todos los derechos reservados.</p>
          <div className="flex gap-5 text-off-white/30 text-sm">
            <Link href="/politica-de-privacidad" className="hover:text-off-white/60 transition-colors">Política de Privacidad</Link>
            <Link href="/terminos-y-condiciones" className="hover:text-off-white/60 transition-colors">Términos y Condiciones</Link>
            <Link href="/contacto" className="hover:text-off-white/60 transition-colors">Contacto</Link>
          </div>
        </div>
        
        <div className="mt-8 text-center text-sm text-muted-foreground opacity-50">
          <p className="italic">"Servir a la vida, protegerla."</p>
          <p className="mt-1">— Dr. Jesús Estudillo López</p>
        </div>
      </div>
    </footer>
  );
}
