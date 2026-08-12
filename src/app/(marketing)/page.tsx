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

  let heroImages: string[] = [];
  try {
    const { data: imageFiles, error: storageError } = await supabase.storage.from("especies").list();
    if (!storageError && imageFiles) {
      const validExtensions = [".webp", ".jpg", ".jpeg", ".png"];
      heroImages = imageFiles
        .filter((file) => validExtensions.some((ext) => file.name.toLowerCase().endsWith(ext)))
        .slice(0, 5)
        .map((file) => supabase.storage.from("especies").getPublicUrl(file.name).data.publicUrl);
    }
  } catch (error) {
    console.error("Error cargando imágenes del Hero:", error);
  }

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
