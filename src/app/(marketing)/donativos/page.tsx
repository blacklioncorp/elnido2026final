import type { Metadata } from 'next'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import DonativosClient from './DonativosClient'
import { incrementarVistasTarjetas } from '@/app/actions/tracking'

export const metadata: Metadata = {
  title: 'Apadrina una Especie — El Nido',
  description:
    'Elige una historia, hazte Guardián y sigue el progreso de tu especie adoptada en el Santuario El Nido.',
}

export default async function DonativosPage() {
  const supabase = await createAdminSupabaseClient()
  
  // Track views in background
  incrementarVistasTarjetas()

  // Fetch active cards (max 5)
  const { data: tarjetas } = await supabase
    .from('tarjetas_donacion')
    .select('*')
    .eq('activa', true)
    .order('created_at', { ascending: false })
    .limit(5)

  // Fetch recent donors for each active card
  const tarjetaIds = (tarjetas ?? []).map((t) => t.id)

  const donantesMap: Record<
    string,
    Array<{
      donante_username: string | null
      donante_nombre: string
      monto: number
      created_at: string
    }>
  > = {}

  if (tarjetaIds.length > 0) {
    const { data: donaciones } = await supabase
      .from('donaciones')
      .select('tarjeta_id, donante_username, donante_nombre, monto, created_at')
      .in('tarjeta_id', tarjetaIds)
      .order('created_at', { ascending: false })

    if (donaciones) {
      for (const d of donaciones) {
        if (!d.tarjeta_id) continue
        if (!donantesMap[d.tarjeta_id]) donantesMap[d.tarjeta_id] = []
        if (donantesMap[d.tarjeta_id].length < 3) {
          donantesMap[d.tarjeta_id].push({
            donante_username: d.donante_username,
            donante_nombre: d.donante_nombre,
            monto: Number(d.monto),
            created_at: d.created_at,
          })
        }
      }
    }
  }

  const { data: config } = await supabase
    .from("configuracion")
    .select("valor")
    .eq("clave", "video_testimonial_url")
    .single();

  const videoUrl = config?.valor;

  return <DonativosClient tarjetas={tarjetas ?? []} donantesMap={donantesMap} videoUrl={videoUrl} />
}
