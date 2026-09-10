import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function test() {
  const { data: tp } = await supabase.from('tipos_producto').select('id, nombre').limit(1)
  const { data: cl } = await supabase.from('clientes').select('id').limit(1)
  
  if (!tp || !cl) return console.log("Missing test data")

  const { data: compra } = await supabase.from('compras').insert({
    cliente_id: cl[0].id,
    tipo_producto_id: tp[0].id,
    cantidad_personas: 1,
    total: 100,
    estado: 'pendiente',
    metadata: {}
  }).select().single()

  console.log("Compra:", compra.id)

  const { data, error } = await supabase.from('compra_items').insert([{
    compra_id: compra.id,
    tipo_producto_id: tp[0].id,
    nombre: tp[0].nombre,
    cantidad: 1,
    precio_unitario: 100,
    categoria: "entrada",
    metadata: {}
  }])

  console.log("Insert Item:", { data, error })
}
test()
