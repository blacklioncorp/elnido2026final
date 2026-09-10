import MetricCard from '@/components/admin/MetricCard'
import { Bird, Heart, Users, DollarSign, Calendar, Ticket, TrendingUp } from 'lucide-react'
import { getDashboardData } from './actions'
import ActividadRecienteClient from '@/components/admin/ActividadRecienteClient'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export const metadata = {
  title: 'Dashboard - El Nido Admin',
}

export default async function AdminPage() {
  const { metrics, recentActivity } = await getDashboardData()

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-off-white tracking-tight">Dashboard</h1>
        <p className="text-off-white/50 mt-1">Bienvenido de regreso, Administrador</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        <MetricCard 
          title="Especies Registradas" 
          value={metrics.especiesRegistradas} 
          change="En conservación" 
          icon={Bird} 
          color="green" 
        />
        <MetricCard 
          title="Guardianes Activos" 
          value={metrics.guardianesActivos} 
          change="Padrinos registrados" 
          icon={Users} 
          color="blue" 
        />
        <MetricCard 
          title="Apadrinamientos" 
          value={metrics.apadrinamientos} 
          change="Donaciones de especie" 
          icon={Heart} 
          color="gold" 
        />
        <MetricCard 
          title="Recaudado (MXN)" 
          value={`$${metrics.recaudadoTotal.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          change="Total consolidado" 
          icon={DollarSign} 
          color="purple" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity with pagination */}
        <ActividadRecienteClient initialActivity={recentActivity} />

        {/* Quick actions */}
        <div className="bg-forest-green-light/40 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-off-white">Acciones Rápidas</h2>
            <Calendar className="h-5 w-5 text-off-white/30" />
          </div>
          <div className="space-y-3">
            {[
              { href: '/admin/fauna', label: 'Gestionar Fauna', icon: Bird },
              { href: '/admin/boletos', label: 'Administrar Boletos', icon: Ticket },
              { href: '/admin/reportes', label: 'Ver Reportes y Métricas', icon: TrendingUp },
              { href: '/admin/donativos', label: 'Tarjetas de Donación', icon: Heart },
              { href: '/admin/usuarios', label: 'Ver Usuarios', icon: Users },
            ].map(({ href, label, icon: Icon }) => (
              <a
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 transition-all duration-200 text-off-white/80 hover:text-off-white text-sm font-medium"
              >
                <Icon className="h-4 w-4 text-conservation-gold" />
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
