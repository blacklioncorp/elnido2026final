import { createAdminSupabaseClient } from './src/lib/supabase-server'

async function run() {
  try {
    const admin = await createAdminSupabaseClient()
    const { data, error } = await admin.from('compra_items').insert([
      {
        compra_id: "4f55bcd2-fd48-4f77-b267-4b5b1069255a", // existing compra
        tipo_producto_id: "db23070c-d76e-4da5-b480-a2267b203c9e", // from screenshot
        nombre: "Test Product",
        cantidad: 1,
        precio_unitario: 380,
        categoria: "entrada",
        metadata: {}
      }
    ]).select()
    console.log("INSERT RESULT:", { data, error })
  } catch (e) {
    console.error("EXCEPTION:", e)
  }
}

run()
