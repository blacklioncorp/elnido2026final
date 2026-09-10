import type { Metadata } from 'next'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import type { TipoProducto } from '@/lib/boletos'
import BoletosClient from '@/components/boletos/BoletosClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata: Metadata = {
  title: 'Boletos y Membresías — El Nido',
  description:
    'Compra entradas, membresías Guardián y reserva eventos en el santuario El Nido.',
}

export default async function BoletosPage() {
  const supabase = await createAdminSupabaseClient()
  const [{ data: productosData }, { data: diasVentaData }] = await Promise.all([
    supabase
      .from('tipos_producto')
      .select('*')
      .eq('activo', true)
      .order('precio', { ascending: true }),
    supabase
      .from('dias_venta')
      .select('dia_semana, habilitado')
      .order('dia_semana', { ascending: true }),
  ])

  const productos: TipoProducto[] = productosData ?? []
  const entradas = productos.filter(
    (p) => p.categoria === 'entrada' || p.categoria === 'paquete_familiar',
  )
  const membresias = productos.filter((p) => p.categoria === 'membresia')
  const eventos = productos.filter((p) => p.categoria === 'evento')

  const diasHabilitados: number[] = diasVentaData
    ? diasVentaData.filter((d) => d.habilitado).map((d) => d.dia_semana)
    : [0, 1, 2, 3, 4, 5, 6]

  return (
    <div className="min-h-screen bg-off-white text-forest-green-dark">
      {/* Hero */}
      <section className="bg-forest-green-dark px-4 py-14 text-center text-off-white">
        <h1 className="text-3xl font-bold md:text-5xl">
          Elige tu experiencia en El Nido
        </h1>
        <p className="mt-3 text-off-white/70">
          Entradas, membresías y eventos
        </p>
      </section>

      <BoletosClient
        entradas={entradas}
        membresias={membresias}
        eventos={eventos}
        diasHabilitados={diasHabilitados}
      />
    </div>
  )
}
