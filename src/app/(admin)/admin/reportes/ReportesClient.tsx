'use client'

import { useState, useEffect } from 'react'
import { getDatosReporte, generarCSVReporte, getDonacionDetalle } from './actions'
import { Download, Calendar, Filter, TrendingUp, Users, Wallet, Package, Heart, Eye } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import DonacionDetalleModal from '@/components/admin/DonacionDetalleModal'

export default function ReportesClient({ cajas }: { cajas: any[] }) {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({ filas: [], kpis: { ventasDia: 0, miembrosActivos: 0, saldoCirculante: 0, topProductos: [] } })
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDonacion, setSelectedDonacion] = useState<any>(null)
  
  // Default: últimos 30 días
  const hace30Dias = new Date()
  hace30Dias.setDate(hace30Dias.getDate() - 30)
  
  const [filtros, setFiltros] = useState({
    desde: hace30Dias.toISOString().slice(0, 10),
    hasta: new Date().toISOString().slice(0, 10),
    cajaId: 'todas',
    categoria: 'todos',
    metodoPago: 'todos'
  })

  const cargarDatos = async () => {
    setLoading(true)
    try {
      const result = await getDatosReporte(filtros)
      setData(result)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    cargarDatos()
  }, [])

  const handleExport = async () => {
    try {
      const csv = await generarCSVReporte(data.filas)
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `reporte_el_nido_${new Date().toISOString().slice(0,10)}.csv`)
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (err) {
      alert('Error al generar el CSV')
    }
  }

  const handleRowClick = async (f: any) => {
    if (f.origen === 'donativos') {
      const detalle = await getDonacionDetalle(f.id)
      if (detalle) {
        setSelectedDonacion(detalle)
        setModalOpen(true)
      }
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-forest-green-dark">Reportes y Métricas</h1>
          <p className="text-forest-green-dark/60 mt-1">Analítica general del santuario y exportación de datos.</p>
        </div>
        <button 
          onClick={handleExport}
          disabled={data.filas.length === 0}
          className="flex items-center justify-center gap-2 bg-forest-green-dark text-white px-5 py-2.5 rounded-xl font-medium hover:bg-forest-green-dark/90 transition-colors shadow-sm disabled:opacity-50"
        >
          <Download className="h-5 w-5" /> Exportar CSV
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl border border-forest-green-dark/10 shadow-sm flex items-start gap-4">
          <div className="bg-green-100 p-3 rounded-xl text-green-600"><TrendingUp className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-forest-green-dark/60">Ventas de Hoy</p>
            <p className="text-2xl font-bold text-forest-green-dark">{formatCurrency(data.kpis.ventasDia)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-forest-green-dark/10 shadow-sm flex items-start gap-4">
          <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Users className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-forest-green-dark/60">Miembros Activos</p>
            <p className="text-2xl font-bold text-forest-green-dark">{data.kpis.miembrosActivos}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-forest-green-dark/10 shadow-sm flex items-start gap-4">
          <div className="bg-purple-100 p-3 rounded-xl text-purple-600"><Wallet className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-forest-green-dark/60">Saldo Circulante</p>
            <p className="text-2xl font-bold text-forest-green-dark">{formatCurrency(data.kpis.saldoCirculante)}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-forest-green-dark/10 shadow-sm flex items-start gap-4">
          <div className="bg-orange-100 p-3 rounded-xl text-orange-600"><Package className="h-6 w-6" /></div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-forest-green-dark/60">Top Producto</p>
            <p className="text-lg font-bold text-forest-green-dark truncate">{data.kpis.topProductos[0]?.nombre || 'N/A'}</p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-forest-green-dark/10 shadow-sm flex items-start gap-4">
          <div className="bg-red-100 p-3 rounded-xl text-red-500"><Heart className="h-6 w-6" /></div>
          <div>
            <p className="text-sm font-medium text-forest-green-dark/60">Donaciones Totales</p>
            <p className="text-2xl font-bold text-forest-green-dark">{formatCurrency(data.kpis.totalDonaciones ?? 0)}</p>
          </div>
        </div>
      </div>

      {/* KPIs Boletera */}
      {(data.kpis.boletosHoy !== undefined) && (
        <>
          <h2 className="text-xl font-bold text-forest-green-dark mt-8 mb-4">KPIs de Boletera</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-forest-green-dark/10 shadow-sm flex items-start gap-4">
              <div className="bg-orange-100 p-3 rounded-xl text-orange-600"><Users className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-medium text-forest-green-dark/60">Boletos Vendidos Hoy</p>
                <p className="text-2xl font-bold text-forest-green-dark">{data.kpis.boletosHoy}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-forest-green-dark/10 shadow-sm flex items-start gap-4">
              <div className="bg-blue-100 p-3 rounded-xl text-blue-600"><Wallet className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-medium text-forest-green-dark/60">Ingresos Boletera</p>
                <p className="text-2xl font-bold text-forest-green-dark">{formatCurrency(data.kpis.ingresosBoletera)}</p>
              </div>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-forest-green-dark/10 shadow-sm flex items-start gap-4">
              <div className="bg-purple-100 p-3 rounded-xl text-purple-600"><Calendar className="h-6 w-6" /></div>
              <div>
                <p className="text-sm font-medium text-forest-green-dark/60">Próximas Visitas</p>
                <p className="text-2xl font-bold text-forest-green-dark">{data.kpis.proximasVisitas} personas</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* KPIs Especies */}
      {data.especiesKpis && (
        <>
          <h2 className="text-xl font-bold text-forest-green-dark mt-8 mb-4">KPIs de Especies</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-forest-green-dark/10 shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-2 text-forest-green-dark/60 font-medium">
                <Heart className="h-4 w-4 text-red-500" /> Más Apadrinada
              </div>
              {data.especiesKpis.masApadrinada ? (
                <>
                  <p className="text-lg font-bold text-forest-green-dark">{data.especiesKpis.masApadrinada.nombre}</p>
                  <p className="text-sm text-forest-green-dark/70">{data.especiesKpis.masApadrinada.valor} padrinos este mes</p>
                </>
              ) : <p className="text-sm text-forest-green-dark/50">Sin datos aún</p>}
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-forest-green-dark/10 shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-2 text-forest-green-dark/60 font-medium">
                <TrendingUp className="h-4 w-4 text-green-500" /> Más Recaudada
              </div>
              {data.especiesKpis.masRecaudada ? (
                <>
                  <p className="text-lg font-bold text-forest-green-dark">{data.especiesKpis.masRecaudada.nombre}</p>
                  <p className="text-sm text-forest-green-dark/70">{formatCurrency(data.especiesKpis.masRecaudada.valor)} recaudados</p>
                </>
              ) : <p className="text-sm text-forest-green-dark/50">Sin datos aún</p>}
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-forest-green-dark/10 shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-2 text-forest-green-dark/60 font-medium">
                <Eye className="h-4 w-4 text-blue-500" /> Vistas de Tarjetas
              </div>
              <p className="text-2xl font-bold text-forest-green-dark">{data.especiesKpis.visitas}</p>
              <p className="text-sm text-forest-green-dark/70">vistas totales</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-forest-green-dark/10 shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-2 text-forest-green-dark/60 font-medium">
                <TrendingUp className="h-4 w-4 text-purple-500" /> Tasa Conversión
              </div>
              <p className="text-2xl font-bold text-forest-green-dark">{data.especiesKpis.tasaConversion}%</p>
              <p className="text-sm text-forest-green-dark/70">estimada (MVP)</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl border border-forest-green-dark/10 shadow-sm flex flex-col gap-2">
              <div className="flex items-center gap-2 text-forest-green-dark/60 font-medium">
                <Wallet className="h-4 w-4 text-orange-500" /> Donativo Promedio
              </div>
              <p className="text-2xl font-bold text-forest-green-dark">{formatCurrency(Number(data.especiesKpis.promedio))}</p>
              <p className="text-sm text-forest-green-dark/70">por donación (rango)</p>
            </div>
          </div>
        </>
      )}

      {/* Ranking Especies */}
      {data.rankingEspecies && data.rankingEspecies.length > 0 && (
        <div className="bg-white rounded-2xl border border-forest-green-dark/10 shadow-sm p-6 overflow-hidden mt-8">
          <h2 className="text-xl font-bold text-forest-green-dark mb-4">Ranking de Especies</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-forest-green-dark/5 border-b border-forest-green-dark/10 text-sm font-semibold text-forest-green-dark/80 whitespace-nowrap">
                  <th className="p-4">#</th>
                  <th className="p-4">Especie</th>
                  <th className="p-4 text-center">Padrinos (Rango)</th>
                  <th className="p-4 text-right">Recaudado (Rango)</th>
                  <th className="p-4 w-1/3">Progreso Histórico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-forest-green-dark/5 text-sm text-forest-green-dark">
                {data.rankingEspecies.map((r: any, idx: number) => {
                  const progreso = r.meta > 0 ? Math.min(100, Math.round((r.recaudado_historico / r.meta) * 100)) : 0
                  return (
                    <tr key={r.id} className="hover:bg-forest-green-dark/5 transition-colors">
                      <td className="p-4 font-bold">{idx + 1}</td>
                      <td className="p-4">{r.nombre}</td>
                      <td className="p-4 text-center font-bold">{r.padrinos_periodo}</td>
                      <td className="p-4 text-right font-medium text-quetzal-blue">{formatCurrency(r.recaudado_periodo)}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-full bg-forest-green-dark/10 rounded-full h-2 overflow-hidden flex-1">
                            <div className="bg-conservation-gold h-2 rounded-full" style={{ width: `${progreso}%` }}></div>
                          </div>
                          <span className="text-xs font-bold text-forest-green-dark/70 w-10 text-right">{progreso}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filtros */}
      <div className="bg-white p-5 rounded-2xl border border-forest-green-dark/10 shadow-sm space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="h-5 w-5 text-forest-green-dark/60" />
          <h2 className="font-semibold text-forest-green-dark">Filtros</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <div>
            <label className="block text-xs font-medium text-forest-green-dark/60 mb-1">Desde</label>
            <input type="date" value={filtros.desde} onChange={e => setFiltros({...filtros, desde: e.target.value})} className="w-full border border-forest-green-dark/20 rounded-lg p-2 focus:border-conservation-gold outline-none text-sm text-forest-green-dark bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-forest-green-dark/60 mb-1">Hasta</label>
            <input type="date" value={filtros.hasta} onChange={e => setFiltros({...filtros, hasta: e.target.value})} className="w-full border border-forest-green-dark/20 rounded-lg p-2 focus:border-conservation-gold outline-none text-sm text-forest-green-dark bg-transparent" />
          </div>
          <div>
            <label className="block text-xs font-medium text-forest-green-dark/60 mb-1">Caja</label>
            <select value={filtros.cajaId} onChange={e => setFiltros({...filtros, cajaId: e.target.value})} className="w-full border border-forest-green-dark/20 rounded-lg p-2 focus:border-conservation-gold outline-none text-sm text-forest-green-dark bg-transparent">
              <option value="todas">Todas las cajas</option>
              <option value="online">Boletera Online</option>
              {cajas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-forest-green-dark/60 mb-1">Categoría</label>
            <select value={filtros.categoria} onChange={e => setFiltros({...filtros, categoria: e.target.value})} className="w-full border border-forest-green-dark/20 rounded-lg p-2 focus:border-conservation-gold outline-none text-sm capitalize text-forest-green-dark bg-transparent">
              <option value="todos">Todas</option>
              <option value="entrada">Entradas</option>
              <option value="evento">Eventos</option>
              <option value="membresia">Membresías</option>
              <option value="cafeteria">Cafetería</option>
              <option value="tienda">Tienda</option>
              <option value="paquete_familiar">Paquete Familiar</option>
              <option value="donacion_generica">Donación Genérica</option>
              <option value="donacion_especie">Donación por Especie</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-forest-green-dark/60 mb-1">Pago</label>
            <select value={filtros.metodoPago} onChange={e => setFiltros({...filtros, metodoPago: e.target.value})} className="w-full border border-forest-green-dark/20 rounded-lg p-2 focus:border-conservation-gold outline-none text-sm capitalize text-forest-green-dark bg-transparent">
              <option value="todos">Todos</option>
              <option value="efectivo">Efectivo</option>
              <option value="tarjeta">Tarjeta</option>
              <option value="saldo_rfid">Saldo RFID</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end pt-2">
          <button onClick={cargarDatos} disabled={loading} className="bg-forest-green-dark/10 text-forest-green-dark px-6 py-2 rounded-lg font-medium hover:bg-forest-green-dark/20 transition-colors disabled:opacity-50">
            {loading ? 'Aplicando...' : 'Aplicar Filtros'}
          </button>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-forest-green-dark/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-forest-green-dark/5 border-b border-forest-green-dark/10 text-sm font-semibold text-forest-green-dark/80 whitespace-nowrap">
                <th className="p-4">Fecha</th>
                <th className="p-4">Caja</th>
                <th className="p-4">Producto</th>
                <th className="p-4">Categoría</th>
                <th className="p-4 text-center">Cant.</th>
                <th className="p-4 text-right">Precio U.</th>
                <th className="p-4 text-right">Total</th>
                <th className="p-4">Método</th>
                <th className="p-4">Origen</th>
                <th className="p-4 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-green-dark/5 text-sm text-forest-green-dark">
              {loading ? (
                <tr><td colSpan={9} className="p-8 text-center text-forest-green-dark/50">Cargando datos...</td></tr>
              ) : data.filas.length === 0 ? (
                <tr><td colSpan={9} className="p-8 text-center text-forest-green-dark/50">No hay ventas en este periodo.</td></tr>
              ) : (
                data.filas.map((f: any) => (
                  <tr 
                    key={f.id} 
                    onClick={() => handleRowClick(f)}
                    className={`transition-colors ${f.origen === 'donativos' ? 'cursor-pointer hover:bg-forest-green-dark/10' : 'hover:bg-forest-green-dark/5'}`}
                  >
                    <td className="p-4 whitespace-nowrap text-forest-green-dark/70">{f.fecha}</td>
                    <td className="p-4 font-medium">{f.caja}</td>
                    <td className="p-4">{f.producto}</td>
                    <td className="p-4 capitalize">{f.categoria.replace('_', ' ')}</td>
                    <td className="p-4 text-center font-bold">{f.cantidad}</td>
                    <td className="p-4 text-right">{formatCurrency(f.precio_unitario)}</td>
                    <td className="p-4 text-right font-bold text-quetzal-blue">{formatCurrency(f.total)}</td>
                    <td className="p-4 capitalize">
                      <span className="bg-forest-green-dark/10 px-2 py-1 rounded text-xs">{f.metodo_pago}</span>
                    </td>
                    <td className="p-4">
                      {f.origen && (
                        <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                          f.origen === 'donativos' ? 'bg-conservation-gold/20 text-conservation-gold' :
                          f.origen === 'donar' ? 'bg-quetzal-blue/10 text-quetzal-blue' :
                          'bg-forest-green-dark/10 text-forest-green-dark/60'
                        }`}>
                          {f.origen === 'donativos' ? '🌿 Especie' : f.origen === 'donar' ? '💛 Genérico' : f.origen}
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-center">
                      {f.origen === 'donativos' && (
                        <button className="text-forest-green-dark/50 hover:text-forest-green-dark transition-colors" title="Ver detalles">
                          <Eye className="h-5 w-5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <DonacionDetalleModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        data={selectedDonacion} 
      />
    </div>
  )
}
