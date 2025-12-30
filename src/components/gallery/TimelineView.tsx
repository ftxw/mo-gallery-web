'use client'

import { useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Calendar } from 'lucide-react'
import { PhotoDto, PublicSettingsDto, resolveAssetUrl } from '@/lib/api'

interface TimelineViewProps {
  photos: PhotoDto[]
  settings: PublicSettingsDto | null
  onPhotoClick: (photo: PhotoDto) => void
}

interface GroupedPhotos {
  [key: string]: PhotoDto[]
}

export function TimelineView({ photos, settings, onPhotoClick }: TimelineViewProps) {
  const groupedPhotos = useMemo(() => {
    const groups: GroupedPhotos = {}

    photos.forEach(photo => {
      const date = new Date(photo.createdAt)
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!groups[key]) {
        groups[key] = []
      }
      groups[key].push(photo)
    })

    return Object.entries(groups)
      .sort(([a], [b]) => b.localeCompare(a))
      .map(([key, items]) => ({
        key,
        year: key.split('-')[0],
        month: key.split('-')[1],
        photos: items
      }))
  }, [photos])

  const formatMonth = (month: string) => {
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
    return months[parseInt(month) - 1] || month
  }

  return (
    <div className="relative">
      {/* Timeline Line - Left side */}
      <div className="absolute left-4 md:left-8 top-0 bottom-0 w-px bg-border" />

      <AnimatePresence mode="popLayout">
        {groupedPhotos.map((group, groupIndex) => (
          <motion.div
            key={group.key}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: groupIndex * 0.1 }}
            className="relative mb-12 md:mb-16"
          >
            {/* Timeline Node */}
            <div className="absolute left-4 md:left-8 -translate-x-1/2 w-3 h-3 bg-primary border-4 border-background z-10" />

            {/* Date Header */}
            <div className="ml-10 md:ml-16 mb-6">
              <div className="inline-flex items-center gap-3 border border-border px-4 py-2 bg-background">
                <Calendar className="w-4 h-4 text-primary" />
                <span className="text-xs font-black uppercase tracking-[0.3em]">
                  {formatMonth(group.month)} {group.year}
                </span>
              </div>
            </div>

            {/* Photos Grid - Full width */}
            <div className="ml-10 md:ml-16">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                {group.photos.map((photo, index) => (
                  <motion.div
                    key={photo.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    className="group relative aspect-square cursor-pointer overflow-hidden bg-muted"
                    onClick={() => onPhotoClick(photo)}
                  >
                    <img
                      src={resolveAssetUrl(photo.thumbnailUrl || photo.url, settings?.cdn_domain)}
                      alt={photo.title}
                      className="w-full h-full object-cover transition-all duration-500 ease-out group-hover:scale-105 grayscale group-hover:grayscale-0"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                      <p className="text-[8px] font-black text-primary uppercase tracking-[0.2em] mb-0.5">
                        {photo.category.split(',')[0]}
                      </p>
                      <h3 className="text-xs font-serif text-white leading-tight line-clamp-1">
                        {photo.title}
                      </h3>
                    </div>

                    {/* Date Badge */}
                    <div className="absolute top-2 right-2 text-[8px] font-mono text-white/50 bg-black/30 px-1.5 py-0.5">
                      {new Date(photo.createdAt).getDate()}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
