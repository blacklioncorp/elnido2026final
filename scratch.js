require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
async function test() {
  const { data, error } = await supabase.from('cotizaciones').insert({
    paquete_id: 'a0b98eb6-a36c-4ec7-9dd6-9e96f1b3e514', // A valid UUID
    cliente_nombre: 'test',
    cliente_email: 'test@test.com',
    escuela: 'test',
    personas: 30,
    incluye_lunch: false,
    estado: 'pendiente'
  })
  console.log('Error:', error)
}
test()
