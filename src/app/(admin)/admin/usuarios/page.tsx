import { getUsuariosAdmin } from '@/app/actions/usuarios'
import UsuariosClient from './UsuariosClient'

export const dynamic = 'force-dynamic'

interface Usuario {
  id: string
  full_name: string | null
  email: string | null
  admin_role: string | null
  activo: boolean
  created_at: string
}

export default async function AdminUsuariosPage() {
  let usuarios: Usuario[] = []
  try {
    usuarios = (await getUsuariosAdmin()) as Usuario[]
  } catch { /* DB no configurada aún */ }

  return <UsuariosClient inicial={usuarios} />
}
