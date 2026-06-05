import { Heart, DollarSign, Calendar, Bird, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { species } from '@/lib/species'
import { formatCurrency, formatDate } from '@/lib/utils'

const mockSponsorships = [
  { speciesId: 'quetzal', since: '2024-03-15', monthlyAmount: 50, status: 'active' },
  { speciesId: 'axolotl', since: '2024-09-01', monthlyAmount: 25, status: 'active' },
]

const mockDonations = [
  { id: '1', date: '2025-05-01', amount: 50, description: 'Apadrinamiento Quetzal - Mayo' },
  { id: '2', date: '2025-05-01', amount: 25, description: 'Apadrinamiento Axolotl - Mayo' },
  { id: '3', date: '2025-04-01', amount: 50, description: 'Apadrinamiento Quetzal - Abril' },
  { id: '4', date: '2025-04-01', amount: 25, description: 'Apadrinamiento Axolotl - Abril' },
  { id: '5', date: '2025-03-15', amount: 50, description: 'Donación inicial - Quetzal' },
]

export default function GuardianDashboard() {
  const totalDonated = mockDonations.reduce((s, d) => s + d.amount, 0)

  return (
    <div className="min-h-screen bg-forest-green-dark">
      {/* Header */}
      <div className="bg-forest-green-light/30 backdrop-blur-sm border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <div>
          <p className="text-off-white/50 text-sm">Bienvenido de regreso,</p>
          <h1 className="text-xl font-extrabold text-off-white">Guardián del Nido</h1>
        </div>
        <Link href="/" className="text-off-white/50 hover:text-off-white text-sm transition-colors">← Ir al sitio</Link>
      </div>

      <div className="container mx-auto px-4 py-10 max-w-5xl">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
          {[
            { label: 'Especies apadrinadas', value: mockSponsorships.length, icon: Bird, color: 'text-conservation-gold' },
            { label: 'Total donado', value: formatCurrency(totalDonated), icon: DollarSign, color: 'text-quetzal-blue' },
            { label: 'Meses como guardián', value: '14', icon: Calendar, color: 'text-emerald-400' },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-forest-green-light/40 rounded-2xl border border-white/10 p-6">
              <Icon className={`h-6 w-6 ${color} mb-3`} />
              <p className="text-3xl font-extrabold text-off-white">{value}</p>
              <p className="text-off-white/50 text-sm mt-1">{label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sponsorships */}
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-off-white">Mis Apadrinamientos</h2>
              <Link href="/apadrinar" className="text-conservation-gold text-sm hover:underline flex items-center gap-1">
                Agregar <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="space-y-4">
              {mockSponsorships.map((s) => {
                const sp = species.find((x) => x.id === s.speciesId)
                return (
                  <div key={s.speciesId} className="flex items-center gap-4 bg-forest-green-light/40 rounded-2xl border border-white/10 p-5">
                    <div className="w-12 h-12 rounded-xl bg-quetzal-blue/20 flex items-center justify-center">
                      <Heart className="h-5 w-5 text-conservation-gold" />
                    </div>
                    <div className="flex-1">
                      <p className="text-off-white font-bold">{sp?.name}</p>
                      <p className="text-off-white/40 text-xs">Desde {formatDate(s.since)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-conservation-gold font-bold">{formatCurrency(s.monthlyAmount)}</p>
                      <p className="text-off-white/40 text-xs">/mes</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Donation history */}
          <div>
            <h2 className="text-lg font-bold text-off-white mb-5">Historial de Donaciones</h2>
            <div className="bg-forest-green-light/40 rounded-2xl border border-white/10 divide-y divide-white/5">
              {mockDonations.map((d) => (
                <div key={d.id} className="flex items-center justify-between px-5 py-4">
                  <div>
                    <p className="text-off-white text-sm font-medium">{d.description}</p>
                    <p className="text-off-white/40 text-xs">{formatDate(d.date)}</p>
                  </div>
                  <span className="text-conservation-gold font-bold text-sm">{formatCurrency(d.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
