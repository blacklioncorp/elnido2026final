import Link from 'next/link';
import Image from 'next/image';

export default function Footer() {
  return (
    <footer className="bg-forest-green-light/30 backdrop-blur-sm border-t border-white/10 pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div className="md:col-span-1">
            <Image src="/logo.svg" alt="El Nido" width={100} height={36} className="h-9 w-auto mb-4" />
            <p className="text-off-white/50 text-sm leading-relaxed">Un santuario dedicado a la conservación de la fauna mexicana en peligro de extinción.</p>
          </div>

          <div>
            <h4 className="font-semibold text-sm text-off-white uppercase tracking-widest mb-4">Explorar</h4>
            <ul className="space-y-2.5">
              {[
                { href: '/fauna', label: 'Fauna' },
                { href: '/apadrinar', label: 'Apadrinar' },
                { href: '/blog', label: 'Blog' },
                { href: '/diario-de-campo', label: 'Diario de Campo' },
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
              {['Facebook', 'Instagram', 'Twitter / X'].map((name) => (
                <li key={name}><a href="#" className="text-off-white/50 hover:text-conservation-gold transition-colors text-sm">{name}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-off-white/30 text-sm">&copy; {new Date().getFullYear()} El Nido. Todos los derechos reservados.</p>
          <div className="flex gap-5 text-off-white/30 text-sm">
            <Link href="/contacto" className="hover:text-off-white/60 transition-colors">Contacto</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
