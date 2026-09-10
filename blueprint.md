# El Nido - Santuario de Vida Silvestre

## Overview

El Nido is a web application for a fictional wildlife sanctuary in Mexico. The application is designed to be a beautiful and engaging experience for visitors, providing information about the sanctuary, its animals, and its conservation efforts.

## Design and Features

### Visual Design

*   **Color Palette:** The color palette is inspired by the natural beauty of Mexico. The primary colors are a deep forest green, a vibrant quetzal blue, and a warm conservation gold.
*   **Typography:** The typography is clean and modern, with a focus on readability. The headings are set in a bold, sans-serif font, while the body text is set in a more traditional serif font.
*   **Iconography:** The iconography is simple and elegant, with a focus on a cohesive look and feel.

### Features

*   **Home Page:** The home page is a visually stunning introduction to the sanctuary, with a hero section, a features section, and a call to action.
*   **Santuario Page:** The santuario page provides more information about the sanctuary, including its history, mission, and team.
*   **Blog:** The blog is a place for the sanctuary to share news, stories, and updates with its visitors.
*   **Contact Page:** The contact page provides a simple way for visitors to get in touch with the sanctuary.

*   **Boletera & POS:** Sistema de venta de boletos, tienda física (POS) y control de cajas. Botón y acceso directo a `/boletos` activo en el Header principal de navegación pública.
*   **Módulo de Administración de Boletos (`/admin/boletos`):** Panel administrativo completo para gestión de boletos con cinco secciones principales:
    *   *Tipos de Entrada:* Catálogo de admisiones regulares y paquetes familiares con CRUD reactivo (React Hook Form + Zod), cálculo de precios, conmutador de estado activo/inactivo y borrado inteligente con protección de historial contable.
    *   *Membresías Guardián:* CRUD completo de membresías (`categoria = 'membresia'`) permitiendo crear infinitos planes Guardián con precio anual fijo (sin donativo libre), validez en días, accesos incluidos, saldo para consumo y porcentaje de descuento en talleres y eventos. Conmutadores reactivos para activar/desactivar venta y destacar membresía con la insignia "Más Popular" (`es_popular`).
    *   *Días de Venta de Boletos:* Configuración de días de la semana permitidos para venta de admisiones en el santuario (0=domingo a 6=sábado). Toggles conmutables por día con persistencia inmediata en la tabla `dias_venta`.
    *   *Eventos Especiales:* Gestión de eventos temáticos, nocturnos y talleres con configuración de fecha, hora, cupo máximo y tarifas por boleto.
    *   *Registro de Ventas:* Monitor de transacciones y compras de boletos en tiempo real con KPIs de recaudación, desglose de items y clientes, filtros por estado y texto, y paginación con controles numéricos.
*   **Restricción de Días de Venta en Boletera Pública (`/boletos`):**
    *   Validación reactiva en el selector de fecha (`EntradaSelector.tsx`): si el usuario selecciona una fecha cuyo día de la semana está deshabilitado, se bloquea la selección, se muestra alerta visual y se notifica vía `toast`.
    *   Visualización de días de la semana habilitados vs deshabilitados con formato tachado (`line-through`) y gris.
    *   Mensaje informativo dinámico bajo el selector (ej. "Venta disponible: lunes, jueves, viernes, sábado y domingo").
    *   Validación autoritativa en el backend (`createCheckoutSession`) que rechaza fechas restringidas.
*   **Pestaña de Membresías en Boletera Pública (`/boletos`):** Visualización de las membresías creadas en el catálogo con badge de "Más Popular" según el campo `es_popular`, desglose dinámico de beneficios (accesos, saldo para consumo y descuento) y botón para agregar al carrito de compra.
*   **Donativos y Especies:** Página de donativos genéricos (`/donar`) y donativos por especie (`/donativos`) procesados con Stripe Checkout y guardados en Supabase.
*   **Integración N8N:** Webhook unificado en Stripe que notifica automáticamente a N8N cuando se completa un donativo.
*   **Control de Cupo:** Sistema de límite diario (cupo) para la venta de boletos usando funciones atómicas (RPC) en PostgreSQL.
*   **Asistente WhatsApp:** Widget flotante en la UI para contactar al santuario vía WhatsApp, con número y mensaje configurables.

*   **Paquetes Educativos y Grupos Escolares:** Página pública de cotización `/grupos` con catálogo filtrable y calculadora interactiva. Panel de administración en `/admin/grupos` con CRUD completo para crear, editar, eliminar y activar/desactivar paquetes pedagógicos, gestión de imágenes, actividades e itinerarios, y gestión de cotizaciones escolares con visor de detalle.

