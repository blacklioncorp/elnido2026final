'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { motion } from 'framer-motion'
import { Calculator, Send, MessageCircle, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react'
import { PaqueteEducativo } from '@/types/grupos'
import { enviarCotizacion } from '@/app/actions/cotizaciones'
import { toast } from 'sonner'

interface Props {
  paquetes: PaqueteEducativo[]
  selectedPaqueteId?: string
}

const LUNCH_PRICE = 80 // Precio fijo por persona
const MIN_PERSONAS = 10
const MAX_PERSONAS = 60

const formSchema = z.object({
  paquete_id: z.string().min(1, 'Selecciona un paquete'),
  personas: z.number().min(MIN_PERSONAS, `Mínimo ${MIN_PERSONAS} personas`).max(MAX_PERSONAS, `Máximo ${MAX_PERSONAS} personas`),
  fecha_deseada: z.string().min(1, 'Selecciona una fecha deseada'),
  incluye_lunch: z.boolean().optional(),
  incluye_transporte: z.boolean().optional(),
  cliente_nombre: z.string().min(2, 'Nombre es requerido'),
  cliente_email: z.string().email('Email inválido'),
  cliente_telefono: z.string().optional(),
  escuela: z.string().min(2, 'Institución es requerida'),
  mensaje: z.string().optional(),
  acepto_terminos: z.boolean().refine(val => val, 'Debes aceptar los términos')
})

type FormData = z.infer<typeof formSchema>

export default function CalculadoraCotizacion({ paquetes, selectedPaqueteId }: Props) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  // Calcular la fecha mínima (mañana)
  const minDate = new Date()
  minDate.setDate(minDate.getDate() + 1)
  const minDateString = minDate.toISOString().split('T')[0]

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      paquete_id: selectedPaqueteId || (paquetes.length > 0 ? paquetes[0].id : ''),
      personas: 30,
      fecha_deseada: '',
      incluye_lunch: false,
      incluye_transporte: false,
      acepto_terminos: false
    }
  })

  const watchAll = watch()
  
  const paqueteSeleccionado = useMemo(() => 
    paquetes.find(p => p.id === watchAll.paquete_id) || paquetes[0],
  [watchAll.paquete_id, paquetes])

  const subtotal = (paqueteSeleccionado?.precio_por_persona || 0) * (watchAll.personas || 0)
  const lunchTotal = watchAll.incluye_lunch ? LUNCH_PRICE * (watchAll.personas || 0) : 0
  const total = subtotal + lunchTotal

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    try {
      const formData = new FormData()
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) formData.append(key, value.toString())
      })

      const response = await enviarCotizacion(null, formData)
      
      if (response.success) {
        setSuccess(true)
        toast.success(response.message)
        reset()
        // Ocultar mensaje de éxito después de unos segundos
        setTimeout(() => setSuccess(false), 5000)
      } else {
        toast.error(response.error || 'Ocurrió un error al enviar la cotización')
      }
    } catch (error) {
      toast.error('Ocurrió un error inesperado')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleWhatsApp = () => {
    if (!paqueteSeleccionado || !watchAll.fecha_deseada) {
      toast.error('Selecciona un paquete y una fecha para cotizar por WhatsApp')
      return
    }
    const numero = '5215512345678' // Reemplazar con el real
    const mensaje = `Hola, quiero información sobre el paquete ${paqueteSeleccionado.nombre} para ${watchAll.personas} personas. Fecha deseada: ${watchAll.fecha_deseada}.`
    const url = `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank', 'noopener noreferrer')
  }

  return (
    <div className="bg-forest-green-dark/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 lg:p-8 shadow-2xl relative overflow-hidden">
      {/* Decors */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-conservation-gold/5 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-quetzal-blue/10 rounded-full blur-3xl -z-10 -translate-x-1/2 translate-y-1/2" />

      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-white/10 rounded-xl">
          <Calculator className="w-6 h-6 text-conservation-gold" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-off-white">Calculadora de Grupos</h2>
          <p className="text-off-white/60 text-sm">Obtén un presupuesto estimado al instante</p>
        </div>
      </div>

      {success ? (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center"
        >
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Send className="w-8 h-8 text-green-500" />
          </div>
          <h3 className="text-xl font-bold text-off-white mb-2">¡Solicitud Enviada!</h3>
          <p className="text-off-white/70">
            Hemos recibido tus datos y te hemos enviado un correo de confirmación. Nuestro equipo te contactará muy pronto con la cotización formal.
          </p>
          <button 
            onClick={() => setSuccess(false)}
            className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors text-sm font-semibold"
          >
            Hacer otra cotización
          </button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Formulario */}
          <div className="lg:col-span-7 space-y-6">
            <form id="cotizacion-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Paquete */}
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-sm font-medium text-off-white/80">Paquete Educativo</label>
                  <select 
                    {...register('paquete_id')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-off-white focus:outline-none focus:ring-2 focus:ring-conservation-gold/50 appearance-none"
                  >
                    {paquetes.map(p => (
                      <option key={p.id} value={p.id} className="bg-forest-green-dark">{p.nombre}</option>
                    ))}
                  </select>
                  {errors.paquete_id && <p className="text-red-400 text-xs mt-1">{errors.paquete_id.message}</p>}
                </div>

                {/* Personas */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-off-white/80">Número de Personas</label>
                  <input 
                    type="number"
                    min={MIN_PERSONAS}
                    max={MAX_PERSONAS}
                    {...register('personas', { valueAsNumber: true })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-off-white focus:outline-none focus:ring-2 focus:ring-conservation-gold/50"
                  />
                  {errors.personas && <p className="text-red-400 text-xs mt-1">{errors.personas.message}</p>}
                </div>

                {/* Fecha */}
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-off-white/80">Fecha Deseada</label>
                  <input 
                    type="date"
                    min={minDateString}
                    {...register('fecha_deseada')}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-off-white focus:outline-none focus:ring-2 focus:ring-conservation-gold/50 [color-scheme:dark]"
                  />
                  {errors.fecha_deseada && <p className="text-red-400 text-xs mt-1">{errors.fecha_deseada.message}</p>}
                </div>
              </div>

              {/* Opciones Extra */}
              <div className="bg-white/5 border border-white/5 rounded-xl p-4 space-y-3">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" {...register('incluye_lunch')} className="peer sr-only" />
                    <div className="w-5 h-5 border-2 border-white/20 rounded peer-checked:bg-conservation-gold peer-checked:border-conservation-gold transition-colors" />
                    <CheckCircle2 className="absolute w-3.5 h-3.5 text-forest-green-dark opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm text-off-white/80 group-hover:text-off-white transition-colors">
                    Incluir Lunch (${LUNCH_PRICE} MXN por persona)
                  </span>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative flex items-center justify-center">
                    <input type="checkbox" {...register('incluye_transporte')} className="peer sr-only" />
                    <div className="w-5 h-5 border-2 border-white/20 rounded peer-checked:bg-conservation-gold peer-checked:border-conservation-gold transition-colors" />
                    <CheckCircle2 className="absolute w-3.5 h-3.5 text-forest-green-dark opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-sm text-off-white/80 group-hover:text-off-white transition-colors">
                    Deseo cotizar transporte escolar
                  </span>
                </label>
              </div>

              {/* Datos de Contacto */}
              <div className="space-y-4 pt-4 border-t border-white/10">
                <h4 className="text-off-white font-semibold">Datos de Contacto</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5 md:col-span-2">
                    <input 
                      type="text" 
                      placeholder="Nombre de la Institución/Escuela" 
                      {...register('escuela')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-off-white focus:outline-none focus:ring-2 focus:ring-conservation-gold/50"
                    />
                    {errors.escuela && <p className="text-red-400 text-xs mt-1">{errors.escuela.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <input 
                      type="text" 
                      placeholder="Tu Nombre" 
                      {...register('cliente_nombre')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-off-white focus:outline-none focus:ring-2 focus:ring-conservation-gold/50"
                    />
                    {errors.cliente_nombre && <p className="text-red-400 text-xs mt-1">{errors.cliente_nombre.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <input 
                      type="email" 
                      placeholder="Correo Electrónico" 
                      {...register('cliente_email')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-off-white focus:outline-none focus:ring-2 focus:ring-conservation-gold/50"
                    />
                    {errors.cliente_email && <p className="text-red-400 text-xs mt-1">{errors.cliente_email.message}</p>}
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <input 
                      type="tel" 
                      placeholder="Teléfono (Opcional)" 
                      {...register('cliente_telefono')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-off-white focus:outline-none focus:ring-2 focus:ring-conservation-gold/50"
                    />
                  </div>

                  <div className="space-y-1.5 md:col-span-2">
                    <textarea 
                      placeholder="Comentarios o peticiones especiales" 
                      rows={3}
                      {...register('mensaje')}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-off-white focus:outline-none focus:ring-2 focus:ring-conservation-gold/50 resize-none"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-3 cursor-pointer group mt-2">
                  <div className="relative flex items-center justify-center mt-0.5">
                    <input type="checkbox" {...register('acepto_terminos')} className="peer sr-only" />
                    <div className="w-4 h-4 border-2 border-white/20 rounded peer-checked:bg-conservation-gold peer-checked:border-conservation-gold transition-colors" />
                    <CheckCircle2 className="absolute w-3 h-3 text-forest-green-dark opacity-0 peer-checked:opacity-100 transition-opacity" />
                  </div>
                  <span className="text-xs text-off-white/60 group-hover:text-off-white/80 transition-colors">
                    Acepto recibir información sobre este paquete y confirmo que los datos son correctos.
                  </span>
                </label>
                {errors.acepto_terminos && <p className="text-red-400 text-xs mt-1 ml-7">{errors.acepto_terminos.message}</p>}
              </div>

            </form>
          </div>

          {/* Resumen */}
          <div className="lg:col-span-5">
            <div className="sticky top-24 bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-off-white mb-4">Resumen Estimado</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-off-white/70">Paquete ({watchAll.personas || 0} pax)</span>
                  <span className="text-off-white font-semibold">${subtotal.toFixed(2)}</span>
                </div>
                
                {watchAll.incluye_lunch && (
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-off-white/70">Lunch ({watchAll.personas || 0} pax)</span>
                    <span className="text-off-white font-semibold">${lunchTotal.toFixed(2)}</span>
                  </div>
                )}

                {watchAll.incluye_transporte && (
                  <div className="flex justify-between items-center text-sm text-quetzal-blue">
                    <span>Transporte</span>
                    <span>A consultar</span>
                  </div>
                )}
              </div>

              <div className="border-t border-white/10 pt-4 mb-6">
                <div className="flex justify-between items-end">
                  <span className="text-off-white/70">Total Estimado</span>
                  <span className="text-3xl font-bold text-conservation-gold">${total.toFixed(2)}</span>
                </div>
                <p className="text-right text-xs text-off-white/40 mt-1">
                  ${(total / (watchAll.personas || 1)).toFixed(2)} por persona
                </p>
              </div>

              <div className="space-y-3">
                <button 
                  form="cotizacion-form"
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-4 bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark rounded-xl font-bold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-conservation-gold/20"
                >
                  {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  Solicitar cotización formal
                </button>

                <button 
                  type="button"
                  onClick={handleWhatsApp}
                  className="w-full py-3 bg-[#25D366]/10 hover:bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/20 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all"
                >
                  <MessageCircle className="w-5 h-5" />
                  Cotizar por WhatsApp
                </button>
              </div>

              <div className="mt-4 flex items-start gap-2 bg-white/5 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 text-off-white/40 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-off-white/60">
                  Este es un presupuesto estimado. El costo final puede variar dependiendo de necesidades específicas y disponibilidad.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
