const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data, error } = await supabase
    .from('donaciones')
    .select('*')
    .eq('donante_email', 'domohomeian@gmail.com')
  console.log("Donaciones:", data, error);
}
run();