*   **Migración de Assets Estáticos a `/public`:** Se migraron todos los assets de diseño, UI, fotos fijas del fundador (`/fundador/`), fotos del carrusel hero (`/hero/`), logos, plumas e iconos (`/images/`), audio ambiental (`/audio/audio_comprimido.mp3`) y videos (`/video/video1_comprimido.webm` y `/video/video2_comprimido.webm`) a rutas locales optimizadas servidas vía CDN local para reducir a cero el consumo de Egress en Supabase Storage.
*   **Programa "Del Nido al Vuelo":** Se actualizó el nombre del programa (anteriormente "Apadrina a un Amigo") a "Del Nido al Vuelo", con mensaje emotivo enfocado en la rehabilitación y reinserción de las especies en su hábitat natural.
*   **Video Testimonial y Audio Ambiental:** Actualizado el video a `Del_nido_al_vuelo.MP4` con subtítulo emotivo configurable y el reproductor de "Sonidos del Santuario" a `mezcla_aves_natural_40s.mp3` tanto en código como en la base de datos Supabase.
*   **Dashboard de Padrinos (`/guardian`):** Implementado el panel de control completo con KPIs de impacto (especies apadrinadas, aportado total, semanas activo, vidas impactadas), mapa satelital multi-especie Mapbox, gestión de suscripciones (pausar, reanudar, cancelar), feed de bitácoras y noticias, y preventa de eventos.
*   Implementado CRUD completo de **Paquetes Educativos** en `/admin/grupos` con Server Actions (`createPaquete`, `updatePaquete`, `deletePaquete`, `togglePaqueteActivo`, `uploadPaqueteImagen`).
*   Añadido panel lateral (Drawer) interactivo con gestión de información pedagógica, actividades e itinerarios dinámicos y subida de imágenes optimizadas hasta 10MB.
*   Añadido modal de detalle para cotizaciones recibidas con enlace directo para responder por correo o contactar por WhatsApp.
*   Implementada la tabla `donaciones` unificada y la tabla `tarjetas_donacion` para el programa "Guardián".
*   Actualizada la página `/donar` para usar Stripe Checkout unificado (Opción B).
*   Creada la página `/donativos` con UI interactiva usando Framer Motion y Tailwind CSS.
*   Implementado control de cupo diario (`cupo_diario`) y procedimiento almacenado `incrementar_cupo`.
*   Añadida vista de administración (`/admin/configuracion`) para controlar WhatsApp y Webhooks de N8N.
*   Actualizados los reportes de administración para mostrar ingresos por donativos (especie vs. genérico).
*   **Generador de Códigos de Descuento por Lote y Limitador de Compras:**
    *   *Administración (`/admin/boletos` pestaña "Códigos de Descuento"):* Generación masiva de cupones de un solo uso con prefijo personalizado, longitud aleatoria configurable, porcentaje de descuento y categorías aplicables.
    *   *Límites de Uso:* Configuración de **Máximo de items con descuento por compra** (`max_items_por_compra`, por defecto 4) y **Monto máximo de descuento** (`max_descuento_monto`, tope en $ MXN opcional).
*   **Módulo de Administración de Apadrinamientos (`/admin/apadrinamientos`):**
    *   *KPIs en Tiempo Real:* Monitoreo global del programa "Del Nido al Vuelo" con Total Recaudado por Apadrinamientos, Guardianes Activos Mensuales, Desglose Recurrentes vs. Únicos y Total de Padrinos Registrados.
    *   *Buscador y Filtros:* Búsqueda en tiempo real por nombre, correo, username o especie apadrinada; filtros reactivos por estado (`Todas`, `Activas`, `Pausadas`, `Canceladas`, `Únicas`) y por especie específica.
    *   *Tabla de Padrinos y Donantes:* Desglose detallado con fecha, datos del padrino, especie apadrinada con miniatura, tipo de aportación (Mensual vs. Única), monto aportado, estado de suscripción en Stripe y dedicatoria o mensaje.
    *   *Paginación Estandarizada:* Paginación client-side de 15 registros por página idéntica al diseño del módulo de Ventas y Reportes.
    *   *Modal de Detalle y Soporte del Guardián:* Modal emergente con información de suscripción en Stripe (`sub_...`), historial de aportaciones, mensaje del donante y botones de gestión administrativa (pausar, reanudar o cancelar suscripción) con notificaciones toast.

