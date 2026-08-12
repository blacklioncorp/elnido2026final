// ─────────────────────────────────────────────────────────────
// PORTAL PÚBLICO — Roles de visitantes / guardianes
// ─────────────────────────────────────────────────────────────
export type UserRole = 'guardian' | 'admin' | 'super_admin'

export const ROLES: Record<UserRole, string> = {
  guardian: 'Guardián',
  admin: 'Administrador',
  super_admin: 'Super Administrador',
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  guardian: ['view_own_sponsorships', 'view_blog', 'view_fauna', 'update_own_profile'],
  admin: [
    'view_own_sponsorships', 'view_blog', 'view_fauna', 'update_own_profile',
    'manage_fauna', 'manage_blog', 'view_all_sponsorships', 'view_bitacora', 'manage_bitacora',
  ],
  super_admin: ['*'],
}

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role]
  return perms.includes('*') || perms.includes(permission)
}

export function getRoleLabel(role: UserRole): string {
  return ROLES[role] ?? role
}

// ─────────────────────────────────────────────────────────────
// PANEL ADMIN — Roles del equipo interno
// ─────────────────────────────────────────────────────────────
export type AdminRole = 'superadmin' | 'editor' | 'cuidador' | 'cajero'

export const ADMIN_ROLES: Record<AdminRole, string> = {
  superadmin: 'Super Admin',
  editor:     'Editor',
  cuidador:   'Cuidador',
  cajero:     'Cajero',
}

/** Módulos que cada rol puede acceder en el panel admin */
export const ADMIN_ROLE_MODULES: Record<AdminRole, string[]> = {
  superadmin: ['fauna','blog','bitacora','donativos','boletos','pos','reportes','cajas','configuracion','grupos','usuarios'],
  editor:     ['fauna','blog','bitacora','donativos','grupos'],
  cuidador:   ['bitacora'],
  cajero:     ['pos'],
}

export function adminCanAccess(role: AdminRole | null | undefined, modulo: string): boolean {
  if (!role) return false
  return ADMIN_ROLE_MODULES[role]?.includes(modulo) ?? false
}

export function getAdminRoleLabel(role: AdminRole | string): string {
  return ADMIN_ROLES[role as AdminRole] ?? role
}

/** Color badge para el rol en la UI */
export function getAdminRoleBadgeColor(role: AdminRole | string): string {
  const map: Record<string, string> = {
    superadmin: 'bg-conservation-gold/20 text-conservation-gold border-conservation-gold/30',
    editor:     'bg-quetzal-blue/20 text-quetzal-blue border-quetzal-blue/30',
    cuidador:   'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    cajero:     'bg-purple-500/20 text-purple-400 border-purple-500/30',
  }
  return map[role] ?? 'bg-white/10 text-off-white/60 border-white/10'
}

