import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet: any[]) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data.user) {
      // Redirigir segun rol
      const adminSupabase = await createAdminSupabaseClient()
      const { data: perfil } = await adminSupabase
        .from('profiles')
        .select('role, admin_role')
        .eq('id', data.user.id)
        .single()

      if (perfil?.admin_role || perfil?.role === 'super_admin' || perfil?.role === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      return NextResponse.redirect(new URL('/guardian', request.url))
    }
  }

  return NextResponse.redirect(new URL('/login?error=auth', origin))
}
