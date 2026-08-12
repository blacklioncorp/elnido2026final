const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
supabase.from('donaciones').select('*, tarjetas_donacion(nombre_especie)').then(({data, error}) => {
  console.log('Error:', error);
  console.log('Data count:', data ? data.length : 0);
});
