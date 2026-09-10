import { getProductos, getCategoriasUnicas } from './actions'
import ProductosClient from './ProductosClient'

export const metadata = {
  title: 'Catálogo de Productos POS - El Nido',
}

export default async function ProductosPage() {
  const productos = await getProductos()
  const categorias = await getCategoriasUnicas()

  return <ProductosClient productosIniciales={productos} categorias={categorias} />
}
