import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server';
import BoletosAdminClient from './BoletosAdminClient';

export const metadata: Metadata = {
  title: 'Administración de Boletos | El Nido',
  description: 'Panel de control para la gestión de tipos de entrada, eventos y venta de boletos.',
};

export const dynamic = 'force-dynamic';

export default async function BoletosAdminPage() {
  // 1. Obtener usuario de la sesión actual a través de las cookies del request
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }

  // 2. Verificar rol en la base de datos
  const adminClient = await createAdminSupabaseClient();
  const { data: perfil } = await adminClient
    .from('profiles')
    .select('role, admin_role')
    .eq('id', user.id)
    .single();

  const adminRole = perfil?.admin_role;
  const role = perfil?.role;

  // Permitir si es superadmin o editor, o si tiene rol global admin/super_admin
  const autorizado = 
    adminRole === 'superadmin' || 
    adminRole === 'editor' || 
    role === 'super_admin' || 
    role === 'admin';

  if (!autorizado) {
    redirect('/admin');
  }

  return <BoletosAdminClient />;
}
