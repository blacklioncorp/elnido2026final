import { redirect } from 'next/navigation'

// Redirigir a la página principal de blog que ya tiene el formulario
export default function NuevaBlogPage() {
  redirect('/admin/blog')
}
