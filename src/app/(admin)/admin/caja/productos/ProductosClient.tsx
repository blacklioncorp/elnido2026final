'use client'

import { useState } from 'react'
import { guardarProducto, eliminarProducto } from './actions'
import { Edit2, Trash2, Plus, X } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

export default function ProductosClient({ productosIniciales, categorias }: { productosIniciales: any[], categorias: string[] }) {
  const [productos, setProductos] = useState(productosIniciales)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  
  const [form, setForm] = useState({
    nombre: '',
    precio: '',
    categoria: '',
    activo: true
  })
  
  const [saving, setSaving] = useState(false)

  const openModal = (producto: { id?: string; nombre: string; precio: number; categoria: string; activo: boolean } | null = null) => {
    if (producto) {
      setEditing(producto)
      setForm({
        nombre: producto.nombre,
        precio: producto.precio.toString(),
        categoria: producto.categoria,
        activo: producto.activo
      })
    } else {
      setEditing(null)
      setForm({ nombre: '', precio: '', categoria: '', activo: true })
    }
    setModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const p = {
        id: editing?.id,
        nombre: form.nombre,
        precio: Number(form.precio),
        categoria: form.categoria.toLowerCase().trim(),
        activo: form.activo
      }
      await guardarProducto(p)
      window.location.reload()
    } catch (err: any) {
      alert('Error al guardar el producto: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('¿Seguro que deseas eliminar este producto?')) {
      await eliminarProducto(id)
      setProductos(productos.filter(p => p.id !== id))
    }
  }

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-forest-green-dark">Catálogo POS</h1>
          <p className="text-forest-green-dark/60 mt-1">Administra los productos de cafetería y tienda.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-conservation-gold text-forest-green-dark px-4 py-2 rounded-xl font-bold hover:bg-[#D4A373] transition-colors shadow-sm"
        >
          <Plus className="h-5 w-5" /> Nuevo Producto
        </button>
      </div>
      
      {/* TODO Prompt 3: Activar pestaña "Cursos" o crear botón de exportar catálogo VOD */}

      <div className="bg-white rounded-2xl border border-forest-green-dark/10 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-forest-green-dark/5 border-b border-forest-green-dark/10 text-sm font-semibold text-forest-green-dark/80">
              <th className="p-4">Nombre</th>
              <th className="p-4">Categoría</th>
              <th className="p-4">Precio</th>
              <th className="p-4">Estado</th>
              <th className="p-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-forest-green-dark/5 text-sm text-forest-green-dark">
            {productos.map(p => (
              <tr key={p.id} className="hover:bg-forest-green-dark/5 transition-colors">
                <td className="p-4 font-medium">{p.nombre}</td>
                <td className="p-4 capitalize">{p.categoria.replace('_', ' ')}</td>
                <td className="p-4 font-bold text-quetzal-blue">{formatCurrency(p.precio)}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${p.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {p.activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
                <td className="p-4 flex items-center justify-end gap-2">
                  <button onClick={() => openModal(p)} className="p-2 text-forest-green-dark/60 hover:text-quetzal-blue hover:bg-quetzal-blue/10 rounded-lg transition-colors">
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(p.id)} className="p-2 text-forest-green-dark/60 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
            {productos.length === 0 && (
              <tr>
                <td colSpan={5} className="p-8 text-center text-forest-green-dark/50">No hay productos en el catálogo.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-forest-green-dark/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-forest-green-dark/10 flex items-center justify-between">
              <h3 className="font-bold text-xl text-forest-green-dark">{editing ? 'Editar Producto' : 'Nuevo Producto'}</h3>
              <button onClick={() => setModalOpen(false)} className="text-forest-green-dark/40 hover:text-forest-green-dark">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-forest-green-dark mb-1">Nombre</label>
                <input required type="text" value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})} className="text-black bg-white font-semibold w-full border border-forest-green-dark/20 rounded-xl p-2.5 focus:border-conservation-gold focus:ring-1 focus:ring-conservation-gold outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-green-dark mb-1">Precio</label>
                <input required type="number" step="0.01" min="0" value={form.precio} onChange={e => setForm({...form, precio: e.target.value})} className="text-black bg-white font-semibold w-full border border-forest-green-dark/20 rounded-xl p-2.5 focus:border-conservation-gold focus:ring-1 focus:ring-conservation-gold outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-forest-green-dark mb-1">Categoría</label>
                <input required type="text" list="categorias-list" value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} className="text-black bg-white font-semibold w-full border border-forest-green-dark/20 rounded-xl p-2.5 focus:border-conservation-gold focus:ring-1 focus:ring-conservation-gold outline-none" />
                <datalist id="categorias-list">
                  {categorias.map(c => <option key={c} value={c} />)}
                  <option value="cafeteria" />
                  <option value="tienda" />
                </datalist>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.activo} onChange={e => setForm({...form, activo: e.target.checked})} className="sr-only peer" />
                  <div className="w-11 h-6 bg-forest-green-dark/20 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-quetzal-blue"></div>
                  <span className="ml-3 text-sm font-medium text-forest-green-dark">Producto Activo</span>
                </label>
              </div>
              
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl font-medium border border-forest-green-dark/20 text-forest-green-dark hover:bg-forest-green-dark/5 transition-colors">Cancelar</button>
                <button type="submit" disabled={saving} className="flex-1 px-4 py-2.5 rounded-xl font-medium bg-forest-green-dark text-white hover:bg-forest-green-dark/90 transition-colors disabled:opacity-50">{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
