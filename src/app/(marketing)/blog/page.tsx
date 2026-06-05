import Image from 'next/image'
import Link from 'next/link'
import { blogPosts } from '@/lib/blog'
import { formatDate } from '@/lib/utils'
import { Clock, Tag } from 'lucide-react'

export default function BlogPage() {
  const [featured, ...rest] = blogPosts

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="text-center mb-14">
        <p className="text-conservation-gold font-semibold tracking-widest uppercase text-sm mb-3">Historias del Santuario</p>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-off-white">Blog</h1>
      </div>

      {/* Featured post */}
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

      {/* Post grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {rest.map((post) => (
          <Link key={post.slug} href={`/blog/${post.slug}`} className="group flex flex-col rounded-2xl overflow-hidden bg-forest-green-light/40 border border-white/10 hover:border-conservation-gold/30 transition-all duration-300 hover:shadow-xl hover:shadow-conservation-gold/5">
            <div className="relative h-48 overflow-hidden">
              <Image src={post.imageUrl} alt={post.title} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="h-3.5 w-3.5 text-conservation-gold" />
                <span className="text-conservation-gold text-xs font-semibold">{post.category}</span>
                <span className="text-off-white/30 text-xs ml-auto">{formatDate(post.date)}</span>
              </div>
              <h3 className="text-lg font-bold text-off-white group-hover:text-conservation-gold transition-colors mb-2">{post.title}</h3>
              <p className="text-off-white/60 text-sm leading-relaxed flex-1">{post.excerpt}</p>
              <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                <span className="text-off-white/40 text-xs">{post.author}</span>
                <span className="text-off-white/40 text-xs flex items-center gap-1"><Clock className="h-3 w-3" />{post.readTime} min</span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
