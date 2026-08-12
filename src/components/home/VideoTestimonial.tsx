'use client';
import { useState, useRef } from 'react';
export default function VideoTestimonial({ 
  videoUrl, 
  frase, 
  ctaTexto, 
  ctaLink 
}: {
  videoUrl?: string | null;
  frase: string;
  ctaTexto: string;
  ctaLink: string;
}) {
  if (!videoUrl) return null;
  
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted;
      setIsMuted(videoRef.current.muted);
    }
  };

  return (
    <section className="py-16 bg-forest-green-dark">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl font-bold text-off-white mb-2">Historias que Inspiran</h2>
        <p className="text-conservation-gold mb-8">{frase}</p>
        <div className="max-w-3xl mx-auto rounded-2xl overflow-hidden shadow-2xl relative group">
          <video 
            ref={videoRef}
            autoPlay 
            muted={isMuted} 
            loop 
            playsInline 
            controlsList="nodownload"
            onContextMenu={(e) => e.preventDefault()}
            className="w-full"
          >
            <source src={videoUrl} type="video/webm" />
            <source src={videoUrl} type="video/mp4" />
          </video>
          
          <button
            onClick={toggleMute}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur text-off-white font-medium py-2 px-6 rounded-full hover:bg-black/80 transition-all shadow-lg border border-white/10"
          >
            {isMuted ? '🔇 Escuchar testimonio' : '🔊 Silenciar'}
          </button>
        </div>
        <a href={ctaLink} className="inline-block mt-8 bg-conservation-gold text-forest-green-dark px-8 py-4 rounded-full font-semibold text-lg hover:bg-opacity-90 transition-all">
          {ctaTexto}
        </a>
      </div>
    </section>
  );
}
