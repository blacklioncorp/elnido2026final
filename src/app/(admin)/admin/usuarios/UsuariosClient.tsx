'use client'

import { useState, useTransition } from 'react'
import { toast } from 'sonner'
import { Plus, X, UserX, UserCheck, Trash2, ChevronDown, Users, Loader2, Search, Mail } from 'lucide-react'
import { invitarUsuario, cambiarRolAdmin, toggleUsuarioActivo, deleteUsuarioAdmin } from '@/app/actions/usuarios'
import { ADMIN_ROLES, getAdminRoleBadgeColor, type AdminRole } from '@/lib/roles'
import { formatDate } from '@/lib/utils'

interface Usuario {
  id: string
  full_name: string | null
  email: string | null
  admin_role: string | null
  activo: boolean
  created_at: string
}

interface Props { inicial: Usuario[] }

const ROLES_OPTIONS = Object.entries(ADMIN_ROLES) as [AdminRole, string][]

export default function UsuariosClient({ inicial }: Props) {
  const [usuarios, setUsuarios] = useState<Usuario[]>(inicial)
  const [busqueda, setBusqueda] = useState('')
  const [modalInvitar, setModalInvitar] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [inviteForm, setInviteForm] = useState({ email: '', nombre: '', rol: 'editor' as AdminRole })
  const [isPending, startTransition] = useTransition()

  const filtrados = usuarios.filter(u =>
    (u.full_name ?? '').toLowerCase().includes(busqueda.toLowerCase()) ||
    (u.email ?? '').toLowerCase().includes(busqueda.toLowerCase())
  )

  function handleInvitar(e: React.FormEvent) {
    e.preventDefault()
    startTransition(async () => {
      const res = await invitarUsuario(inviteForm.email, inviteForm.nombre, inviteForm.rol)
      if ('error' in res) { toast.error(res.error); return }
      toast.success(`Invitación enviada a ${inviteForm.email} ✓`)
      setModalInvitar(false)
      setInviteForm({ email: '', nombre: '', rol: 'editor' })
      // Refrescar
      const { getUsuariosAdmin } = await import('@/app/actions/usuarios')
      setUsuarios(await getUsuariosAdmin() as Usuario[])
    })
  }

  function handleCambiarRol(userId: string, role: AdminRole | null) {
    startTransition(async () => {
      const res = await cambiarRolAdmin(userId, role)
      if ('error' in res) { toast.error(res.error); return }
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, admin_role: role } : u))
      toast.success('Rol actualizado ✓')
    })
  }

  function handleToggleActivo(userId: string, activo: boolean) {
    startTransition(async () => {
      const res = await toggleUsuarioActivo(userId, !activo)
      if ('error' in res) { toast.error(res.error); return }
      setUsuarios(prev => prev.map(u => u.id === userId ? { ...u, activo: !activo } : u))
      toast.success(!activo ? 'Usuario activado' : 'Usuario desactivado')
    })
  }

  function handleDelete(userId: string) {
    startTransition(async () => {
      const res = await deleteUsuarioAdmin(userId)
      if ('error' in res) { toast.error(res.error); return }
      setUsuarios(prev => prev.filter(u => u.id !== userId))
      setConfirmDelete(null)
      toast.success('Usuario eliminado')
    })
  }

  return (
    <div className="p-6 md:p-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-off-white tracking-tight">Usuarios Admin</h1>
          <p className="text-off-white/50 mt-1">{usuarios.length} usuario{usuarios.length !== 1 ? 's' : ''} registrado{usuarios.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModalInvitar(true)}
          className="flex items-center gap-2 bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-bold px-5 py-2.5 rounded-xl transition-all duration-200 hover:scale-105">
          <Plus className="h-4 w-4" /> Invitar Usuario
        </button>
      </div>

      <div className="relative mb-6 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-off-white/30" />
        <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar usuarios…"
          className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-off-white placeholder-off-white/30 text-sm focus:outline-none focus:border-conservation-gold/50" />
      </div>

      <div className="bg-forest-green-light/30 border border-white/10 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-off-white/40 uppercase text-xs tracking-wider">
              <th className="text-left p-4">Usuario</th>
              <th className="text-left p-4 hidden md:table-cell">Email</th>
              <th className="text-left p-4">Rol Admin</th>
              <th className="text-center p-4">Estado</th>
              <th className="text-right p-4">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filtrados.length === 0 ? (
              <tr><td colSpan={5} className="p-16 text-center text-off-white/30">
                <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
                {busqueda ? 'Sin resultados' : 'No hay usuarios admin aún. ¡Invita al equipo!'}
              </td></tr>
            ) : filtrados.map(u => (
              <tr key={u.id} className={`hover:bg-white/5 transition-colors ${!u.activo ? 'opacity-50' : ''}`}>
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-quetzal-blue/40 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                      {(u.full_name ?? u.email ?? '?')[0].toUpperCase()}
                    </div>
                    <span className="font-medium text-off-white">{u.full_name ?? 'Sin nombre'}</span>
                  </div>
                </td>
                <td className="p-4 hidden md:table-cell text-off-white/50 text-xs">{u.email ?? '—'}</td>
                <td className="p-4">
                  <select value={u.admin_role ?? ''} onChange={e => handleCambiarRol(u.id, (e.target.value as AdminRole) || null)} disabled={isPending}
                    className={`px-2 py-1 rounded-lg text-xs font-semibold border bg-transparent cursor-pointer focus:outline-none ${getAdminRoleBadgeColor(u.admin_role ?? '')}`}>
                    <option value="">Sin rol</option>
                    {ROLES_OPTIONS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                  </select>
                </td>
                <td className="p-4 text-center">
                  <button onClick={() => handleToggleActivo(u.id, u.activo)} disabled={isPending} title={u.activo ? 'Desactivar' : 'Activar'}
                    className={`p-1.5 rounded-lg transition-colors ${u.activo ? 'text-emerald-400 hover:bg-emerald-500/10' : 'text-off-white/30 hover:bg-white/10'}`}>
                    {u.activo ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />}
                  </button>
                </td>
                <td className="p-4 text-right">
                  <button onClick={() => setConfirmDelete(u.id)}
                    className="p-1.5 text-red-400/50 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal invitar */}
      {modalInvitar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setModalInvitar(false)} />
          <div className="relative bg-forest-green-dark border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold text-off-white">Invitar Usuario</h3>
              <button onClick={() => setModalInvitar(false)} className="text-off-white/40 hover:text-off-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleInvitar} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-off-white/30" />
                  <input type="email" value={inviteForm.email} onChange={e => setInviteForm(f => ({ ...f, email: e.target.value }))} placeholder="usuario@email.com" required
                    className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-off-white placeholder-off-white/30 text-sm focus:outline-none focus:border-conservation-gold/50" />
                </div>
              </div>
              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">Nombre *</label>
                <input value={inviteForm.nombre} onChange={e => setInviteForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Nombre completo" required
                  className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white placeholder-off-white/30 text-sm focus:outline-none focus:border-conservation-gold/50" />
              </div>
              <div>
                <label className="text-xs font-semibold text-off-white/60 uppercase tracking-wider mb-1.5 block">Rol *</label>
                <select value={inviteForm.rol} onChange={e => setInviteForm(f => ({ ...f, rol: e.target.value as AdminRole }))}
                  className="w-full bg-forest-green-light/40 border border-white/10 rounded-xl px-4 py-2.5 text-off-white text-sm focus:outline-none focus:border-conservation-gold/50">
                  {ROLES_OPTIONS.map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
                <p className="text-off-white/30 text-xs mt-1.5">Supabase enviará un email de invitación automáticamente</p>
              </div>
              <button type="submit" disabled={isPending}
                className="w-full bg-conservation-gold hover:bg-conservation-gold/90 disabled:opacity-50 text-forest-green-dark font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-2">
                {isPending ? <><Loader2 className="h-4 w-4 animate-spin" /> Enviando…</> : <><Mail className="h-4 w-4" /> Enviar Invitación</>}
              </button>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setConfirmDelete(null)} />
          <div className="relative bg-forest-green-dark border border-white/10 rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-lg font-bold text-off-white mb-2">¿Eliminar usuario?</h3>
            <p className="text-off-white/60 text-sm mb-6">Se eliminará su acceso al sistema. Si es el único superadmin, la operación será rechazada.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)} className="flex-1 bg-white/10 hover:bg-white/20 text-off-white font-medium py-2.5 rounded-xl transition-colors">Cancelar</button>
              <button onClick={() => handleDelete(confirmDelete)} disabled={isPending} className="flex-1 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl transition-colors">{isPending ? 'Eliminando…' : 'Eliminar'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
