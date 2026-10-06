import { MetadataRoute } from 'next'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://www.elnido.mx'
  const supabase = await createAdminSupabaseClient()

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/quienes-somos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/mision-y-vision`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/fauna`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/donativos`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/donar`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/grupos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/diario-de-campo`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${baseUrl}/contacto`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${baseUrl}/guardian-info`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/politica-de-privacidad`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terminos-y-condiciones`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
  ]

  const { data: fauna } = await supabase
    .from('fauna')
    .select('slug, updated_at')
    .eq('activo', true)

  const faunaRoutes: MetadataRoute.Sitemap = (fauna || []).map((especie: any) => ({
    url: `${baseUrl}/fauna/${especie.slug}`,
    lastModified: especie.updated_at ? new Date(especie.updated_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.8,
  }))

  const { data: posts } = await supabase
    .from('blog')
    .select('slug, updated_at')
    .eq('publicado', true)

  const blogRoutes: MetadataRoute.Sitemap = (posts || []).map((post: any) => ({
    url: `${baseUrl}/blog/${post.slug}`,
    lastModified: post.updated_at ? new Date(post.updated_at) : new Date(),
    changeFrequency: 'monthly',
    priority: 0.6,
  }))

  return [...staticRoutes, ...faunaRoutes, ...blogRoutes]
}
