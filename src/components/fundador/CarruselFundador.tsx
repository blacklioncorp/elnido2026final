'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import Image from 'next/image';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const FOTOS = [
  {
    url: '/fundador/dr_ovalo.jpg',
    caption: 'Los años de formación: UNAM y Ohio State University',
  },
  {
    url: '/fundador/dr_en_pradera_boliviana.JPG',
    caption: '1975: Expedición en Bolivia donde descubrió Crax estudilloi',
  },
  {
    url: '/fundador/dr_con_hijo.JPG',
    caption: 'Familia y conservación: un legado compartido',
  },
  {
    url: '/fundador/dr_microscopio.JPG',
    caption: 'Ciencia al servicio de la vida silvestre',
  },
  {
    url: '/fundador/dr_con_nuevas_generaciones.JPG',
    caption: 'Educando a las nuevas generaciones',
  },
  {
    url: '/fundador/dr_con_avestruspolluelo.JPG',
    caption: 'El cuidado de cada individuo como esencia',
  },
  {
    url: '/fundador/dr_observando_legado.JPG',
    caption: 'Contemplando la vida que ayudó a proteger',
  },
  {
    url: '/fundador/dr-espaldas_de_perfil.JPG',
    caption: 'Su visión permanece viva en cada ave de El Nido',
  },
];

export default function CarruselFundador() {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [width, setWidth] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();

  useEffect(() => {
    const updateWidth = () => {
      if (carouselRef.current) {
        setWidth(carouselRef.current.scrollWidth - carouselRef.current.offsetWidth);
      }
    };
    
    // Slight delay to ensure images render and take up space
    setTimeout(updateWidth, 100);
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  const startAnimation = () => {
    if (width > 0) {
      controls.start({
        x: -width,
        transition: {
          duration: 30, // seconds for one full swipe
          ease: "linear",
          repeat: Infinity,
          repeatType: "reverse"
        }
      });
    }
  };

  useEffect(() => {
    if (width > 0 && !lightboxOpen) {
      startAnimation();
    } else {
      controls.stop();
    }
  }, [width, lightboxOpen]);

  const openLightbox = (index: number) => {
    setCurrentIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  const nextPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % FOTOS.length);
  };

  const prevPhoto = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + FOTOS.length) % FOTOS.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!lightboxOpen) return;
      if (e.key === 'ArrowRight') nextPhoto();
      if (e.key === 'ArrowLeft') prevPhoto();
      if (e.key === 'Escape') closeLightbox();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxOpen]);

  return (
    <div className="w-full relative overflow-hidden py-10 my-10">
      <motion.div ref={carouselRef} className="overflow-hidden w-full cursor-grab active:cursor-grabbing">
        <motion.div
          drag="x"
          dragConstraints={{ right: 0, left: -width }}
          animate={controls}
          onHoverStart={() => controls.stop()}
          onHoverEnd={startAnimation}
          onPanStart={() => controls.stop()}
          onPanEnd={startAnimation}
          className="flex w-max gap-6 px-4 md:px-8"
        >
          {FOTOS.map((foto, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.03 }}
              className="shrink-0 flex flex-col items-center gap-3"
              onClick={() => openLightbox(idx)}
            >
              <div className="relative w-72 h-64 md:w-96 md:h-80 rounded-2xl overflow-hidden shadow-lg border border-white/10">
                <Image
                  src={foto.url}
                  alt={foto.caption}
                  fill
                  sizes="(max-width: 768px) 288px, 384px"
                  className="object-cover pointer-events-none"
                />
              </div>
              <p className="text-sm text-white/70 text-center max-w-[280px] md:max-w-[360px] font-medium">
                {foto.caption}
              </p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>

      {/* Lightbox Modal */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-sm"
            onClick={closeLightbox}
          >
            <button
              className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors p-2 z-10"
              onClick={closeLightbox}
              title="Cerrar"
            >
              <X size={32} />
            </button>

            <button
              className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-4 z-10 hidden md:block"
              onClick={prevPhoto}
              title="Anterior"
            >
              <ChevronLeft size={48} />
            </button>

            <button
              className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors p-4 z-10 hidden md:block"
              onClick={nextPhoto}
              title="Siguiente"
            >
              <ChevronRight size={48} />
            </button>

            <div className="relative w-full max-w-5xl h-[60vh] md:h-[80vh]" onClick={(e) => e.stopPropagation()}>
              <Image
                src={FOTOS[currentIndex].url}
                alt={FOTOS[currentIndex].caption}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            
            <p className="text-white mt-6 text-lg text-center font-medium max-w-3xl px-4" onClick={(e) => e.stopPropagation()}>
              {FOTOS[currentIndex].caption}
            </p>

            {/* Mobile navigation buttons below image */}
            <div className="flex md:hidden items-center gap-8 mt-8" onClick={(e) => e.stopPropagation()}>
              <button className="text-white/70 hover:text-white p-2" onClick={prevPhoto}>
                <ChevronLeft size={32} />
              </button>
              <span className="text-white/50 text-sm">{currentIndex + 1} / {FOTOS.length}</span>
              <button className="text-white/70 hover:text-white p-2" onClick={nextPhoto}>
                <ChevronRight size={32} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
