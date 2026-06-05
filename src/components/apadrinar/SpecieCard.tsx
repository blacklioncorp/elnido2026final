'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import type { Species } from '@/lib/species'
import { IUCN_LABELS, IUCN_COLORS } from '@/lib/iucn'
import { formatCurrency } from '@/lib/utils'
import { Heart } from 'lucide-react'

interface SpecieCardProps {
  specie: Species
  index?: number
}

const SpecieCard = ({ specie, index = 0 }: SpecieCardProps) => {
  const iucnColor = IUCN_COLORS[specie.iucnStatus]
  const iucnLabel = IUCN_LABELS[specie.iucnStatus]

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="group bg-forest-green-light/40 backdrop-blur-sm rounded-2xl overflow-hidden border border-white/10 hover:border-conservation-gold/30 transition-all duration-500 hover:shadow-2xl hover:shadow-conservation-gold/5 flex flex-col"
    >
      <div className="relative h-52 overflow-hidden">
        <Image
          src={specie.imageUrl}
          alt={specie.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-700"
        />
        {/* IUCN badge */}
        <div
          className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-white text-xs font-bold shadow-lg"
          style={{ backgroundColor: iucnColor + 'CC' }}
        >
          {specie.iucnStatus} · {iucnLabel}
        </div>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <div className="mb-1">
          <h3 className="text-2xl font-extrabold text-off-white">{specie.name}</h3>
          <p className="text-off-white/40 text-xs italic">{specie.scientificName}</p>
        </div>
        <p className="text-off-white/60 text-sm leading-relaxed mt-3 flex-1">{specie.description}</p>
        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
          <div>
            <p className="text-off-white/40 text-xs">Apadrinamiento desde</p>
            <p className="text-conservation-gold font-extrabold text-lg">{formatCurrency(specie.monthlyAmount)}<span className="text-off-white/40 text-xs font-normal">/mes</span></p>
          </div>
          <Link
            href={`/fauna/${specie.id}`}
            className="flex items-center gap-2 bg-conservation-gold hover:bg-conservation-gold/90 text-forest-green-dark font-bold py-2.5 px-5 rounded-xl transition-all duration-300 hover:scale-105 text-sm"
          >
            <Heart className="h-4 w-4" /> Apadrinar
          </Link>
        </div>
      </div>
    </motion.div>
  )
}

export default SpecieCard
