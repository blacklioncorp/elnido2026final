'use client'

import { useState } from 'react'
import { usePOSStore } from '@/store/pos-store'
import { buscarCliente, procesarVenta } from '@/app/(admin)/admin/caja/actions'
import { Search, X, Plus, Minus, CreditCard, Banknote, Smartphone, Store, BadgeCheck, QrCode } from 'lucide-react'
import { cn, formatCurrency } from '@/lib/utils'

export default function POSVenta({ productosCat }: { productosCat: any[] }) {
  const store = usePOSStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [processing, setProcessing] = useState(false)
  
  const [qrCode, setQrCode] = useState('')
  const [validandoQr, setValidandoQr] = useState(false)
  
  const [filtroCat, setFiltroCat] = useState<string>('todos')
  
  const categorias = ['todos', ...Array.from(new Set(productosCat.map(p => p.categoria)))]
  const productosFiltrados = filtroCat === 'todos' ? productosCat : productosCat.filter(p => p.categoria === filtroCat)

  const handleBuscar = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!searchQuery) return
    setSearching(true)
    try {
      const cliente = await buscarCliente(searchQuery)
      store.setCliente(cliente) // Puede ser null si no se encuentra
    } catch (err) {
      console.error(err)
      store.setCliente(null)
    } finally {
      setSearching(false)
    }
  }

  const handleValidarQr = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!qrCode) return
    setValidandoQr(true)
    try {
      const res = await fetch('/api/qr/validar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qr_code: qrCode.trim() })
      })
      const data = await res.json()
      if (data.valido) {
        alert(`✅ Acceso Válido\nNombre: ${data.datos.nombre}\nTipo: ${data.datos.tipo_producto}\nPersonas: ${data.datos.cantidad_personas}`)
      } else {
        alert(`❌ Error: ${data.mensaje}`)
      }
    } catch (err: any) {
      alert(`❌ Error al validar QR: ${err.message}`)
    } finally {
      setValidandoQr(false)
      setQrCode('')
    }
  }

  const handleCobrar = async () => {
    if (!store.metodoPago || store.itemsVenta.length === 0) return
    setProcessing(true)
    
    try {
      const venta = {
        caja_id: store.cajaId,
        cliente_id: store.clienteActual?.id || null,
        total: store.getTotal(),
        metodo_pago: store.metodoPago
      }
      
      const { exito, ventaId } = await procesarVenta(venta, store.itemsVenta)
      
      if (exito) {
        // PROMPT 3: Dejar el objeto del ticket en memoria preparado
        const ticketEnMemoria = {
          ventaId,
          fecha: new Date().toISOString(),
          caja: store.cajaNombre,
          productos: store.itemsVenta.map(i => ({ nombre: i.nombre, cantidad: i.cantidad, precio: i.precio })),
          total: store.getTotal(),
          metodoPago: store.metodoPago
        }
        console.log('Ticket generado para futura impresión:', ticketEnMemoria)
        
        // Simular Toast nativo
        alert(`¡Cobro Exitoso!\nMonto: ${formatCurrency(store.getTotal())}\nMétodo: ${store.metodoPago}`)
        
        store.resetVenta()
      }
    } catch (err: any) {
      alert(err.message || 'Error al procesar el cobro')
    } finally {
      setProcessing(false)
    }
  }

  const saldoInsuficiente = store.metodoPago === 'saldo_rfid' && (store.clienteActual?.saldo || 0) < store.getTotal()

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-theme(spacing.16))] lg:h-screen lg:flex-row bg-off-white overflow-hidden">
      
      {/* Columna Izquierda: Búsqueda + Catálogo */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-forest-green-dark/10 overflow-y-auto">
        {/* Header Caja */}
        <div className="bg-white px-6 py-4 flex items-center justify-between border-b border-forest-green-dark/10 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <Store className="h-6 w-6 text-conservation-gold" />
            <div>
              <h2 className="font-bold text-forest-green-dark">{store.cajaNombre}</h2>
              <span className="text-xs bg-forest-green-dark/10 text-forest-green-dark px-2 py-0.5 rounded-full capitalize">
                {store.cajaTipo}
              </span>
            </div>
          </div>
          <button 
            onClick={() => { if(confirm('¿Seguro que deseas cerrar la caja?')) store.cerrarCaja() }}
            className="text-red-500 hover:bg-red-50 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          >
            Cerrar Caja
          </button>
        </div>

        <div className="p-6 space-y-6 flex-1">
          {/* Buscar Cliente */}
          <section className="bg-white p-4 rounded-2xl border border-forest-green-dark/10">
            <form onSubmit={handleBuscar} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-forest-green-dark/40" />
                <input
                  type="text"
                  placeholder="Buscar cliente por email o nombre..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-forest-green-dark/20 focus:border-quetzal-blue focus:ring-1 focus:ring-quetzal-blue outline-none"
                />
              </div>
              <button 
                type="submit" 
                disabled={searching || !searchQuery}
                className="bg-forest-green-dark text-white px-6 py-2.5 rounded-xl font-medium hover:bg-forest-green-dark/90 transition-colors disabled:opacity-50"
              >
                Buscar
              </button>
            </form>

            {/* Resultado Cliente */}
            {store.clienteActual && (
              <div className="mt-4 p-4 bg-forest-green-dark/5 rounded-xl flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-bold text-forest-green-dark">{store.clienteActual.nombre}</p>
                    {store.clienteActual.membresiaActiva && (
                      <span className="bg-conservation-gold/20 text-forest-green-dark text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <BadgeCheck className="h-3 w-3" /> {store.clienteActual.membresiaTipo || 'Membresía'}
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-forest-green-dark/60">{store.clienteActual.email}</p>
                  <p className="text-sm font-medium text-forest-green-dark mt-2">
                    Saldo RFID: <span className="text-quetzal-blue">{formatCurrency(store.clienteActual.saldo)}</span>
                  </p>
                </div>
                <button 
                  onClick={() => store.setCliente(null)}
                  className="text-forest-green-dark/40 hover:text-red-500 transition-colors"
                  aria-label="Limpiar cliente"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            )}
            
            {searchQuery && !store.clienteActual && !searching && (
              <p className="mt-3 text-sm text-forest-green-dark/60 text-center">Cliente no encontrado. Venta sin cliente.</p>
            )}
          </section>

          {/* Validar Acceso (QR) */}
          <section className="bg-white p-4 rounded-2xl border border-forest-green-dark/10">
            <div className="flex items-center gap-2 mb-3">
              <QrCode className="h-5 w-5 text-quetzal-blue" />
              <h3 className="font-semibold text-forest-green-dark">Validar Acceso (Boletos/Membresías)</h3>
            </div>
            <form onSubmit={handleValidarQr} className="flex gap-2">
              <div className="relative flex-1">
                <QrCode className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-forest-green-dark/40" />
                <input
                  type="text"
                  placeholder="Escanear o pegar código QR (ELNIDO-...)"
                  value={qrCode}
                  onChange={e => setQrCode(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-forest-green-dark/20 focus:border-quetzal-blue focus:ring-1 focus:ring-quetzal-blue outline-none"
                />
              </div>
              <button 
                type="submit" 
                disabled={validandoQr || !qrCode}
                className="bg-quetzal-blue text-white px-6 py-2.5 rounded-xl font-medium hover:bg-quetzal-blue/90 transition-colors disabled:opacity-50"
              >
                {validandoQr ? 'Validando...' : 'Validar'}
              </button>
            </form>
          </section>

          {/* Catálogo de Productos */}
          <section>
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
              {categorias.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFiltroCat(cat)}
                  className={cn(
                    "px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors border",
                    filtroCat === cat 
                      ? "bg-forest-green-dark text-white border-forest-green-dark" 
                      : "bg-white text-forest-green-dark border-forest-green-dark/20 hover:border-forest-green-dark/40"
                  )}
                >
                  {cat.charAt(0).toUpperCase() + cat.slice(1).replace('_', ' ')}
                </button>
              ))}
              {/* TODO Prompt 3: Activar pestaña "Cursos" en catálogo POS */}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {productosFiltrados.map(p => {
                const enCarrito = store.itemsVenta.find(i => i.productoId === p.id)
                return (
                  <div key={p.id} className="bg-white p-4 rounded-2xl border border-forest-green-dark/10 flex flex-col justify-between">
                    <div className="mb-4">
                      <p className="font-semibold text-forest-green-dark leading-tight">{p.nombre}</p>
                      <p className="text-quetzal-blue font-bold mt-1">{formatCurrency(p.precio)}</p>
                    </div>
                    {enCarrito ? (
                      <div className="flex items-center justify-between bg-forest-green-dark/5 rounded-xl p-1 text-forest-green-dark">
                        <button onClick={() => store.updateCantidad(p.id, enCarrito.cantidad - 1)} className="p-2 hover:bg-white rounded-lg transition-colors">
                          <Minus className="h-4 w-4" />
                        </button>
                        <span className="font-bold w-8 text-center">{enCarrito.cantidad}</span>
                        <button onClick={() => store.addProducto({ productoId: p.id, nombre: p.nombre, precio: p.precio })} className="p-2 hover:bg-white rounded-lg transition-colors">
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => store.addProducto({ productoId: p.id, nombre: p.nombre, precio: p.precio })}
                        className="w-full bg-forest-green-dark/5 hover:bg-forest-green-dark hover:text-white text-forest-green-dark py-2.5 rounded-xl font-medium transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus className="h-4 w-4" /> Agregar
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          </section>
        </div>
      </div>

      {/* Columna Derecha: Ticket y Pago */}
      <div className="w-full lg:w-96 bg-white border-l border-forest-green-dark/10 flex flex-col shrink-0">
        <div className="p-6 flex-1 overflow-y-auto">
          <h3 className="font-bold text-lg text-forest-green-dark mb-4">Ticket de Venta</h3>
          
          {store.itemsVenta.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-forest-green-dark/40">
              <Store className="h-8 w-8 mb-2 opacity-50" />
              <p className="text-sm">Agrega productos del catálogo</p>
            </div>
          ) : (
            <div className="space-y-4">
              {store.itemsVenta.map(item => (
                <div key={item.productoId} className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm truncate">{item.nombre}</p>
                    <p className="text-xs text-forest-green-dark/60">{formatCurrency(item.precio)} c/u</p>
                  </div>
                  
                  {/* Controles de cantidad en el ticket */}
                  <div className="flex items-center gap-1 bg-forest-green-dark/5 rounded-lg p-0.5 text-forest-green-dark">
                    <button onClick={() => store.updateCantidad(item.productoId, item.cantidad - 1)} className="p-1.5 hover:bg-white rounded transition-colors">
                      <Minus className="h-3 w-3" />
                    </button>
                    <input 
                      type="number"
                      min="1"
                      value={item.cantidad}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) store.updateCantidad(item.productoId, val);
                      }}
                      className="w-10 text-center font-bold bg-transparent text-sm outline-none"
                    />
                    <button onClick={() => store.addProducto({ productoId: item.productoId, nombre: item.nombre, precio: item.precio })} className="p-1.5 hover:bg-white rounded transition-colors">
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>

                  <div className="text-right shrink-0 w-16">
                    <p className="font-bold text-sm text-quetzal-blue">{formatCurrency(item.precio * item.cantidad)}</p>
                  </div>
                  <button onClick={() => store.removeProducto(item.productoId)} className="text-red-400 hover:text-red-600 p-1">
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Zona de Pago */}
        <div className="p-6 bg-forest-green-dark/5 border-t border-forest-green-dark/10 space-y-4">
          <div className="flex justify-between items-end mb-2">
            <span className="text-forest-green-dark/60 font-medium">Total</span>
            <span className="text-3xl font-bold text-forest-green-dark">{formatCurrency(store.getTotal())}</span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => store.setMetodoPago('efectivo')}
              className={cn("flex flex-col items-center justify-center p-3 rounded-xl border transition-all", store.metodoPago === 'efectivo' ? "bg-forest-green-dark border-forest-green-dark text-white shadow-md" : "bg-white border-forest-green-dark/20 hover:border-forest-green-dark text-forest-green-dark")}
            >
              <Banknote className="h-5 w-5 mb-1" />
              <span className="text-xs font-semibold">Efectivo</span>
            </button>
            <button 
              onClick={() => store.setMetodoPago('tarjeta')}
              className={cn("flex flex-col items-center justify-center p-3 rounded-xl border transition-all", store.metodoPago === 'tarjeta' ? "bg-forest-green-dark border-forest-green-dark text-white shadow-md" : "bg-white border-forest-green-dark/20 hover:border-forest-green-dark text-forest-green-dark")}
            >
              <CreditCard className="h-5 w-5 mb-1" />
              <span className="text-xs font-semibold">Tarjeta</span>
            </button>
            <button 
              onClick={() => store.setMetodoPago('saldo_rfid')}
              disabled={!store.clienteActual || store.clienteActual.saldo === 0}
              className={cn("flex flex-col items-center justify-center p-3 rounded-xl border transition-all disabled:opacity-40 disabled:cursor-not-allowed", store.metodoPago === 'saldo_rfid' ? "bg-forest-green-dark border-forest-green-dark text-white shadow-md" : "bg-white border-forest-green-dark/20 hover:border-forest-green-dark text-forest-green-dark")}
            >
              <Smartphone className="h-5 w-5 mb-1" />
              <span className="text-xs font-semibold">RFID</span>
            </button>
          </div>

          {saldoInsuficiente && (
            <p className="text-xs text-red-500 font-medium text-center">Saldo insuficiente para cubrir el total</p>
          )}

          <button
            onClick={handleCobrar}
            disabled={!store.metodoPago || store.itemsVenta.length === 0 || processing || saldoInsuficiente}
            className="w-full bg-conservation-gold text-forest-green-dark py-4 rounded-xl font-bold text-lg hover:bg-[#D4A373] transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {processing ? 'Procesando...' : `COBRAR ${formatCurrency(store.getTotal())}`}
          </button>
        </div>
      </div>
    </div>
  )
}
