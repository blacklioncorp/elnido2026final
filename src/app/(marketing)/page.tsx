import HeroCinematico from "@/components/home/HeroCinematico";
import Features from "@/components/marketing/Features";
import CallToAction from "@/components/marketing/CallToAction";
import VideoTestimonial from "@/components/home/VideoTestimonial";
import { createAdminSupabaseClient } from "@/lib/supabase-server";

export default async function HomePage() {
  const supabase = await createAdminSupabaseClient();
  const { data: config } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "video_testimonial_url")
    .single();

  const videoUrl = config?.valor;

  const heroImages: string[] = [
    "https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/especies/Quetzal-Chucho.svg",
    "https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/especies/Guacamaya-Jacinta.svg",
    "https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/especies/Flamingo.svg",
    "https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/especies/Jaguar-(Samba).svg",
    "https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/especies/tucan.webp"
  ];

  return (
    <>
      <HeroCinematico initialImages={heroImages} />
      <VideoTestimonial
        videoUrl={videoUrl}
        frase="Miles de familias ya vivieron la experiencia"
        ctaTexto="Quiero organizar una visita"
        ctaLink="/grupos"
      />
      <Features />
      <CallToAction />
    </>
  );
}
