'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Mail, MapPin, Phone, Send } from 'lucide-react'
import { enviarMensajeContacto } from '@/app/actions/contacto'

export default function ContactoPage() {
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData()
    formData.append('name', form.name)
    formData.append('email', form.email)
    formData.append('subject', form.subject)
    formData.append('message', form.message)

    const result = await enviarMensajeContacto(formData)

    if (result.success) {
      toast.success('Mensaje enviado. Nos pondremos en contacto contigo pronto.')
      setForm({ name: '', email: '', subject: '', message: '' })
    } else {
      toast.error(result.error || 'No se pudo enviar el mensaje.')
    }
    setLoading(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-5xl">
      <div className="text-center mb-14">
        <p className="text-conservation-gold font-semibold tracking-widest uppercase text-sm mb-3">Escríbenos</p>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tighter text-off-white">Contacto</h1>
        <p className="text-off-white/50 mt-4 max-w-lg mx-auto">Estamos aquí para responder tus preguntas sobre conservación, voluntariado y apadrinamientos.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-10">
        {/* Info */}
        <div className="lg:col-span-2 space-y-8">
          {[
            { icon: Mail, label: 'Correo', value: 'info@elnido.mx' },
            { icon: Phone, label: 'Teléfono', value: '(56) 2160 0230' },
            { icon: MapPin, label: 'Ubicación', value: 'Calle Progreso s/n esquina av. Acozac, Ixtapaluca Centro, Ixtapaluca, Estado de México.' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-conservation-gold/10 border border-conservation-gold/20">
                <Icon className="h-5 w-5 text-conservation-gold" />
              </div>
              <div>
                <p className="text-off-white/50 text-xs uppercase tracking-widest font-semibold mb-0.5">{label}</p>
                <p className="text-off-white font-medium">{value}</p>
              </div>
            </div>
          ))}

          <div className="pt-6 border-t border-white/10">
            <p className="text-off-white/50 text-sm leading-relaxed">
              Para donaciones y apadrinamientos, usa los formularios dedicados. Este contacto es para consultas generales, prensa y alianzas estratégicas.
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-3 bg-forest-green-light/40 backdrop-blur-sm rounded-3xl border border-white/10 p-8 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-off-white/70 mb-1.5">Nombre</label>
              <input name="name" required value={form.name} onChange={handleChange} placeholder="Tu nombre" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-conservation-gold focus:outline-none focus:ring-1 focus:ring-conservation-gold text-off-white placeholder-off-white/30 transition-colors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-off-white/70 mb-1.5">Correo</label>
              <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="tu@correo.com" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-conservation-gold focus:outline-none focus:ring-1 focus:ring-conservation-gold text-off-white placeholder-off-white/30 transition-colors" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-off-white/70 mb-1.5">Asunto</label>
            <select name="subject" required value={form.subject} onChange={handleChange} className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-conservation-gold focus:outline-none focus:ring-1 focus:ring-conservation-gold text-off-white transition-colors">
              <option value="" className="bg-forest-green-dark">Selecciona un asunto</option>
              <option value="Voluntariado" className="bg-forest-green-dark">Voluntariado</option>
              <option value="Alianza estratégica" className="bg-forest-green-dark">Alianza estratégica</option>
              <option value="Prensa y medios" className="bg-forest-green-dark">Prensa y medios</option>
              <option value="Visitas al santuario" className="bg-forest-green-dark">Visitas al santuario</option>
              <option value="Otro" className="bg-forest-green-dark">Otro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-off-white/70 mb-1.5">Mensaje</label>
            <textarea name="message" required rows={5} value={form.message} onChange={handleChange} placeholder="¿En qué podemos ayudarte?" className="w-full px-4 py-3 rounded-xl bg-white/10 border border-white/20 focus:border-conservation-gold focus:outline-none focus:ring-1 focus:ring-conservation-gold text-off-white placeholder-off-white/30 transition-colors resize-none" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-conservation-gold hover:bg-conservation-gold/90 disabled:opacity-60 text-forest-green-dark font-extrabold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] flex items-center justify-center gap-2">
            {loading
              ? <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>
              : <><Send className="h-5 w-5" /> Enviar Mensaje</>
            }
          </button>
        </form>
      </div>
    </div>
  )
}
