'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { 
  Heart, DollarSign, Calendar, Bird, Sparkles, AlertCircle, 
  ChevronRight, Pause, Play, XCircle, ExternalLink, MapPin, 
  Ticket, BookOpen, Compass, ArrowUpRight, CheckCircle2, 
  Clock, ShieldCheck, Loader2
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { 
  GuardianData, 
  ApadrinamientoItem, 
  gestionarSuscripcionGuardian 
} from '@/app/actions/guardian'

const GuardianMap = dynamic(() => import('@/components/guardian/GuardianMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-off-white/40 text-sm animate-pulse">
      Cargando mapa satelital...
    </div>
  )
})

interface Props {
  initialData: GuardianData | null
}

type TabType = 'resumen' | 'apadrinamientos' | 'impulsa' | 'noticias' | 'eventos'

const TABS: { id: TabType; label: string; icon: any }[] = [
  { id: 'resumen', label: 'Resumen', icon: Sparkles },
  { id: 'apadrinamientos', label: 'Mis Apadrinamientos', icon: Heart },
  { id: 'impulsa', label: 'Impulsa el Vuelo', icon: Bird },
  { id: 'noticias', label: 'Noticias del Nido', icon: BookOpen },
  { id: 'eventos', label: 'Próximos Eventos', icon: Ticket },
]

function formatMXN(amount: number): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0
  }).format(amount)
}

