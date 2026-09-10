# Guía de Configuración N8N - El Nido Santuario

El Nido utiliza [n8n](https://n8n.io/) para automatizar procesos en respuesta a los donativos y otros eventos del sistema. 

## 1. Concepto de la Integración

1. Cuando se completa una compra o donación, Stripe envía un evento Webhook a nuestro backend en Next.js (`src/app/api/webhooks/stripe/route.ts`).
2. El backend procesa el pago, lo registra en Supabase y luego verifica si existe una URL de Webhook de n8n configurada en la tabla `configuracion`.
3. Si existe, el backend hace una petición POST a la URL de n8n enviando la información del donativo.
4. N8N recibe el payload y desencadena un flujo (ej. enviar mensaje de WhatsApp al staff, enviar email personalizado al donante, registrar en Google Sheets, etc).

## 2. Configurar la URL de n8n

1. Accede al panel de administración de El Nido: `/admin/configuracion`
2. Localiza la sección **N8N Webhook**
3. Introduce la **URL de Producción** (Production URL) del nodo "Webhook" de n8n. Ejemplo:
   `https://tu-instancia.n8n.cloud/webhook/donativos-elnido`
4. Haz clic en "Guardar".

## 3. Ejemplo del Payload (JSON)

El backend enviará un POST a n8n con la siguiente estructura de datos. Puedes usar este JSON de ejemplo para configurar los nodos posteriores en n8n:

```json
{
  "evento": "donacion_completada",
  "origen": "donativos", // O "donar" si fue de la página genérica
  "donante_nombre": "Juan Pérez",
  "donante_email": "juan@ejemplo.com",
  "donante_username": "QuetzalFan",
  "monto": 500,
  "mensaje": "¡Sigan con el gran trabajo!",
  "especie": "Quetzal", // Omitido si la donación es genérica
  "fecha": "2026-07-21T00:00:00Z"
}
```

## 4. Crear el Flujo en n8n (Paso a Paso)

1. En tu instancia de n8n, crea un **Nuevo Workflow**.
2. Añade un nodo **Webhook**.
   - En *Authentication*, selecciona "None" (o configura headers personalizados en el código si necesitas mayor seguridad).
   - En *HTTP Method*, selecciona **POST**.
   - En *Path*, escribe un identificador, por ejemplo `donativos-elnido`.
   - **IMPORTANTE:** Copia la "Production URL". Esta es la que guardarás en el admin de El Nido.
3. Haz clic en "Listen for Test Event" en el nodo Webhook.
4. Para probarlo, haz una donación de prueba en El Nido, o envía el JSON del Paso 3 usando Postman/cURL a la "Test URL" de n8n.
5. Una vez que n8n reciba los datos, añade nodos posteriores. Por ejemplo:
   - **Nodo Switch**: Para separar la lógica si `origen` es `donativos` (especie) o `donar` (genérico).
   - **Nodo WhatsApp / Twilio**: Para notificar a los administradores.
   - **Nodo Gmail / SMTP**: Para enviar un certificado o mensaje adicional al donante.
   - **Nodo Google Sheets**: Para mantener un registro secundario.
6. Cuando termines el flujo, activa el switch en la esquina superior derecha de n8n a **Active**.

## 5. Extender la Integración

Si deseas enviar más datos a n8n en el futuro, puedes modificar la función `notificarN8N` o similar en el webhook de Stripe (`src/app/api/webhooks/stripe/route.ts`), añadiendo las nuevas variables al cuerpo (body) de la petición POST que va hacia n8n.
