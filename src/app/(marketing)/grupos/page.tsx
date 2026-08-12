import { Metadata } from 'next'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import GruposClient from '@/components/grupos/GruposClient'
import { PaqueteEducativo } from '@/types/grupos'

export const metadata: Metadata = {
  title: 'Paquetes Educativos | El Nido',
  description: 'Descubre nuestros paquetes educativos diseñados para escuelas, desde preescolar hasta licenciatura. Una experiencia vivencial con la fauna mexicana.',
}

export const revalidate = 60 // revalidate every minute

export default async function GruposPage() {
  const supabase = await createAdminSupabaseClient()

  const { data: paquetes } = await supabase
    .from('paquetes_educativos')
    .select('*')
    .eq('activo', true)
    .order('created_at', { ascending: true })

  return (
    <GruposClient paquetes={(paquetes || []) as PaqueteEducativo[]} />
  )
}