*   **Dashboard de Administración Principal (`/admin`):**
    *   *KPIs en Tiempo Real:* Conexión directa a Supabase para mostrar métricas reales en vivo:
        *   **Especies Registradas:** Conteo dinámico de fauna / tarjetas de donación activas en el santuario.
        *   **Guardianes Activos:** Total de donantes con suscripción activa o aportaciones recurrentes.
        *   **Apadrinamientos:** Total de donaciones por especie registradas.
        *   **Recaudado (MXN):** Suma global consolidada de ventas de boletos online (`compras`), donaciones y apadrinamientos (`donaciones`) y ventas en punto de venta (`ventas_pos`).
    *   *Feed de Actividad Reciente:* Monitoreo unificado de las últimas transacciones en tiempo real combinando compras de boletos, donaciones por especie y donaciones generales con nombres de clientes, desglose de ítems, montos e indicador de tiempo transcurrido.
*   **Módulo de Reportes y Analítica (`/admin/reportes`):**
    *   *Desglose con Descuentos Reales:* Integración precisa del monto final pagado (`compras.total`) para ventas online en lugar del precio de lista sin descuento.
    *   *Columnas Detalladas:* Visualización clara de **Subtotal** (precio original), **Descuento** (monto monetario ahorrado con badge de cupón/porcentaje) y **Total** (monto neto ingresado).
    *   *Exportación CSV:* Inclusión de subtotal, descuento, total y código de descuento utilizado en los reportes exportables.
    *   *Consistencia Total:* Alineación de cifras entre el módulo de reportes generales y la pestaña de Ventas en `/admin/boletos`.
    *   *Paginación Idéntica a Ventas:* Paginación client-side de 15 filas por página con selector numérico, flechas y contador de registros.
*   **Protección Anti-Bot y Anti-Spam (Cloudflare Turnstile):**
    *   Integración de `@marsidev/react-turnstile` mediante el componente reutilizable `TurnstileCaptcha.tsx` en formularios públicos (`FormularioDonacion.tsx`, `CalculadoraCotizacion.tsx`, `ContactoPage` y `DonarPage`).
    *   Modo tolerante de desarrollo/placeholder: cuando las claves son `'pendiente_cloudflare'`, simula verificación inmediata para no bloquear el flujo ni deshabilitar botones en pruebas locales.
    *   Validación robusta en el backend (`verifyTurnstile` en `src/lib/turnstile.ts`) en las Server Actions correspondientes (`createDonacionCheckout`, `createDonacionGenericaCheckout`, `enviarCotizacion`, `enviarMensajeContacto`) consultando el endpoint oficial `https://challenges.cloudflare.com/turnstile/v0/siteverify` una vez configuradas las credenciales de producción.
*   Corregidos los tipos en `database.types.ts` añadiendo relaciones `Relationships` en `ventas_pos` y `compras` para resolver errores de TS con Supabase.
*   Creado el archivo `N8N_SETUP.md` con la documentación para conectar los flujos de N8N.
*   **Sección "Visítanos" con Mapa Interactivo y Botones de Transporte:**
    *   *Componente Mapa (`/src/components/ubicacion/MapaVisitanos.tsx`):* Integración con Mapbox GL (`mapbox://styles/mapbox/outdoors-v12`) centrada en las coordenadas exactas de El Nido Aviario (`[19.3176683, -98.8917283]`, zoom 14), con marcador interactivo circular dorado de guacamaya (`🦜`) y popup informativo con dirección.
    *   *Botones de Transporte (`/src/components/ubicacion/BotonesTransporte.tsx`):* Grid responsive (1 columna en móvil / 3 columnas en escritorio) con logos oficiales vectoriales SVG de Google Maps, Waze y Uber enlazando directamente a las rutas de navegación con coordenadas fijas.
    *   *Sección Principal (`/src/components/ubicacion/Visitanos.tsx`):* Módulo unificado con diseño visual premium, icono `MapPin`, dirección exacta y subtítulos.
    *   *Integración en `/contacto`:* Añadida la sección completa de visita inmediatamente después del formulario de contacto.
    *   *Mini-banner en Footer (`Footer.tsx`):* Banner destacado "📍 Visítanos en Ixtapaluca" con botón directo a `/contacto`.
    *   *Banner en Confirmación de Boleto (`/boletos/confirmacion`):* Banner de recordatorio con dirección de canje del QR y botón "📍 Cómo llegar" hacia `/contacto`.
*   **Optimizador y Pre-Compresión de Imágenes en Cliente (`/src/lib/client-image-compression.ts`):**
    *   Módulo de compresión y reescalado de imágenes del lado del navegador (HTML5 Canvas + WebP) previo al envío de formularios administrativos (`FaunaAdminClient`, `BlogAdminClient`, `BitacoraAdminClient`, `GruposAdminClient` y `DonativosAdminClient`).
    *   Elimina por completo el error `HTTP 413 (Payload Too Large)` en Vercel (que impone un límite de 4.5 MB en Serverless Functions) al reducir fotos pesadas de cámaras de celular (5 MB a 15 MB) a archivos ligeros de ~150 KB en menos de 100ms sin pérdida perceptible de calidad visual.
