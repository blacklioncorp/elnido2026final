const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function test() {
  const filtros = { desde: '2026-07-06', hasta: '2026-08-05', cajaId: 'todas', categoria: 'todos', metodoPago: 'todos' };
  
  let filasReporte = [];
  
  // 1. compras (Boletera Online)
  const { data: comprasData } = await supabase
      .from('compras')
      .select('*, compra_items(*)')
      .in('estado', ['completado', 'activado'])
      .gte('created_at', `${filtros.desde}T00:00:00Z`)
      .lte('created_at', `${filtros.hasta}T23:59:59Z`)
  
  for (const compra of comprasData || []) {
      for (const item of compra.compra_items || []) {
          filasReporte.push({ id: item.id, caja: 'Boletera Online', total: item.cantidad * item.precio_unitario });
      }
  }
  
  // 2. donaciones
  const { data: donacionesData } = await supabase
      .from('donaciones')
      .select('*, tarjetas_donacion(nombre_especie)')
      .gte('created_at', `${filtros.desde}T00:00:00Z`)
      .lte('created_at', `${filtros.hasta}T23:59:59Z`)
      
  if (donacionesData) {
      for (const d of donacionesData) {
          filasReporte.push({ id: d.id, caja: 'Donativo Online', total: d.monto, categoria: d.origen === 'donativos' ? 'donacion_especie' : 'donacion_generica' });
      }
  }
  
  const totalDonaciones = filasReporte
    .filter(f => f.categoria === 'donacion_generica' || f.categoria === 'donacion_especie')
    .reduce((acc, f) => acc + Number(f.total), 0)
    
  console.log('Total Filas:', filasReporte.length);
  console.log('Total Donaciones:', totalDonaciones);
}

test();
