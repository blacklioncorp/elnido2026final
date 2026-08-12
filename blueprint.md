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

*   **Boletera & POS:** Sistema de venta de boletos, tienda física (POS) y control de cajas.
*   **Donativos y Especies:** Página de donativos genéricos (`/donar`) y donativos por especie (`/donativos`) procesados con Stripe Checkout y guardados en Supabase.
*   **Integración N8N:** Webhook unificado en Stripe que notifica automáticamente a N8N cuando se completa un donativo.
*   **Control de Cupo:** Sistema de límite diario (cupo) para la venta de boletos usando funciones atómicas (RPC) en PostgreSQL.
*   **Asistente WhatsApp:** Widget flotante en la UI para contactar al santuario vía WhatsApp, con número y mensaje configurables.

## Recent Changes

*   Implementada la tabla `donaciones` unificada y la tabla `tarjetas_donacion` para el programa "Guardián".
*   Actualizada la página `/donar` para usar Stripe Checkout unificado (Opción B).
*   Creada la página `/donativos` con UI interactiva usando Framer Motion y Tailwind CSS.
*   Implementado control de cupo diario (`cupo_diario`) y procedimiento almacenado `incrementar_cupo`.
*   Añadida vista de administración (`/admin/configuracion`) para controlar WhatsApp y Webhooks de N8N.
*   Actualizados los reportes de administración para mostrar ingresos por donativos (especie vs. genérico).
*   Corregidos los tipos en `database.types.ts` añadiendo relaciones `Relationships` en `ventas_pos` y `compras` para resolver errores de TS con Supabase.
*   Creado el archivo `N8N_SETUP.md` con la documentación para conectar los flujos de N8N.
