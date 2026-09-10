import { Metadata } from 'next'
import Image from 'next/image'

export const metadata: Metadata = {
  title: 'Política de Privacidad | El Nido',
  description: 'Conoce nuestra política de privacidad y cómo protegemos tus datos.',
}

export default function PoliticaDePrivacidadPage() {
  const heroImage = "/images/plumas-1Guacamaya.svg"

  return (
    <div className="min-h-screen bg-forest-green-dark">
      {/* Hero Section */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 z-0 opacity-20">
          <Image 
            src={heroImage} 
            alt="Fondo Plumas" 
            fill
            className="object-cover object-top"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-forest-green-dark/50 via-forest-green-dark/80 to-forest-green-dark" />
        </div>

        <div className="container mx-auto px-4 relative z-10 text-center">
          <span className="inline-block px-4 py-1.5 rounded-full border border-conservation-gold/30 text-conservation-gold font-bold tracking-wider text-xs uppercase bg-conservation-gold/5 backdrop-blur-md mb-6">
            Documento Legal
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-off-white leading-tight mb-4">
            Política de Privacidad
          </h1>
          <p className="text-off-white/60">Última actualización: Agosto 2026</p>
        </div>
      </section>

      {/* Content Section */}
      <section className="pb-24 relative z-10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto bg-forest-green-light/20 backdrop-blur-md border border-white/5 rounded-3xl p-8 md:p-12 shadow-2xl text-off-white/80 space-y-8">
            
            <div className="space-y-6">
              <p className="leading-relaxed">
                VIDA SILVESTRE JESÚS ESTUDILLO LÓPEZ A.C. (“EL NIDO”), con domicilio en Avenida Acozac esquina Progreso s/n Col. Santa Bárbara Municipio de Ixtapaluca, C.P. 56530, Estado de México, es responsable de recabar sus datos personales, del uso que se le dé a los mismos y de su protección. De conformidad con lo dispuesto en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, EL NIDO cuenta con todas las medidas de seguridad físicas, técnicas y administrativas adecuadas para proteger sus datos personales. Bajo ninguna circunstancia comercializaremos sus datos personales sin su consentimiento previo y por escrito.
              </p>
              
              <p className="leading-relaxed">
                Su información personal será utilizada de la forma señalada en la Ley Federal de Datos Personales en Posesión de los Particulares y su Reglamento. Específicamente, en el caso de clientes y socios de negocios, su información personal será utilizada proveer servicios de entretenimiento, restaurante y espectáculos en el Aviario El Nido; comercializar productos relacionados con las actividades del Aviario; establecer contacto telefónico y/o enviar información por medios electrónicos acerca de promociones, actividades, eventos e información en general sobre el parque o cualquier actividad análoga a las anteriores; en el caso de proveedores, su información personal será utilizada para obtener cotizaciones, enviar pedidos, efectuar pagos, responder sobre ofertas, así como para la contratación de servicios y productos relacionados con las actividades de EL NIDO, o cualquier actividad análoga a las anteriores y, en el caso de los empleados su información personal será utilizada con fines de selección y contratación de personal, o cualquier actividad análoga a las anteriores.
              </p>

              <p className="leading-relaxed">
                Asimismo, al proporcionar sus datos, Usted autoriza a EL NIDO, su utilización con fines mercadotécnicos, estadísticos, promocionales, publicitarios, informativos o de prospección comercial respecto a las actividades de EL NIDO, sus filiales, subsidiarias y/o socios de negocios u otras actividades relacionadas con la promoción de productos y servicios que dichas entidades comercializan. Para las finalidades antes mencionadas, requerimos obtener datos personales tales como nombre, edad, dirección de correo electrónico, número telefónico, domicilio, antecedentes laborales, referencias personales y laborales.
              </p>

              <p className="leading-relaxed">
                En caso que alguno de los datos proporcionados llegase a ser considerado como sensible bajo la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, dichos datos recibirán el tratamiento que les corresponda bajo dicha Ley.
              </p>

              <p className="leading-relaxed">
                Usted tiene derecho de acceder, rectificar y cancelar sus datos personales, así como de oponerse al tratamiento de los mismos o revocar el consentimiento que para tal fin nos haya otorgado, mediante comunicación escrita, señalando el nombre del titular y domicilio u otro medio para comunicarle la respuesta a su solicitud, documentación que acredite su identidad o en su caso la representación legal del titular de los datos, la descripción clara y precisa de los datos personales respecto de los que se busca ejercer alguno de los derechos antes mencionados, los elementos y/o documentos que faciliten la localización de los datos personales, y los requisitos previstos para el ejercicio de los derechos ARCO en la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y su Reglamento. La comunicación deberá estar dirigida al Departamento de Datos Personales de EL NIDO y podrá entregarse en el domicilio de EL NIDO antes indicado o enviarse al siguiente correo electrónico: <a href="mailto:info@elnido.mx" className="text-conservation-gold hover:underline">info@elnido.mx</a>; Asimismo, le informamos que EL NIDO no transfiere sus datos a terceros en forma alguna. Lo anterior, sin perjuicio de las remisiones de datos que EL NIDO hace a sus encargados que le apoyan en cuestiones de manejo y almacenamiento de bases de datos, registro estadístico, recursos humanos, ventas, distribución, administración y contabilidad de la empresa, servicios de mercadotecnia digital, envío de información, avisos y promociones así como entrega de producto o prestación de algún servicio.
              </p>

              <p className="leading-relaxed">
                Si usted desea dejar de recibir mensajes promocionales de nuestra parte puede solicitarlo a través del Departamento de Datos Personales al correo electrónico: <a href="mailto:info@elnido.mx" className="text-conservation-gold hover:underline">info@elnido.mx</a>. Cualquier modificación a este aviso de privacidad será debidamente informada por EL NIDO a través de su sitio web <a href="https://www.elnido.mx" className="text-conservation-gold hover:underline" target="_blank" rel="noopener noreferrer">www.elnido.mx</a>, por lo que podrá consultarla en el mismo.
              </p>
            </div>

          </div>
        </div>
      </section>
    </div>
  )
}
