import Image from 'next/image'
import Link from 'next/link'
import { blogPosts } from '@/lib/blog'
import { getPostsPublicados } from '@/app/actions/blog'
import { formatDate } from '@/lib/utils'
import { getOptimizedUrl } from '@/lib/utils'
import { Clock, Tag, BookOpen } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function BlogPage() {
  // Intentar cargar desde Supabase, fallback a estáticos
  let dbPosts: any[] = []
  try {
    dbPosts = await getPostsPublicados()
  } catch { /* fallback */ }

  const useDB = dbPosts.length > 0

  if (useDB) {
    const [featured, ...rest] = dbPosts
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-14">
          <p className="text-conservation-gold font-semibold tracking-widest uppercase text-sm mb-3">Historias del Santuario</p>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-off-white">Blog</h1>
        </div>

        {featured && (
          <Link href={`/blog/${featured.slug}`} className="group block mb-12">
            <div className="relative rounded-3xl overflow-hidden h-80 md:h-[480px]">
              {featured.imagen_url
                ? <Image src={getOptimizedUrl(featured.imagen_url, 'large')} alt={featured.titulo} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
                : <div className="h-full bg-forest-green-light/40 flex items-center justify-center"><BookOpen className="h-16 w-16 text-off-white/20" /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-forest-green-dark via-forest-green-dark/40 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
                <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight group-hover:text-conservation-gold transition-colors">{featured.titulo}</h2>
                {featured.excerpt && <p className="text-off-white/70 mt-2 max-w-2xl hidden md:block">{featured.excerpt}</p>}
                <p className="text-off-white/40 text-sm mt-2">{formatDate(featured.created_at)}</p>
              </div>
            </div>
          </Link>
        )}

        {rest.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {rest.map((post: any) => (
              <Link key={post.id} href={`/blog/${post.slug}`}
                className="group bg-forest-green-light/20 border border-white/10 rounded-2xl overflow-hidden hover:border-conservation-gold/40 transition-all duration-300 hover:-translate-y-1">
                <div className="relative h-48 overflow-hidden">
                  {post.imagen_url
                    ? <Image src={getOptimizedUrl(post.imagen_url, 'card')} alt={post.titulo} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                    : <div className="h-full bg-forest-green-light/40 flex items-center justify-center"><BookOpen className="h-8 w-8 text-off-white/20" /></div>}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-off-white group-hover:text-conservation-gold transition-colors mb-2 line-clamp-2">{post.titulo}</h3>
                  {post.excerpt && <p className="text-off-white/50 text-sm line-clamp-2 mb-3">{post.excerpt}</p>}
                  <p className="text-off-white/30 text-xs">{formatDate(post.created_at)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Fallback datos estáticos ──
  const [featured, ...rest] = blogPosts
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-14">
        <p className="text-conservation-gold font-semibold tracking-widest uppercase text-sm mb-3">Historias del Santuario</p>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-off-white">Blog</h1>
      </div>

      <Link href={`/blog/${featured.slug}`} className="group block mb-12">
        <div className="relative rounded-3xl overflow-hidden h-80 md:h-[480px]">
          <Image src={featured.imageUrl} alt={featured.title} fill className="object-cover group-hover:scale-105 transition-transform duration-700" />
          <div className="absolute inset-0 bg-gradient-to-t from-forest-green-dark via-forest-green-dark/40 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <div className="flex items-center gap-3 mb-3">
              <span className="bg-conservation-gold text-forest-green-dark text-xs font-bold px-3 py-1 rounded-full">{featured.category}</span>
              <span className="text-off-white/50 text-sm flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{featured.readTime} min</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight group-hover:text-conservation-gold transition-colors">{featured.title}</h2>
            <p className="text-off-white/70 mt-2 max-w-2xl hidden md:block">{featured.excerpt}</p>
          </div>
        </div>
      </Link>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {rest.map(post => (
          <Link key={post.slug} href={`/blog/${post.slug}`}
            className="group bg-forest-green-light/20 border border-white/10 rounded-2xl overflow-hidden hover:border-conservation-gold/40 transition-all duration-300 hover:-translate-y-1">
            <div className="relative h-48 overflow-hidden">
              <Image src={post.imageUrl} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-5">
              <div className="flex items-center gap-2 mb-2">
                <span className="bg-conservation-gold/20 text-conservation-gold text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1"><Tag className="h-2.5 w-2.5" />{post.category}</span>
                <span className="text-off-white/40 text-xs flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime} min</span>
              </div>
              <h3 className="text-lg font-bold text-off-white group-hover:text-conservation-gold transition-colors mb-2">{post.title}</h3>
              <p className="text-off-white/50 text-sm line-clamp-2">{post.excerpt}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
