import { Metadata } from 'next'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import GruposAdminClient from '@/components/admin/GruposAdminClient'
import { PaqueteEducativo, Cotizacion } from '@/types/grupos'

export const metadata: Metadata = {
  title: 'Admin - Paquetes Educativos',
}

export const dynamic = 'force-dynamic'

export default async function AdminGruposPage() {
  const supabase = await createAdminSupabaseClient()

  // Obtener paquetes
  const { data: paquetes } = await supabase
    .from('paquetes_educativos')
    .select('*')
    .order('created_at', { ascending: true })

  // Obtener cotizaciones (con info del paquete opcional)
  const { data: cotizaciones } = await supabase
    .from('cotizaciones')
    .select(`
      *,
      paquetes_educativos (
        nombre
      )
    `)
    .order('created_at', { ascending: false })

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-off-white">Paquetes Educativos</h1>
        <p className="text-off-white/60 text-sm">Gestión de paquetes para escuelas y cotizaciones</p>
      </div>

      <GruposAdminClient 
        initialPaquetes={(paquetes || []) as PaqueteEducativo[]} 
        initialCotizaciones={(cotizaciones || []) as any[]} 
      />
    </div>
  )
}
