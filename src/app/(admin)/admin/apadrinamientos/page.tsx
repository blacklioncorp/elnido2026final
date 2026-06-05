export default function AdminSubPage() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-off-white tracking-tight">Apadrinamientos</h1>
        <p className="text-off-white/50 mt-1">Revisa todos los apadrinamientos activos</p>
      </div>
      <div className="bg-forest-green-light/40 backdrop-blur-sm rounded-2xl border border-white/10 border-dashed p-16 text-center">
        <p className="text-conservation-gold text-4xl mb-4">🚧</p>
        <p className="text-off-white font-bold text-lg mb-2">En desarrollo</p>
        <p className="text-off-white/40 text-sm">Esta sección se conectará a Supabase en la siguiente fase.</p>
      </div>
    </div>
  )
}
