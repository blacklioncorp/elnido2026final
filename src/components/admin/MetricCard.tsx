import { type LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: string
  positive?: boolean
  icon: LucideIcon
  color?: 'gold' | 'blue' | 'green' | 'purple'
}

const colorMap = {
  gold: 'bg-conservation-gold/20 text-conservation-gold border-conservation-gold/30',
  blue: 'bg-quetzal-blue/20 text-quetzal-blue border-quetzal-blue/30',
  green: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
}

export default function MetricCard({ title, value, change, positive = true, icon: Icon, color = 'gold' }: MetricCardProps) {
  return (
    <div className="bg-forest-green-light/40 backdrop-blur-sm rounded-2xl border border-white/10 p-6 flex items-start justify-between">
      <div>
        <p className="text-off-white/50 text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-extrabold text-off-white">{value}</p>
        {change && (
          <p className={`text-xs mt-1.5 font-medium ${positive ? 'text-emerald-400' : 'text-red-400'}`}>
            {positive ? '↑' : '↓'} {change}
          </p>
        )}
      </div>
      <div className={`p-3 rounded-xl border ${colorMap[color]}`}>
        <Icon className="h-6 w-6" />
      </div>
    </div>
  )
}
