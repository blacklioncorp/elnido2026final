import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { ADMIN_ROLE_MODULES, type AdminRole } from '@/lib/roles'

const AUTH_ROUTES = ['/login', '/registro']
const ADMIN_ROUTES = ['/admin']
const GUARDIAN_ROUTES = ['/guardian']

/**
 * Mapa de rutas específicas de admin → módulo requerido.
 * Si la ruta no aparece aquí, solo se verifica que el usuario tenga ALGÚN admin_role.
 */
const ROUTE_MODULE_MAP: Record<string, string> = {
  '/admin/fauna':        'fauna',
  '/admin/blog':         'blog',
  '/admin/bitacora':     'bitacora',
  '/admin/donativos':    'donativos',
  '/admin/apadrinamientos': 'donativos',
  '/admin/usuarios':     'usuarios',
  '/admin/grupos':       'grupos',
  '/admin/caja':         'pos',
  '/admin/cajas':        'cajas',
  '/admin/reportes':     'reportes',
  '/admin/configuracion':'configuracion',
  '/admin/cupo':         'boletos',
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  let response = NextResponse.next({ request })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseKey) return response

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() { return request.cookies.getAll() },
      setAll(cookiesToSet: { name: string; value: string; options?: object }[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options as Parameters<typeof response.cookies.set>[2])
        )
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()

  // Si logueado intenta ir a /login → redirigir según rol
  if (user && AUTH_ROUTES.some(r => pathname.startsWith(r))) {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const queryClient = serviceKey ? createServerClient(supabaseUrl, serviceKey, {
      cookies: { getAll: () => [], setAll: () => {} }
    }) : supabase

    const { data: profile } = await queryClient
      .from('profiles').select('role, admin_role').eq('id', user.id).single()
    const role = (profile as any)?.role ?? 'admin'
    const adminRole = (profile as any)?.admin_role
    const dest = (role === 'admin' || role === 'super_admin' || adminRole) ? '/admin' : '/guardian'
    return NextResponse.redirect(new URL(dest, request.url))
  }

  const logAccess = async (queryClient: any, email: string, exito: boolean) => {
    const ip = request.headers.get('x-forwarded-for') ?? 'unknown'
    const userAgent = request.headers.get('user-agent') ?? 'unknown'
    try {
      const { error } = await queryClient.from('logs_acceso').insert({
        email,
        accion: 'acceso_admin',
        ruta: pathname,
        ip,
        user_agent: userAgent,
        exito
      })
      if (error) console.error('Error insertando log de acceso:', error)
    } catch (e) {
      console.error('Excepción insertando log de acceso:', e)
    }
  }


  // Caja es pública sin login (para cajeros con acceso físico)
  if (pathname.startsWith('/admin/caja') && !pathname.startsWith('/admin/cajas')) {
    return response
  }

  // Rutas admin: requieren sesión + admin_role
  if (ADMIN_ROUTES.some(r => pathname.startsWith(r))) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const queryClient = serviceKey ? createServerClient(supabaseUrl, serviceKey, {
      cookies: { getAll: () => [], setAll: () => {} }
    }) : supabase

    const { data: profile } = await queryClient
      .from('profiles').select('role, admin_role, activo').eq('id', user.id).single()

    const role = (profile as any)?.role ?? null
    const adminRole = (profile as any)?.admin_role as AdminRole | null
    const activo = (profile as any)?.activo !== false

    if (!activo) return NextResponse.redirect(new URL('/login?error=account_disabled', request.url))

    // Dashboard es accesible para cualquiera con admin_role o role admin/super_admin
    if (pathname === '/admin') {
      if (!adminRole && !['admin','super_admin'].includes(role ?? '')) {
        await logAccess(queryClient, user.email ?? 'unknown', false)
        return NextResponse.redirect(new URL('/guardian', request.url))
      }
      await logAccess(queryClient, user.email ?? 'unknown', true)
      return response
    }

    // Para rutas específicas, verificar módulo
    const moduloRequerido = Object.entries(ROUTE_MODULE_MAP).find(
      ([routePrefix]) => pathname.startsWith(routePrefix)
    )?.[1]

    if (moduloRequerido && adminRole) {
      const modulos = ADMIN_ROLE_MODULES[adminRole] ?? []
      if (!modulos.includes(moduloRequerido)) {
        // Sin acceso → redirigir al dashboard con mensaje
        await logAccess(queryClient, user.email ?? 'unknown', false)
        return NextResponse.redirect(new URL('/admin?error=no_permission', request.url))
      }
    } else if (!adminRole && !['admin','super_admin'].includes(role ?? '')) {
      await logAccess(queryClient, user.email ?? 'unknown', false)
      return NextResponse.redirect(new URL('/guardian', request.url))
    }
    
    await logAccess(queryClient, user.email ?? 'unknown', true)
  }

  // Rutas de guardian: requiere sesión activa
  if (GUARDIAN_ROUTES.some(r => pathname.startsWith(r))) {
    if (!user) return NextResponse.redirect(new URL('/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|logo.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