export default function GuardianDashboardClient({ initialData }: Props) {
  const [data, setData] = useState<GuardianData | null>(initialData)
  const [activeTab, setActiveTab] = useState<TabType>('resumen')
  const [isPending, startTransition] = useTransition()
  const [cancelModalId, setCancelModalId] = useState<string | null>(null)

  if (!data) {
    return (
      <div className="min-h-screen bg-forest-green-dark text-off-white flex flex-col items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 text-center shadow-2xl space-y-6"
        >
          <div className="w-16 h-16 rounded-2xl bg-conservation-gold/20 text-conservation-gold flex items-center justify-center mx-auto text-3xl">
            🪶
          </div>
          <h2 className="text-2xl font-bold text-off-white">Acceso al Panel Guardián</h2>
          <p className="text-off-white/70 text-sm leading-relaxed">
            Inicia sesión con tu cuenta de Google para consultar el estado de tus apadrinamientos y el mapa de seguimiento.
          </p>
          <div className="pt-2 space-y-3">
            <Link
              href="/login?redirect=/guardian"
              className="w-full bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-bold py-3.5 px-6 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg text-sm"
            >
              Iniciar Sesión
            </Link>
            <Link
              href="/donativos"
              className="w-full bg-white/10 hover:bg-white/20 text-off-white font-medium py-3 px-6 rounded-xl flex items-center justify-center gap-2 transition-all text-sm"
            >
              Conocer Especies
            </Link>
          </div>
        </motion.div>
      </div>
    )
  }

  const { usuario, kpis, apadrinamientos, impulsaVuelo, noticias, eventos, esAnonimoConToken } = data

  const handleSubscriptionAction = (id: string, accion: 'pausar' | 'reanudar' | 'cancelar') => {
    startTransition(async () => {
      const res = await gestionarSuscripcionGuardian(id, accion)
      if (!res.success) {
        toast.error(res.error || 'Error al actualizar el apadrinamiento')
        return
      }

      const nuevoEstado = accion === 'pausar' ? 'pausada' : accion === 'reanudar' ? 'activa' : 'cancelada'
      
      setData(prev => {
        if (!prev) return null
        return {
          ...prev,
          apadrinamientos: prev.apadrinamientos.map(item => 
            item.id === id ? { ...item, estado_suscripcion: nuevoEstado } : item
          )
        }
      })

      if (accion === 'pausar') toast.success('Apadrinamiento pausado temporalmente')
      if (accion === 'reanudar') toast.success('¡Apadrinamiento reactivado con éxito!')
      if (accion === 'cancelar') {
        toast.success('Apadrinamiento cancelado')
        setCancelModalId(null)
      }
    })
  }

  return (
    <div className="min-h-screen bg-forest-green-dark text-off-white pb-20">
      
      {/* ── BANNER PARA USUARIOS ANÓNIMOS CON TOKEN ── */}
      {esAnonimoConToken && (
        <div className="bg-gradient-to-r from-quetzal-blue/90 to-forest-green-light border-b border-white/20 px-4 py-3 text-center text-xs sm:text-sm font-medium text-white shadow-md flex flex-wrap items-center justify-center gap-2">
          <Sparkles className="w-4 h-4 text-conservation-gold shrink-0" />
          <span>Accediste con enlace mágico. <strong>Crea tu cuenta gratuita</strong> para guardar tu historial y recibir actualizaciones en tu panel.</span>
          <Link 
            href={`/login?email=${encodeURIComponent(usuario?.email || '')}`} 
            className="underline font-bold hover:text-conservation-gold transition-colors ml-1"
          >
            Vincular cuenta →
          </Link>
        </div>
      )}

      {/* ── HERO HEADER ── */}
      <div className="border-b border-white/10 bg-forest-green-light/20 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-conservation-gold/20 border border-conservation-gold/40 text-conservation-gold text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
                <ShieldCheck className="w-3.5 h-3.5" /> Programa Guardián
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold text-off-white tracking-tight">
                👋 Hola, {usuario?.nombre || 'Guardián'}
              </h1>
              <p className="text-off-white/70 text-sm sm:text-base mt-1.5 italic">
                &ldquo;Gracias por ser Guardián de la vida y proteger la fauna mexicana&rdquo;
              </p>
            </div>

            <div className="flex items-center gap-3">
              <Link 
                href="/donativos" 
                className="bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-bold px-4 py-2.5 rounded-xl transition-all shadow-md text-xs sm:text-sm inline-flex items-center gap-1.5"
              >
                <Heart className="w-4 h-4 fill-forest-green-dark" />
                Apadrinar otra especie
              </Link>
            </div>
          </div>

          {/* ── TABS DE NAVEGACIÓN ── */}
          <div className="flex gap-2 overflow-x-auto no-scrollbar pt-8">
            {TABS.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap border",
                    isActive 
                      ? "bg-conservation-gold text-forest-green-dark border-conservation-gold shadow-md font-bold" 
                      : "bg-white/5 text-off-white/70 border-white/10 hover:bg-white/10 hover:text-off-white"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.id === 'apadrinamientos' && apadrinamientos.length > 0 && (
                    <span className={cn("px-1.5 py-0.2 text-[10px] rounded-full", isActive ? "bg-forest-green-dark text-white" : "bg-white/10 text-off-white")}>
                      {apadrinamientos.length}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        
        {/* ── 4 KPIS DE IMPACTO (Siempre visibles o destacados) ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-10">
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-conservation-gold/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-off-white/60 text-xs font-semibold uppercase tracking-wider">Especies Apadrinadas</span>
              <div className="w-8 h-8 rounded-lg bg-conservation-gold/20 text-conservation-gold flex items-center justify-center">
                <Heart className="w-4 h-4 fill-conservation-gold" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-conservation-gold">{kpis.especiesApadrinadas}</p>
            <p className="text-[11px] text-off-white/40 mt-1.5">Especies protegidas activamente</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-quetzal-blue/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-off-white/60 text-xs font-semibold uppercase tracking-wider">Aportado Total</span>
              <div className="w-8 h-8 rounded-lg bg-quetzal-blue/20 text-quetzal-blue flex items-center justify-center">
                <DollarSign className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-quetzal-blue">{formatMXN(kpis.totalAportado)}</p>
            <p className="text-[11px] text-off-white/40 mt-1.5">En programas de conservación</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-emerald-500/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-off-white/60 text-xs font-semibold uppercase tracking-wider">Semanas Activo</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Calendar className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-emerald-400">{kpis.semanasActivo}</p>
            <p className="text-[11px] text-off-white/40 mt-1.5">Semana{kpis.semanasActivo !== 1 ? 's' : ''} como Guardián</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur-md relative overflow-hidden group hover:border-amber-500/40 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <span className="text-off-white/60 text-xs font-semibold uppercase tracking-wider">Vidas Impactadas</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <Bird className="w-4 h-4" />
              </div>
            </div>
            <p className="text-3xl sm:text-4xl font-extrabold text-amber-400">~{kpis.vidasImpactadas}</p>
            <p className="text-[11px] text-off-white/40 mt-1.5">Ejemplares beneficiados</p>
          </div>

        </div>

        {/* ── TAB CONTENT ── */}
        <AnimatePresence mode="wait">
          
          {/* ════ TAB 1: RESUMEN ════ */}
          {activeTab === 'resumen' && (
            <motion.div 
              key="resumen"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-12"
            >
              {/* Sección Mis Apadrinamientos Vista Previa */}
              <section>
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-off-white flex items-center gap-2">
                      <Heart className="w-5 h-5 text-conservation-gold" /> Mis Apadrinamientos
                    </h2>
                    <p className="text-xs sm:text-sm text-off-white/60">Tus especies bajo custodia activa</p>
                  </div>
                  <button 
                    onClick={() => setActiveTab('apadrinamientos')}
                    className="text-xs sm:text-sm font-semibold text-conservation-gold hover:underline flex items-center gap-1"
                  >
                    Ver todos ({apadrinamientos.length}) <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {apadrinamientos.length === 0 ? (
                  <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center max-w-lg mx-auto">
                    <p className="text-off-white/70 text-sm mb-4">Aún no tienes especies apadrinadas registradas.</p>
                    <Link 
                      href="/donativos" 
                      className="inline-flex items-center gap-2 bg-conservation-gold text-forest-green-dark font-bold px-5 py-2.5 rounded-xl text-xs sm:text-sm"
                    >
                      Explorar Especies y Apadrinar
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {apadrinamientos.slice(0, 3).map((item) => (
                      <SponsorshipCard 
                        key={item.id} 
                        item={item} 
                        onAction={handleSubscriptionAction}
                        onOpenCancelModal={(id) => setCancelModalId(id)}
                      />
                    ))}
                  </div>
                )}
              </section>

              {/* Impulsa el Vuelo (si tiene especies en liberación) */}
              {impulsaVuelo.tarjetas.length > 0 && (
                <section className="pt-6 border-t border-white/10">
                  <div className="flex justify-between items-center mb-6">
                    <div>
                      <div className="inline-flex items-center gap-1.5 bg-quetzal-blue/20 text-quetzal-blue text-xs font-bold px-3 py-1 rounded-full mb-2">
                        🦅 En proceso de liberación
                      </div>
                      <h2 className="text-xl sm:text-2xl font-bold text-off-white">Impulsa el Vuelo</h2>
                      <p className="text-xs sm:text-sm text-off-white/60">Ubicación satelital y avance de tus especies en camino a la libertad</p>
                    </div>
                    <button 
                      onClick={() => setActiveTab('impulsa')}
                      className="text-xs sm:text-sm font-semibold text-conservation-gold hover:underline flex items-center gap-1"
                    >
                      Ver mapa completo <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <GuardianMap tarjetas={impulsaVuelo.tarjetas} height="360px" />
                </section>
              )}

              {/* Feed rápido: Noticias y Eventos */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pt-6 border-t border-white/10">
                
                {/* Noticias */}
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-off-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-conservation-gold" /> Noticias del Nido
                    </h3>
                    <button 
                      onClick={() => setActiveTab('noticias')} 
                      className="text-xs font-semibold text-conservation-gold hover:underline"
                    >
                      Ver todas →
                    </button>
                  </div>
                  <div className="space-y-4">
                    {noticias.slice(0, 2).map((n) => (
                      <NewsCard key={n.id} item={n} />
                    ))}
                  </div>
                </div>

                {/* Eventos */}
                <div>
                  <div className="flex justify-between items-center mb-5">
                    <h3 className="text-lg font-bold text-off-white flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-conservation-gold" /> Próximos Eventos
                    </h3>
                    <button 
                      onClick={() => setActiveTab('eventos')} 
                      className="text-xs font-semibold text-conservation-gold hover:underline"
                    >
                      Ver todos →
                    </button>
                  </div>
                  <div className="space-y-4">
                    {eventos.slice(0, 2).map((ev) => (
                      <EventCard key={ev.id} item={ev} />
                    ))}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ════ TAB 2: MIS APADRINAMIENTOS ════ */}
          {activeTab === 'apadrinamientos' && (
            <motion.div 
              key="apadrinamientos"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-off-white">Tus Especies Apadrinadas</h2>
                  <p className="text-sm text-off-white/60">Gestiona tus aportaciones mensuales y consulta los detalles</p>
                </div>
                <Link 
                  href="/donativos" 
                  className="bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-bold px-4 py-2 rounded-xl text-xs sm:text-sm inline-flex items-center gap-1.5"
                >
                  <Heart className="w-4 h-4 fill-forest-green-dark" /> Apadrinar Más
                </Link>
              </div>

              {apadrinamientos.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-12 text-center max-w-md mx-auto">
                  <div className="text-5xl mb-4">🐾</div>
                  <h3 className="text-lg font-bold text-off-white mb-2">Aún no tienes apadrinamientos</h3>
                  <p className="text-sm text-off-white/60 mb-6">Elige una especie en nuestro catálogo y acompáñala como su Guardián.</p>
                  <Link href="/donativos" className="bg-conservation-gold text-forest-green-dark font-bold px-6 py-3 rounded-xl text-sm inline-block">
                    Ver Especies Disponibles
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {apadrinamientos.map((item) => (
                    <SponsorshipCard 
                      key={item.id} 
                      item={item} 
                      onAction={handleSubscriptionAction}
                      onOpenCancelModal={(id) => setCancelModalId(id)}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ════ TAB 3: IMPULSA EL VUELO ════ */}
          {activeTab === 'impulsa' && (
            <motion.div 
              key="impulsa"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-8"
            >
              <div>
                <div className="inline-flex items-center gap-1.5 bg-quetzal-blue/20 border border-quetzal-blue/40 text-quetzal-blue text-xs font-bold px-3 py-1 rounded-full mb-3">
                  🦅 Monitoreo en Tiempo Real
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold text-off-white">Mapa Satelital de Liberación</h2>
                <p className="text-sm text-off-white/70 max-w-2xl mt-1">
                  Sigue la trayectoria desde el santuario hasta las áreas de reinserción natural de las especies que apadrinas.
                </p>
              </div>

              {impulsaVuelo.tarjetas.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center max-w-lg mx-auto">
                  <Bird className="w-12 h-12 text-conservation-gold/60 mx-auto mb-4" />
                  <h3 className="text-lg font-bold text-off-white mb-2">No tienes especies en &ldquo;Impulsa el Vuelo&rdquo;</h3>
                  <p className="text-sm text-off-white/60 mb-6">
                    Apadrina una de las especies en proceso de rehabilitación y liberación para desbloquear el mapa satelital y su bitácora confidencial.
                  </p>
                  <Link href="/donativos#impulsa-el-vuelo" className="bg-conservation-gold text-forest-green-dark font-bold px-5 py-2.5 rounded-xl text-sm inline-block">
                    Ver Especies en Liberación
                  </Link>
                </div>
              ) : (
                <>
                  <GuardianMap tarjetas={impulsaVuelo.tarjetas} height="480px" />

                  {/* Bitácoras Exclusivas */}
                  <div className="pt-6 border-t border-white/10 space-y-6">
                    <h3 className="text-xl font-bold text-off-white flex items-center gap-2">
                      <Compass className="w-5 h-5 text-conservation-gold" />
                      Bitácora de Progreso y Actualizaciones
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {impulsaVuelo.tarjetas.map(t => {
                        const acts = impulsaVuelo.actualizaciones[t.id] || []
                        return (
                          <div key={t.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
                            <div className="flex items-center gap-3 border-b border-white/10 pb-4">
                              {t.imagen_url && (
                                <div className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10">
                                  <Image src={t.imagen_url} alt={t.nombre_especie} fill className="object-cover" />
                                </div>
                              )}
                              <div>
                                <h4 className="font-bold text-off-white">{t.nombre_especie}</h4>
                                {t.nombre_animal && <p className="text-xs text-quetzal-blue italic">&ldquo;{t.nombre_animal}&rdquo;</p>}
                              </div>
                            </div>

                            {acts.length === 0 ? (
                              <p className="text-xs text-off-white/50 py-4 text-center">Sin actualizaciones recientes de campo.</p>
                            ) : (
                              <div className="space-y-3">
                                {acts.map(act => (
                                  <div key={act.id} className="bg-white/5 p-3 rounded-xl border border-white/5 space-y-1">
                                    <div className="flex justify-between items-center text-[11px] text-conservation-gold font-bold">
                                      <span>{act.titulo}</span>
                                      <span className="text-off-white/40">{new Date(act.fecha || act.created_at).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-off-white/70 line-clamp-2">{act.descripcion}</p>
                                  </div>
                                ))}
                              </div>
                            )}

                            <Link 
                              href={`/impulsa-el-vuelo/${t.id}`}
                              className="w-full block text-center bg-white/10 hover:bg-white/20 text-off-white font-semibold py-2.5 rounded-xl text-xs transition-colors"
                            >
                              Ver Bitácora Completa →
                            </Link>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {/* ════ TAB 4: NOTICIAS ════ */}
          {activeTab === 'noticias' && (
            <motion.div 
              key="noticias"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-2xl font-bold text-off-white">Noticias del Nido y Bitácoras</h2>
                <p className="text-sm text-off-white/60">Actualizaciones de conservación y artículos prioritarios para Guardianes</p>
              </div>

              {noticias.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-off-white/60 text-sm">
                  No hay noticias publicadas por el momento.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {noticias.map(n => (
                    <NewsCard key={n.id} item={n} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {/* ════ TAB 5: EVENTOS ════ */}
          {activeTab === 'eventos' && (
            <motion.div 
              key="eventos"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              className="space-y-6"
            >
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-off-white">Próximos Eventos y Experiencias</h2>
                  <p className="text-sm text-off-white/60">Como Guardián tienes acceso prioritario y beneficios exclusivos en taquilla</p>
                </div>
              </div>

              {eventos.length === 0 ? (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-10 text-center text-off-white/60 text-sm">
                  Pronto anunciaremos nuevos talleres y eventos especiales.
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {eventos.map(ev => (
                    <EventCard key={ev.id} item={ev} />
                  ))}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* ── MODAL CONFIRMACIÓN CANCELAR SUSCRIPCIÓN ── */}
      {cancelModalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCancelModalId(null)} />
          <div className="relative bg-forest-green-dark border border-white/10 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
              <XCircle className="w-6 h-6" />
            </div>
            <div className="text-center">
              <h3 className="text-lg font-bold text-off-white">¿Cancelar apadrinamiento?</h3>
              <p className="text-xs text-off-white/60 mt-1 leading-relaxed">
                Tu apoyo mensual se suspenderá al final del ciclo actual. ¿Deseas pausarlo en lugar de cancelar?
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={() => {
                  handleSubscriptionAction(cancelModalId, 'pausar')
                  setCancelModalId(null)
                }}
                disabled={isPending}
                className="w-full bg-amber-500 hover:bg-amber-600 text-forest-green-dark font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                Pausar temporalmente
              </button>
              <button
                onClick={() => handleSubscriptionAction(cancelModalId, 'cancelar')}
                disabled={isPending}
                className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 font-semibold py-2.5 rounded-xl text-xs border border-red-500/30 transition-colors"
              >
                {isPending ? 'Procesando...' : 'Sí, cancelar apadrinamiento'}
              </button>
              <button
                onClick={() => setCancelModalId(null)}
                className="w-full bg-white/5 hover:bg-white/10 text-off-white/70 py-2 rounded-xl text-xs transition-colors"
              >
                Volver
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// COMPONENTES AUXILIARES
// ─────────────────────────────────────────────────────────────

function SponsorshipCard({ 
  item, 
  onAction,
  onOpenCancelModal 
}: { 
  item: ApadrinamientoItem
  onAction: (id: string, accion: 'pausar' | 'reanudar' | 'cancelar') => void
  onOpenCancelModal: (id: string) => void
}) {
  const { tarjeta, monto, estado_suscripcion } = item
  const esImpulsa = (tarjeta as any)?.seccion === 'impulsa_vuelo'

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md flex flex-col justify-between hover:border-white/20 transition-all shadow-xl group">
      
      {/* Imagen y Badges */}
      <div className="relative h-48 w-full bg-forest-green-light/30">
        {tarjeta.imagen_url ? (
          <Image src={tarjeta.imagen_url} alt={tarjeta.nombre_especie} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
        ) : (
          <div className="flex items-center justify-center h-full text-4xl">🪶</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        
        {/* Badges superiores */}
        <div className="absolute top-3 left-3 flex gap-2">
          {esImpulsa ? (
            <span className="bg-quetzal-blue/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              🦅 Impulsa el Vuelo
            </span>
          ) : (
            <span className="bg-conservation-gold/90 backdrop-blur-md text-forest-green-dark text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider">
              🐾 Amigos
            </span>
          )}
        </div>

        {/* Estado */}
        <div className="absolute top-3 right-3">
          <span className={cn(
            "text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider backdrop-blur-md border",
            estado_suscripcion === 'activa' && "bg-emerald-500/30 text-emerald-300 border-emerald-500/40",
            estado_suscripcion === 'pausada' && "bg-amber-500/30 text-amber-300 border-amber-500/40",
            estado_suscripcion === 'cancelada' && "bg-red-500/30 text-red-300 border-red-500/40"
          )}>
            {estado_suscripcion === 'activa' ? 'Activo' : estado_suscripcion === 'pausada' ? 'Pausado' : 'Cancelado'}
          </span>
        </div>

        {/* Info sobre imagen */}
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-white leading-snug">{tarjeta.nombre_especie}</h3>
          {tarjeta.nombre_animal && (
            <p className="text-xs text-conservation-gold font-semibold italic">&ldquo;{tarjeta.nombre_animal}&rdquo;</p>
          )}
        </div>
      </div>

      {/* Contenido */}
      <div className="p-5 space-y-4 flex-1 flex flex-col justify-between">
        
        <div className="space-y-2">
          <div className="flex justify-between items-center py-2 border-b border-white/10 text-sm">
            <span className="text-off-white/60">Aportación:</span>
            <span className="font-bold text-conservation-gold">{formatMXN(monto)}/mes</span>
          </div>

          <p className="text-xs text-off-white/70 line-clamp-2 leading-relaxed">
            {tarjeta.descripcion}
          </p>
        </div>

        {/* Acciones */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="flex gap-2">
            {esImpulsa ? (
              <Link 
                href={`/impulsa-el-vuelo/${tarjeta.id}`} 
                className="flex-1 bg-quetzal-blue hover:bg-quetzal-blue/90 text-white font-bold py-2 px-3 rounded-xl text-xs text-center transition-colors flex items-center justify-center gap-1"
              >
                <Compass className="w-3.5 h-3.5" /> Ver en mapa
              </Link>
            ) : (
              <Link 
                href="/donativos" 
                className="flex-1 bg-white/10 hover:bg-white/20 text-off-white font-semibold py-2 px-3 rounded-xl text-xs text-center transition-colors"
              >
                Ver especie
              </Link>
            )}

            {estado_suscripcion === 'activa' && (
              <button
                onClick={() => onAction(item.id, 'pausar')}
                className="p-2 bg-white/5 hover:bg-amber-500/20 hover:text-amber-300 text-off-white/60 rounded-xl transition-colors border border-white/10"
                title="Pausar suscripción temporalmente"
              >
                <Pause className="w-4 h-4" />
              </button>
            )}

            {estado_suscripcion === 'pausada' && (
              <button
                onClick={() => onAction(item.id, 'reanudar')}
                className="p-2 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-xl transition-colors border border-emerald-500/30"
                title="Reanudar suscripción"
              >
                <Play className="w-4 h-4" />
              </button>
            )}

            {estado_suscripcion !== 'cancelada' && (
              <button
                onClick={() => onOpenCancelModal(item.id)}
                className="p-2 bg-white/5 hover:bg-red-500/20 hover:text-red-300 text-off-white/60 rounded-xl transition-colors border border-white/10"
                title="Cancelar apadrinamiento"
              >
                <XCircle className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

      </div>

    </div>
  )
}

function NewsCard({ item }: { item: any }) {
  return (
    <Link 
      href={item.link}
      className="bg-white/5 border border-white/10 rounded-2xl p-4 flex gap-4 hover:border-conservation-gold/50 transition-all group overflow-hidden"
    >
      {item.imagen_url ? (
        <div className="relative w-20 h-20 rounded-xl overflow-hidden shrink-0 border border-white/10">
          <Image src={item.imagen_url} alt={item.titulo} fill className="object-cover group-hover:scale-105 transition-transform" />
        </div>
      ) : (
        <div className="w-20 h-20 rounded-xl bg-white/10 flex items-center justify-center text-2xl shrink-0">
          📰
        </div>
      )}
      <div className="flex-1 min-w-0 flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-conservation-gold">
              {item.tipo === 'bitacora' ? '🦅 Bitácora' : '📰 Blog'}
            </span>
            <span className="text-[10px] text-off-white/40">
              {new Date(item.fecha).toLocaleDateString()}
            </span>
          </div>
          <h4 className="font-bold text-off-white text-sm line-clamp-1 group-hover:text-conservation-gold transition-colors">
            {item.titulo}
          </h4>
          <p className="text-xs text-off-white/60 line-clamp-2 mt-1">
            {item.descripcion}
          </p>
        </div>
        <span className="text-[11px] text-quetzal-blue font-semibold mt-2 inline-flex items-center gap-0.5">
          Leer más →
        </span>
      </div>
    </Link>
  )
}

function EventCard({ item }: { item: any }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 flex flex-col justify-between hover:border-white/20 transition-all shadow-md">
      <div className="space-y-3">
        <div className="flex justify-between items-start gap-2">
          <span className="bg-conservation-gold/20 text-conservation-gold text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider border border-conservation-gold/30">
            ⭐ Preventa Exclusiva
          </span>
          <span className="text-xs font-bold text-quetzal-blue">{formatMXN(item.precio)}</span>
        </div>
        
        <div>
          <h4 className="font-bold text-off-white text-base leading-tight">{item.nombre}</h4>
          {item.fecha && (
            <p className="text-xs text-off-white/50 mt-1 flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-conservation-gold" /> {item.fecha}
            </p>
          )}
        </div>

        {item.descripcion && (
          <p className="text-xs text-off-white/70 line-clamp-2 leading-relaxed">
            {item.descripcion}
          </p>
        )}
      </div>

      <div className="pt-4 mt-4 border-t border-white/10">
        <Link
          href="/boletos"
          className="w-full bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-bold py-2 rounded-xl text-xs text-center block transition-colors shadow"
        >
          Reservar con Preventa
        </Link>
      </div>
    </div>
  )
}
