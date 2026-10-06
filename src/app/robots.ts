import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://www.elnido.mx'
  
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/guardian',
          '/mis-donaciones',
          '/cancelar-donacion',
          '/boletos/confirmacion',
          '/donativos/gracias',
          '/donar/gracias',
          '/reservaciones',
          '/cialis-2.5-mg-daily-review',
          '/combantrin-o-vermox',
          '/wp-content/',
          '/wp-admin/',
          '/wp-includes/',
          '/feed',
        ],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  }
}
