'use client';

import { useState, useRef } from 'react';

export default function VideoTestimonial({ 
  videoUrl, 
  titulo = "Del Nido al Vuelo",
  frase = "Cada rescate y cuidado en El Nido tiene un propósito supremo: devolver a las especies su libertad y reinsertarlas con amor en su hábitat natural.", 
  ctaTexto = "Apadrinar una especie", 
  ctaLink = "#del-nido-al-vuelo" 
}: {
  videoUrl?: string | null;
  titulo?: string;
  frase?: string;
  ctaTexto?: string;
  ctaLink?: string;
}) {
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  if (!videoUrl) return null;

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <section className="py-16 bg-forest-green-dark">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-off-white mb-3">{titulo}</h2>
        <p className="text-conservation-gold max-w-2xl mx-auto mb-8 text-sm md:text-base leading-relaxed italic">
          {frase}
        </p>
        <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl relative group border border-white/10">
          <video 
            ref={videoRef}
            src={videoUrl}
            autoPlay 
            muted={isMuted} 
            loop 
            playsInline 
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            className="w-full h-auto object-cover"
          >
            <source src={videoUrl} type="video/webm" />
            <source src={videoUrl} type="video/mp4" />
          </video>
          
          <button
            onClick={toggleMute}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md text-off-white font-semibold text-xs md:text-sm py-2.5 px-6 rounded-full hover:bg-black/90 transition-all shadow-lg border border-white/20"
          >
            {isMuted ? '🔇 Escuchar testimonio' : '🔊 Silenciar'}
          </button>
        </div>
        <a 
          href={ctaLink} 
          className="inline-block mt-8 bg-conservation-gold text-forest-green-dark px-8 py-3.5 rounded-full font-bold text-base hover:bg-conservation-gold/90 transition-all shadow-lg"
        >
          {ctaTexto}
        </a>
      </div>
    </section>
  );
}
