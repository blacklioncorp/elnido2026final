import { blogPosts } from '@/lib/blog'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { formatDate } from '@/lib/utils'
import { Clock, ArrowLeft, Tag } from 'lucide-react'

interface BlogPostPageProps {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  return blogPosts.map((p) => ({ slug: p.slug }))
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const { slug } = await params
  const post = blogPosts.find((p) => p.slug === slug)
  if (!post) notFound()

  return (
    <div className="container mx-auto px-4 py-16 max-w-3xl">
      <Link href="/blog" className="inline-flex items-center gap-2 text-off-white/50 hover:text-off-white transition-colors text-sm mb-8">
        <ArrowLeft className="h-4 w-4" /> Volver al Blog
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <span className="bg-conservation-gold text-forest-green-dark text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
          <Tag className="h-3 w-3" /> {post.category}
        </span>
        <span className="text-off-white/40 text-sm flex items-center gap-1">
          <Clock className="h-3.5 w-3.5" /> {post.readTime} min de lectura
        </span>
      </div>

      <h1 className="text-3xl md:text-5xl font-extrabold text-off-white tracking-tight leading-tight mb-4">{post.title}</h1>

      <div className="flex items-center gap-3 mb-8 pb-8 border-b border-white/10">
        <div className="w-10 h-10 rounded-full bg-quetzal-blue/30 flex items-center justify-center font-bold text-white text-sm">
          {post.author[0]}
        </div>
        <div>
          <p className="text-off-white font-medium text-sm">{post.author}</p>
          <p className="text-off-white/40 text-xs">{formatDate(post.date)}</p>
        </div>
      </div>

      <div className="relative h-72 md:h-96 rounded-2xl overflow-hidden mb-10">
        <Image src={post.imageUrl} alt={post.title} fill className="object-cover" />
      </div>

      <div className="prose prose-invert prose-lg max-w-none">
        {post.content.split('\n\n').map((paragraph, i) => (
          <p key={i} className="text-off-white/80 leading-relaxed mb-5">{paragraph}</p>
        ))}
      </div>

      <div className="mt-12 pt-8 border-t border-white/10 text-center">
        <p className="text-off-white/50 mb-4">¿Te interesa apoyar esta causa?</p>
        <Link href="/donar" className="inline-block bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-bold py-3 px-8 rounded-xl transition-all duration-300 hover:scale-105">
          Hacer una Donación
        </Link>
      </div>
    </div>
  )
}
