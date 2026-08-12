'use client'

import { useState, useTransition } from 'react'
import { MessageSquare, Webhook, CheckCircle, Loader2, Eye, EyeOff, PhoneCall } from 'lucide-react'
import { toast } from 'sonner'
import { saveConfiguracion } from './actions'
import { Video } from 'lucide-react'

interface ConfiguracionClientProps {
  config: Record<string, string>
}

export default function ConfiguracionClient({ config }: ConfiguracionClientProps) {
  const [values, setValues] = useState({
    whatsapp_numero: config.whatsapp_numero ?? '',
    whatsapp_mensaje: config.whatsapp_mensaje ?? '',
    n8n_webhook_url: config.n8n_webhook_url ?? '',
    video_testimonial_url: config.video_testimonial_url ?? '',
  })
  const [showWebhook, setShowWebhook] = useState(false)
  const [saved, setSaved] = useState<Record<string, boolean>>({})
  const [isPending, startTransition] = useTransition()

  const handleSave = (key: 'whatsapp_numero' | 'whatsapp_mensaje' | 'n8n_webhook_url' | 'video_testimonial_url') => {
    startTransition(async () => {
      const res = await saveConfiguracion(key, values[key])
      if ('error' in res) {
        toast.error(res.error)
        return
      }
      setSaved((s) => ({ ...s, [key]: true }))
      toast.success('Guardado correctamente')
      setTimeout(() => setSaved((s) => ({ ...s, [key]: false })), 3000)
    })
  }

  const inputCls =
    'w-full px-4 py-3 bg-white border border-forest-green-dark/15 rounded-xl text-forest-green-dark focus:border-quetzal-blue focus:outline-none focus:ring-1 focus:ring-quetzal-blue text-sm transition-colors'

  const SaveButton = ({ field }: { field: 'whatsapp_numero' | 'whatsapp_mensaje' | 'n8n_webhook_url' | 'video_testimonial_url' }) => (
    <button
      onClick={() => handleSave(field)}
      disabled={isPending}
      className={`mt-2 flex items-center gap-2 font-semibold text-sm px-4 py-2 rounded-xl transition-all ${
        saved[field]
          ? 'bg-emerald-500 text-white'
          : 'bg-forest-green-dark text-white hover:bg-forest-green-light'
      } disabled:opacity-60`}
    >
      {isPending && !saved[field] ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : saved[field] ? (
        <CheckCircle className="h-4 w-4" />
      ) : null}
      {saved[field] ? '¡Guardado!' : 'Guardar'}
    </button>
  )

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-forest-green-dark">Configuración</h1>
        <p className="text-forest-green-dark/60 mt-1">Ajustes generales del santuario El Nido.</p>
      </div>

      {/* WhatsApp Settings */}
      <div className="bg-white rounded-2xl border border-forest-green-dark/10 shadow-sm overflow-hidden">
        <div className="bg-[#25D366]/10 border-b border-[#25D366]/20 px-6 py-4 flex items-center gap-3">
          <div className="bg-[#25D366] text-white p-2 rounded-xl">
            <MessageSquare className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-forest-green-dark">WhatsApp</h2>
            <p className="text-xs text-forest-green-dark/60">Configura el botón flotante de contacto</p>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Número */}
          <div>
            <label className="block text-xs font-semibold text-forest-green-dark/60 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
              <PhoneCall className="h-3.5 w-3.5" />
              Número de WhatsApp
            </label>
            <input
              type="tel"
              value={values.whatsapp_numero}
              onChange={(e) => setValues({ ...values, whatsapp_numero: e.target.value })}
              placeholder="5215512345678 (incluye código de país)"
              className={inputCls}
            />
            <p className="text-xs text-forest-green-dark/40 mt-1">
              Formato: código de país + número sin espacios ni guiones. Ej: <code>5215512345678</code>
            </p>
            <SaveButton field="whatsapp_numero" />
          </div>

          {/* Mensaje predeterminado */}
          <div>
            <label className="block text-xs font-semibold text-forest-green-dark/60 uppercase tracking-wider mb-1.5">
              Mensaje predeterminado
            </label>
            <textarea
              rows={3}
              value={values.whatsapp_mensaje}
              onChange={(e) => setValues({ ...values, whatsapp_mensaje: e.target.value })}
              placeholder="Hola, quiero información sobre El Nido 🦜"
              className={`${inputCls} resize-none`}
            />
            <p className="text-xs text-forest-green-dark/40 mt-1">
              Este texto se pre-llenará cuando el visitante haga clic en el botón flotante.
            </p>
            <SaveButton field="whatsapp_mensaje" />
          </div>

          {/* Preview */}
          <div className="bg-[#ECE5DD] rounded-xl p-4">
            <p className="text-xs font-bold text-forest-green-dark/50 uppercase tracking-wider mb-2">
              Vista previa del mensaje
            </p>
            <div className="bg-white rounded-lg px-4 py-3 text-sm text-forest-green-dark shadow-sm max-w-xs">
              {values.whatsapp_mensaje || 'Hola, quiero información sobre El Nido 🦜'}
            </div>
          </div>
        </div>
      </div>

      {/* N8N Webhook */}
      <div className="bg-white rounded-2xl border border-forest-green-dark/10 shadow-sm overflow-hidden">
        <div className="bg-purple-50 border-b border-purple-200 px-6 py-4 flex items-center gap-3">
          <div className="bg-purple-600 text-white p-2 rounded-xl">
            <Webhook className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-forest-green-dark">N8N Webhook</h2>
            <p className="text-xs text-forest-green-dark/60">URL del webhook para automatizaciones</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-forest-green-dark/60 uppercase tracking-wider mb-1.5">
              URL del Webhook
            </label>
            <div className="relative">
              <input
                type={showWebhook ? 'text' : 'password'}
                value={values.n8n_webhook_url}
                onChange={(e) => setValues({ ...values, n8n_webhook_url: e.target.value })}
                placeholder="https://tu-instancia.n8n.io/webhook/..."
                className={`${inputCls} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowWebhook(!showWebhook)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-green-dark/40 hover:text-forest-green-dark"
                aria-label={showWebhook ? 'Ocultar URL' : 'Mostrar URL'}
              >
                {showWebhook ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-forest-green-dark/40 mt-1">
              Esta URL se usará para disparar flujos de automatización en N8N al completarse un donativo.
            </p>
            <SaveButton field="n8n_webhook_url" />
          </div>

          {/* Setup guide link */}
          <div className="bg-purple-50 rounded-xl p-4 text-sm text-purple-700">
            <p className="font-semibold mb-1">¿Cómo configurar N8N?</p>
            <ol className="list-decimal list-inside space-y-1 text-xs text-purple-600">
              <li>Crea un flujo en N8N con un nodo <strong>Webhook</strong></li>
              <li>Copia la URL de producción del webhook</li>
              <li>Pégala en este campo y guarda</li>
              <li>En N8N, conecta el nodo Webhook con un nodo de WhatsApp o Email</li>
              <li>El payload que recibirás incluye: <code>donante_nombre</code>, <code>donante_email</code>, <code>monto</code>, <code>especie</code></li>
            </ol>
          </div>
        </div>
      </div>

      {/* Video Testimonial */}
      <div className="bg-white rounded-2xl border border-forest-green-dark/10 shadow-sm overflow-hidden">
        <div className="bg-blue-50 border-b border-blue-200 px-6 py-4 flex items-center gap-3">
          <div className="bg-blue-600 text-white p-2 rounded-xl">
            <Video className="h-5 w-5" />
          </div>
          <div>
            <h2 className="font-bold text-forest-green-dark">Video Testimonial</h2>
            <p className="text-xs text-forest-green-dark/60">Configura el video emotivo para la página principal y donativos</p>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-forest-green-dark/60 uppercase tracking-wider mb-1.5">
              URL del video (WebM/MP4)
            </label>
            <input
              type="url"
              value={values.video_testimonial_url}
              onChange={(e) => setValues({ ...values, video_testimonial_url: e.target.value })}
              placeholder="https://..."
              className={inputCls}
            />
            <p className="text-xs text-forest-green-dark/40 mt-1">
              Deja este campo en blanco para ocultar la sección. Usa una URL directa a un archivo .webm o .mp4.
            </p>
            <SaveButton field="video_testimonial_url" />
          </div>
        </div>
      </div>
    </div>
  )
}
