import HeroCinematico from "@/components/home/HeroCinematico";
import Features from "@/components/marketing/Features";
import CallToAction from "@/components/marketing/CallToAction";
import VideoTestimonial from "@/components/home/VideoTestimonial";
import { createAdminSupabaseClient } from "@/lib/supabase-server";
import Link from "next/link";
import Image from "next/image";

export default async function HomePage() {
  const supabase = await createAdminSupabaseClient();
  const { data: config } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "video_testimonial_url")
    .single();

  const videoUrl = config?.valor;

  const heroImages: string[] = [
    "https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/Hero/1_Quetzal_Chucho.svg",
    "https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/Hero/2_hero.svg",
    "https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/Hero/3_Jaguar_Samba.svg",
    "https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/Hero/4_hero_grupoos.svg",
    "https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/Hero/5_Guacamaya_Jacinta.svg"
  ];

  return (
    <>
      <HeroCinematico initialImages={heroImages} />

      {/* Sección del Fundador */}
      <section className="py-24 bg-off-white text-forest-green-dark">
        <div className="container mx-auto px-4 max-w-4xl text-center">
          <div className="w-[180px] h-[180px] mx-auto rounded-full shadow-xl border-4 border-conservation-gold mb-8 relative overflow-hidden">
            <Image
              src="https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/fundador/dr-espaldas_de_perfil.JPG"
              alt="Dr. Jesús Estudillo López"
              fill
              className="object-cover"
              sizes="180px"
            />
          </div>
          
          <p className="text-xl md:text-2xl italic font-serif leading-relaxed mb-8">
            "Servir a la vida, protegerla y despertar en cada persona el deseo de cuidarla"
          </p>
          
          <div className="mb-10">
            <h3 className="text-2xl font-bold">Dr. Jesús Estudillo López</h3>
            <p className="text-forest-green-dark/70 mt-1">Fundador | Ornitólogo | Conservacionista</p>
          </div>
          
          <Link
            href="/quienes-somos"
            className="inline-block rounded-full border-2 border-conservation-gold px-8 py-3 font-semibold text-conservation-gold transition-colors hover:bg-conservation-gold hover:text-forest-green-dark"
          >
            Conoce su historia &rarr;
          </Link>
        </div>
      </section>

      <VideoTestimonial
        videoUrl="https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/video/historias_que-Inspiran2.mp4"
        frase="Miles de familias ya vivieron la experiencia"
        ctaTexto="Quiero organizar una visita"
        ctaLink="/grupos"
      />
      <Features />
      <CallToAction />
    </>
  );
}
