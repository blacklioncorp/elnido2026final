const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const { error } = await supabase
    .from('configuracion')
    .upsert({ clave: 'video_testimonial_url', valor: 'https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/video/historias_inspiran.mp4' }, { onConflict: 'clave' });
  console.log(error ? error : "Inserted config!");
}
test();
