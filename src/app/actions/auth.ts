'use server'

import { headers } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { loginLimiter } from '@/lib/rate-limit'

export async function loginWithPassword(prevState: unknown, formData: FormData) {
  const h = await headers()
  const ip = h.get('x-forwarded-for') ?? 'unknown'
  const rateLimit = loginLimiter.check(ip)
  
  if (!rateLimit.success) {
    return { success: false, error: 'Demasiados intentos. Espera 5 minutos.' }
  }

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Email y contraseña son requeridos.' }
  }

  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll() },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {}
        },
      },
    }
  )

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    return { success: false, error: error.message }
  }

  return { success: true }
}
