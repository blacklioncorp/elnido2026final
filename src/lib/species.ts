import type { IUCNCategory } from './iucn'

export interface Species {
  id: string
  name: string
  scientificName: string
  imageUrl: string
  description: string
  iucnStatus: IUCNCategory
  habitat: string
  monthlyAmount: number
}

export const species: Species[] = [
  {
    id: 'quetzal',
    name: 'Quetzal "Chucho"',
    scientificName: 'Pharomachrus mocinno',
    imageUrl: 'https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/especies/Quetzal-Chucho.svg',
    description: 'El quetzal "Chucho", conocido por su plumaje vibrante, es un ave icónica de los bosques nubosos de Mesoamérica.',
    iucnStatus: 'NT',
    habitat: 'Bosques nubosos de Chiapas y Guatemala',
    monthlyAmount: 50,
  },
  {
    id: 'aguila-real',
    name: 'Águila Real',
    scientificName: 'Aquila chrysaetos',
    imageUrl: 'https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/especies/aguila-real-4.webp',
    description: 'El águila real es una de las aves de presa más conocidas y ampliamente distribuidas de la Tierra, símbolo de majestuosidad.',
    iucnStatus: 'LC',
    habitat: 'América del Norte, Europa, Asia y el norte de África.',
    monthlyAmount: 50,
  },
  {
    id: 'jaguar',
    name: 'Jaguar "Samba"',
    scientificName: 'Panthera onca',
    imageUrl: 'https://gbvlbavpyzbcmnxpdaxg.supabase.co/storage/v1/object/public/especies/Jaguar-(Samba).svg',
    description: 'El jaguar "Samba", el felino más grande de América, es un depredador clave para mantener el equilibrio de los ecosistemas.',
    iucnStatus: 'VU',
    habitat: 'Selvas tropicales del sur de México',
    monthlyAmount: 100,
  },
]
