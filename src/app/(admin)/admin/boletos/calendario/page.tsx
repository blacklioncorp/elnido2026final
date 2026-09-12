import { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient, createAdminSupabaseClient } from '@/lib/supabase-server';
import CalendarioClient from './CalendarioClient';

export const metadata: Metadata = {
  title: 'Calendario de Visitas | El Nido Admin',
  description: 'Calendario mensual de aforo, feriados oficiales y visitantes programados.',
};

export const dynamic = 'force-dynamic';

export default async function CalendarioAdminPage() {
  // 1. Obtener usuario de la sesión actual
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

  return <CalendarioClient />;
}
