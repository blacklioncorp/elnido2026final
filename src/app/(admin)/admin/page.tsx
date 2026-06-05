import MetricCard from '@/components/admin/MetricCard'
import { Bird, Heart, Users, DollarSign, TrendingUp, Calendar } from 'lucide-react'

const recentActivity = [
  { user: 'Ana García', action: 'Apadrinó al Quetzal', time: 'hace 5 min', amount: '$50' },
  { user: 'Carlos Ruiz', action: 'Donación general', time: 'hace 23 min', amount: '$100' },
  { user: 'María López', action: 'Apadrinó al Axolotl', time: 'hace 1 hora', amount: '$25' },
  { user: 'Pedro Soto', action: 'Apadrinó al Jaguar', time: 'hace 2 horas', amount: '$250' },
  { user: 'Laura Méndez', action: 'Donación general', time: 'hace 3 horas', amount: '$75' },
]

export default function AdminPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-off-white tracking-tight">Dashboard</h1>
        <p className="text-off-white/50 mt-1">Bienvenido de regreso, Administrador</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5 mb-10">
        <MetricCard title="Especies Registradas" value="12" change="2 este mes" icon={Bird} color="green" />
        <MetricCard title="Guardianes Activos" value="348" change="24 nuevos" icon={Users} color="blue" />
        <MetricCard title="Apadrinamientos" value="521" change="18 esta semana" icon={Heart} color="gold" />
        <MetricCard title="Recaudado (USD)" value="$24,870" change="$3,200 este mes" icon={DollarSign} color="purple" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="lg:col-span-2 bg-forest-green-light/40 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-off-white">Actividad Reciente</h2>
            <TrendingUp className="h-5 w-5 text-off-white/30" />
          </div>
          <div className="space-y-4">
            {recentActivity.map((item, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-quetzal-blue/30 flex items-center justify-center text-xs font-bold text-white">
                    {item.user[0]}
                  </div>
                  <div>
                    <p className="text-off-white text-sm font-medium">{item.user}</p>
                    <p className="text-off-white/40 text-xs">{item.action} · {item.time}</p>
                  </div>
                </div>
                <span className="text-conservation-gold font-bold text-sm">{item.amount}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-forest-green-light/40 backdrop-blur-sm rounded-2xl border border-white/10 p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-off-white">Acciones Rápidas</h2>
            <Calendar className="h-5 w-5 text-off-white/30" />
          </div>
          <div className="space-y-3">
            {[
              { href: '/admin/fauna/nueva', label: 'Agregar Especie', icon: Bird },
              { href: '/admin/blog/nueva', label: 'Nueva Entrada de Blog', icon: Heart },
              { href: '/admin/usuarios', label: 'Ver Usuarios', icon: Users },
              { href: '/admin/bitacora', label: 'Revisar Bitácora', icon: TrendingUp },
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
