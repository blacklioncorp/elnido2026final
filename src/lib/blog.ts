export interface BlogPost {
  slug: string
  title: string
  excerpt: string
  content: string
  author: string
  date: string
  imageUrl: string
  category: string
  readTime: number
}

export const blogPosts: BlogPost[] = [
  {
    slug: 'quetzal-temporada-anidacion-2025',
    title: 'El Quetzal: Temporada de Anidación 2025',
    excerpt: 'Descubre los avances en la reproducción del quetzal en nuestro santuario durante esta emocionante temporada de primavera.',
    content: `Este año hemos registrado un hito histórico: seis parejas de quetzales han iniciado su ciclo de anidación en las instalaciones de El Nido. El esfuerzo de nuestro equipo de biólogos durante los últimos tres años finalmente está dando frutos.\n\nLa temperatura controlada de los bosques artificiales que hemos construido, combinada con la dieta rica en frutas del género Lauraceae, ha sido clave para el éxito reproductivo. Esperamos que esta temporada nos brinde al menos cuatro polluelos que formarán parte del programa de reintroducción.\n\nEl monitoreo se realiza con cámaras de visión nocturna de última generación que nos permiten observar sin interferir en el comportamiento natural de las aves.`,
    author: 'Dra. Valentina Mora',
    date: '2025-03-15',
    imageUrl: 'https://images.unsplash.com/photo-1555169062-013468b47731?q=80&w=1974&auto=format&fit=crop',
    category: 'Conservación',
    readTime: 5,
  },
  {
    slug: 'axolotl-programa-reproduccion',
    title: 'Programa de Reproducción del Axolotl: Resultados 2024',
    excerpt: 'Nuestro programa de reproducción en cautiverio del ajolote superó todas las expectativas con 200 crías sanas.',
    content: `El ajolote mexicano continúa siendo una de las especies más emblemáticas y amenazadas de nuestro país. En El Nido hemos desarrollado un protocolo de reproducción en cautiverio que ha demostrado ser altamente efectivo.\n\nDurante 2024, logramos reproducir exitosamente 200 ejemplares en nuestras instalaciones especializadas. Cada crío es monitoreado individualmente desde el momento del desove hasta que alcanza los 8 centímetros, momento en que se evalúa su viabilidad para el programa de reintroducción en los canales de Xochimilco.\n\nLa calidad del agua es fundamental: mantenemos parámetros estrictos de temperatura (14-18°C), pH neutro y niveles de amoniaco cercanos a cero.`,
    author: 'Biol. Ernesto Villanueva',
    date: '2025-02-28',
    imageUrl: 'https://images.unsplash.com/photo-1543852786-1cf6624b9378?q=80&w=1974&auto=format&fit=crop',
    category: 'Investigación',
    readTime: 7,
  },
  {
    slug: 'jaguar-corredor-biologico',
    title: 'El Corredor Biológico del Jaguar: Una Esperanza',
    excerpt: 'Colaboramos con cuatro organizaciones para crear un corredor biológico que conecta hábitats fragmentados del jaguar en el sur de México.',
    content: `La fragmentación del hábitat es uno de los mayores desafíos para la supervivencia del jaguar en México. Hoy anunciamos nuestra participación en el Corredor Biológico Selva Maya-Zoque, un proyecto que busca reconectar los parches de selva entre Chiapas, Tabasco y el norte de Guatemala.\n\nJunto con tres organizaciones aliadas y el apoyo de CONANP, hemos identificado 12 puntos críticos de cruce donde los jaguares intentan desplazarse entre fragmentos de hábitat. En estos puntos instalamos túneles de fauna y cercas vivas que guían a los animales de manera segura.\n\nLas cámaras trampa han registrado ya el uso de dos de estos corredores por parte de al menos tres individuos distintos, incluyendo una hembra con dos cachorros.`,
    author: 'M.C. Rodrigo Altamirano',
    date: '2025-01-20',
    imageUrl: 'https://images.unsplash.com/photo-1582218409332-d85262589495?q=80&w=1974&auto=format&fit=crop',
    category: 'Noticias',
    readTime: 6,
  },
  {
    slug: 'voluntarios-programa-guardias',
    title: 'Únete al Programa de Voluntarios Guardianes 2025',
    excerpt: 'Convocatoria abierta para el programa de voluntariado que te permite participar activamente en la conservación de fauna mexicana.',
    content: `Cada año abrimos las puertas del santuario a personas comprometidas con la conservación. El Programa de Voluntarios Guardianes ofrece la posibilidad de trabajar codo a codo con nuestro equipo científico durante estancias de 2 a 8 semanas.\n\nLas actividades incluyen monitoreo de fauna, mantenimiento de hábitats, educación ambiental con grupos escolares y apoyo en investigación de campo. No se requiere formación científica previa, solo compromiso, respeto por la naturaleza y muchas ganas de aprender.\n\nEsta convocatoria tiene 15 lugares disponibles. Los participantes seleccionados recibirán alojamiento en las instalaciones del santuario y capacitación por parte de nuestros especialistas.`,
    author: 'Equipo El Nido',
    date: '2025-01-05',
    imageUrl: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?q=80&w=1974&auto=format&fit=crop',
    category: 'Comunidad',
    readTime: 4,
  },
]
