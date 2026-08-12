import { getPosts } from '@/app/actions/blog'
import BlogAdminClient from './BlogAdminClient'
import type { Database } from '@/lib/database.types'

export const dynamic = 'force-dynamic'

type BlogPost = Database['public']['Tables']['blog']['Row']

export default async function AdminBlogPage() {
  let posts: BlogPost[] = []
  try {
    posts = await getPosts()
  } catch { /* DB no configurada aún */ }

  return <BlogAdminClient inicial={posts} />
}
