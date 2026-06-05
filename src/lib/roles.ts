// Roles y permisos del sistema El Nido
// TODO: Integrar con Supabase Auth y tabla de perfiles

export type UserRole = "guardian" | "admin" | "super_admin";

export const ROLES: Record<UserRole, string> = {
  guardian: "Guardián",
  admin: "Administrador",
  super_admin: "Super Administrador",
};

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  guardian: ["view_own_sponsorships", "view_blog", "view_fauna", "update_own_profile"],
  admin: [
    "view_own_sponsorships",
    "view_blog",
    "view_fauna",
    "update_own_profile",
    "manage_fauna",
    "manage_blog",
    "view_all_sponsorships",
    "view_bitacora",
    "manage_bitacora",
  ],
  super_admin: ["*"],
};

export function hasPermission(role: UserRole, permission: string): boolean {
  const perms = ROLE_PERMISSIONS[role];
  return perms.includes("*") || perms.includes(permission);
}

export function getRoleLabel(role: UserRole): string {
  return ROLES[role] ?? role;
}
