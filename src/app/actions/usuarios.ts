'use server'

import { revalidatePath } from 'next/cache'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import type { AdminRole } from '@/lib/database.types'

export type UsuariosResult = { success: true } | { error: string }

// ─── Queries ─────────────────────────────────────────────────

/** Lista todos los perfiles con admin_role asignado */
export async function getUsuariosAdmin() {
  const supabase = await createAdminSupabaseClient()

  // Traer perfiles con admin_role (incluyendo los sin rol para gestión)
  const { data: perfiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, email, admin_role, activo, created_at, role')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  return perfiles ?? []
}

// ─── Mutations ────────────────────────────────────────────────

/**
 * Invita a un nuevo usuario vía Supabase Admin.
 * Supabase enviará el email de invitación automáticamente.
 */
export async function invitarUsuario(
  email: string,
  nombre: string,
  adminRole: AdminRole,
): Promise<UsuariosResult> {
  if (!email || !nombre || !adminRole) return { error: 'Todos los campos son requeridos' }

  const supabase = await createAdminSupabaseClient()

  // Invitar usuario via Supabase Auth Admin
  const { data: authData, error: authError } = await supabase.auth.admin.inviteUserByEmail(email, {
    data: { full_name: nombre },
    redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/login`,
  })

  if (authError) return { error: authError.message }
  if (!authData?.user) return { error: 'No se pudo crear el usuario' }

  // Crear o actualizar perfil con admin_role
  const { error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id:         authData.user.id,
      email,
      full_name:  nombre,
      admin_role: adminRole,
      activo:     true,
      role:       'admin', // rol público default
    })

  if (profileError) return { error: profileError.message }
  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function cambiarRolAdmin(userId: string, adminRole: AdminRole | null): Promise<UsuariosResult> {
  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase
    .from('profiles')
    .update({ admin_role: adminRole })
    .eq('id', userId)
  if (error) return { error: error.message }
  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function toggleUsuarioActivo(userId: string, activo: boolean): Promise<UsuariosResult> {
  const supabase = await createAdminSupabaseClient()
  const { error } = await supabase
    .from('profiles')
    .update({ activo })
    .eq('id', userId)
  if (error) return { error: error.message }

  // También deshabilitar/habilitar en Supabase Auth
  try {
    await supabase.auth.admin.updateUserById(userId, { ban_duration: activo ? 'none' : '87600h' })
  } catch { /* non-blocking */ }

  revalidatePath('/admin/usuarios')
  return { success: true }
}

export async function deleteUsuarioAdmin(userId: string): Promise<UsuariosResult> {
  const supabase = await createAdminSupabaseClient()

  // Protección: no eliminar si es el último superadmin
  const { data: superadmins } = await supabase
    .from('profiles')
    .select('id')
    .eq('admin_role', 'superadmin')
    .eq('activo', true)

  const esSuperadmin = (superadmins ?? []).some(p => p.id === userId)
  if (esSuperadmin && (superadmins?.length ?? 0) <= 1) {
    return { error: 'No puedes eliminar al último superadmin del sistema' }
  }

  // Eliminar de Auth (cascadea a profiles)
  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) return { error: error.message }

  revalidatePath('/admin/usuarios')
  return { success: true }
}
