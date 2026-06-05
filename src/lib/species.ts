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
    name: 'Quetzal',
    scientificName: 'Pharomachrus mocinno',
    imageUrl: '/images/quetzal.png',
    description: 'El quetzal, conocido por su plumaje vibrante, es un ave icónica de los bosques nubosos de Mesoamérica.',
    iucnStatus: 'NT',
    habitat: 'Bosques nubosos de Chiapas y Guatemala',
    monthlyAmount: 50,
  },
  {
    id: 'axolotl',
    name: 'Axolotl',
    scientificName: 'Ambystoma mexicanum',
    imageUrl: '/images/axolotl.png',
    description: 'El ajolote, un anfibio único de México con la capacidad de regenerar extremidades, se encuentra en peligro crítico de extinción.',
    iucnStatus: 'CR',
    habitat: 'Canales de Xochimilco, Ciudad de México',
    monthlyAmount: 25,
  },
  {
    id: 'jaguar',
    name: 'Jaguar',
    scientificName: 'Panthera onca',
    imageUrl: '/images/jaguar.png',
    description: 'El jaguar, el felino más grande de América, es un depredador clave para mantener el equilibrio de los ecosistemas.',
    iucnStatus: 'VU',
    habitat: 'Selvas tropicales del sur de México',
    monthlyAmount: 100,
  },
]
