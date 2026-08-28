import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const supabase = createClient(supabaseUrl, supabaseKey)

async function getCols() {
  const { error: e3 } = await supabase.from('cotizaciones').insert({ 
    paquete_id: '1e19d77e-2e5f-4277-bc6d-d0e515d0ec36',
    nombre_contacto: 'test', 
    email_contacto: 'test@test.com',
    nombre_institucion: 'escuela test',
    numero_personas: 10,
    mensaje: 'test',
    fecha_deseada: '2026-09-02',
    estado: 'pendiente'
  })
  console.log(e3)
}
getCols()
