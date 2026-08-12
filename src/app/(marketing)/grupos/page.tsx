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

  // Obtener imagen aleatoria para el header
  let headerImage = undefined;
  const { data: files } = await supabase.storage.from('especies').list()
  if (files && files.length > 0) {
    const images = files.filter(f => f.name.match(/\.(webp|jpg|jpeg|png)$/i))
    if (images.length > 0) {
      const cardImages = images.filter(f => f.name.includes('-card'))
      const pool = cardImages.length > 0 ? cardImages : images
      const randomImage = pool[Math.floor(Math.random() * pool.length)].name
      const { data } = supabase.storage.from('especies').getPublicUrl(randomImage)
      headerImage = data.publicUrl
    }
  }

  return (
    <GruposClient paquetes={(paquetes || []) as PaqueteEducativo[]} headerImage={headerImage} />
  )
}
