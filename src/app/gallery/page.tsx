'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, 
  Maximize2, 
  Camera, 
  Aperture, 
  Clock, 
  Gauge, 
  MapPin, 
  Download,
  Filter,
  ChevronRight,
  ArrowRight
} from 'lucide-react'
import { getPhotos, getCategories, resolveAssetUrl, type PhotoDto } from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSettings } from '@/contexts/SettingsContext'

export default function GalleryPage() {
  const { t } = useLanguage()
  const { settings } = useSettings()
  const [photos, setPhotos] = useState<PhotoDto[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [activeCategory, setActiveCategory] = useState('全部')
  const [selectedPhoto, setSelectedPhoto] = useState<PhotoDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [dominantColors, setDominantColors] = useState<string[]>([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [photosData, categoriesData] = await Promise.all([
          getPhotos(),
          getCategories()
        ])
        setPhotos(photosData)
        setCategories(['全部', ...categoriesData.filter(c => c !== '全部')])
      } catch (error) {
        console.error('Failed to fetch gallery data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredPhotos = useMemo(() => {
    if (activeCategory === '全部') return photos
    return photos.filter(p => p.category.includes(activeCategory))
  }, [photos, activeCategory])

  // Palette extraction for selected photo
  useEffect(() => {
    if (selectedPhoto) {
      const img = new Image()
      img.crossOrigin = "Anonymous"
      img.src = resolveAssetUrl(selectedPhoto.url, settings?.cdn_domain)
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d", { willReadFrequently: true })
        if (!ctx) return
        canvas.width = 40; canvas.height = 40
        ctx.drawImage(img, 0, 0, 40, 40)
        const imageData = ctx.getImageData(0, 0, 40, 40).data
        const colorCounts: Record<string, number> = {}
        for (let i = 0; i < imageData.length; i += 16) {
          const r = Math.round(imageData[i] / 10) * 10
          const g = Math.round(imageData[i+1] / 10) * 10
          const b = Math.round(imageData[i+2] / 10) * 10
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
          colorCounts[hex] = (colorCounts[hex] || 0) + 1
        }
        const sorted = Object.entries(colorCounts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(c => c[0])
        setDominantColors(sorted)
      }
    } else {
      setDominantColors([])
    }
  }, [selectedPhoto, settings?.cdn_domain])

  return (
    <div className="min-h-screen bg-background text-foreground pt-32 pb-24 px-6 md:px-12 lg:px-20">
      {/* Editorial Header */}
      <header className="max-w-[1800px] mx-auto mb-20">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-4">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-3 text-primary"
            >
              <span className="text-[10px] font-black uppercase tracking-[0.4em]">Collection</span>
              <div className="h-[1px] w-12 bg-primary/30" />
            </motion.div>
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-serif font-light tracking-tighter leading-none"
            >
              {activeCategory === '全部' ? t('gallery.title') : activeCategory}
            </motion.h1>
          </div>
          
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col items-start md:items-end gap-4"
          >
            <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-widest">
              {filteredPhotos.length} {t('gallery.count_suffix')}
            </div>
            <div className="flex flex-wrap gap-2 md:justify-end">
              {categories.map((cat, i) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all border ${
                    activeCategory === cat 
                    ? 'bg-primary text-primary-foreground border-primary' 
                    : 'border-border text-muted-foreground hover:border-foreground hover:text-foreground'
                  }`}
                >
                  {cat === '全部' ? t('gallery.all') : cat}
                </button>
              ))}
            </div>
          </motion.div>
        </div>
      </header>

      {/* Photobook Masonry Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="aspect-[3/4] bg-muted animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="max-w-[1800px] mx-auto">
          <motion.div 
            layout
            className="columns-1 md:columns-2 lg:columns-3 gap-12 space-y-12"
          >
            <AnimatePresence mode='popLayout'>
              {filteredPhotos.map((photo, index) => (
                <motion.div
                  key={photo.id}
                  layout
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: index % 3 * 0.1 }}
                  className="break-inside-avoid group cursor-none"
                  onClick={() => setSelectedPhoto(photo)}
                >
                  <div className="relative overflow-hidden bg-muted">
                    <img
                      src={resolveAssetUrl(photo.thumbnailUrl || photo.url, settings?.cdn_domain)}
                      alt={photo.title}
                      className="w-full h-auto object-cover transition-transform duration-[1.5s] ease-out group-hover:scale-105"
                    />
                    
                    {/* Minimalist Overlay */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                      <div className="translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em] mb-2">
                          {photo.category.split(',')[0]}
                        </p>
                        <h3 className="text-2xl font-serif text-white leading-tight mb-4">
                          {photo.title}
                        </h3>
                        <div className="flex items-center gap-2 text-white/60 text-[10px] font-bold uppercase tracking-widest">
                          <span>View Entry</span>
                          <ArrowRight className="w-3 h-3" />
                        </div>
                      </div>
                    </div>

                    {/* Photo Serial Number */}
                    <div className="absolute top-4 left-4 text-[8px] font-mono text-white/30 tracking-tighter opacity-0 group-hover:opacity-100 transition-opacity">
                      NO. {String(index + 1).padStart(3, '0')}
                    </div>
                  </div>
                  
                  {/* Subtle Caption Below */}
                  <div className="mt-4 flex justify-between items-start opacity-40 group-hover:opacity-100 transition-opacity duration-500">
                    <span className="text-[9px] font-mono uppercase tracking-tighter">{photo.cameraModel || 'Recorded Moment'}</span>
                    <span className="text-[9px] font-mono">{new Date(photo.createdAt).getFullYear()}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {filteredPhotos.length === 0 && (
            <div className="py-40 text-center">
              <p className="text-xs font-bold uppercase tracking-[0.3em] text-muted-foreground">
                {t('gallery.empty')}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Immersive Detail Modal */}
      <AnimatePresence>
        {selectedPhoto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/95 backdrop-blur-sm overflow-hidden"
          >
            {/* Close Button */}
            <button 
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-8 right-8 z-[110] p-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="w-8 h-8" />
            </button>

            <div className="w-full h-full flex flex-col lg:flex-row">
              {/* Photo Side */}
              <div className="flex-1 relative flex items-center justify-center p-6 md:p-12 lg:p-20 bg-muted/30">
                <motion.img
                  initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 0.8 }}
                  src={resolveAssetUrl(selectedPhoto.url, settings?.cdn_domain)}
                  alt={selectedPhoto.title}
                  className="max-w-full max-h-full object-contain shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)]"
                />
              </div>

              {/* Info Side (拉页感) */}
              <motion.div 
                initial={{ x: 100, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="w-full lg:w-[450px] bg-background border-l border-border h-full overflow-y-auto custom-scrollbar flex flex-col shadow-2xl"
              >
                <div className="p-10 md:p-16 space-y-16 flex-1">
                  {/* Title Section */}
                  <div className="space-y-6">
                    <div className="flex flex-wrap gap-2">
                      {selectedPhoto.category.split(',').map(cat => (
                        <span key={cat} className="text-[10px] font-black uppercase tracking-[0.2em] text-primary border border-primary/30 px-3 py-1">
                          {cat}
                        </span>
                      ))}
                    </div>
                    <h2 className="text-5xl md:text-6xl font-serif leading-[0.9] tracking-tighter">
                      {selectedPhoto.title}
                    </h2>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-y-10 gap-x-8 border-t border-border pt-10">
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t('gallery.resolution')}</p>
                      <p className="font-mono text-sm">{selectedPhoto.width} × {selectedPhoto.height}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t('gallery.size')}</p>
                      <p className="font-mono text-sm">{formatFileSize(selectedPhoto.size)}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t('gallery.date')}</p>
                      <p className="font-mono text-sm">{new Date(selectedPhoto.createdAt).toLocaleDateString()}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">{t('gallery.palette')}</p>
                      <div className="flex gap-1.5 pt-1">
                        {dominantColors.map((color, i) => (
                          <div key={i} className="w-5 h-5 border border-white/10" style={{ backgroundColor: color }} />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Technical Specs */}
                  {(selectedPhoto.cameraModel || selectedPhoto.aperture) ? (
                    <div className="space-y-10">
                      <div className="space-y-3">
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                          <Camera className="w-3 h-3 text-primary" /> {t('gallery.equipment')}
                        </p>
                        <p className="font-serif text-2xl leading-tight">
                          {selectedPhoto.cameraMake} {selectedPhoto.cameraModel}
                        </p>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-5 border border-border bg-muted/10 space-y-1">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{t('gallery.aperture')}</p>
                          <p className="font-mono text-xl">{selectedPhoto.aperture || '—'}</p>
                        </div>
                        <div className="p-5 border border-border bg-muted/10 space-y-1">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{t('gallery.shutter')}</p>
                          <p className="font-mono text-xl">{selectedPhoto.shutterSpeed || '—'}</p>
                        </div>
                        <div className="p-5 border border-border bg-muted/10 space-y-1">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{t('gallery.iso')}</p>
                          <p className="font-mono text-xl">{selectedPhoto.iso || '—'}</p>
                        </div>
                        <div className="p-5 border border-border bg-muted/10 space-y-1">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{t('gallery.focal')}</p>
                          <p className="font-mono text-xl">{selectedPhoto.focalLength || '—'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-10 border-t border-border border-dashed opacity-30 text-center">
                      <p className="text-[10px] tracking-[0.3em] uppercase">{t('gallery.no_exif')}</p>
                    </div>
                  )}

                  {selectedPhoto.latitude && (
                    <button className="w-full py-4 border border-border hover:border-primary text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center justify-center gap-2">
                      <MapPin className="w-3 h-3" /> Location Tagged
                    </button>
                  )}
                </div>

                {/* Footer Action */}
                <div className="p-10 border-t border-border bg-muted/5">
                  <a 
                    href={resolveAssetUrl(selectedPhoto.url, settings?.cdn_domain)} 
                    target="_blank"
                    className="w-full py-5 bg-foreground text-background text-[10px] font-black uppercase tracking-[0.4em] hover:bg-primary hover:text-primary-foreground transition-all flex items-center justify-center gap-3"
                  >
                    <Download className="w-4 h-4" />
                    {t('gallery.download')}
                  </a>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return 'Unknown'; if (bytes === 0) return '0 Bytes'
  const k = 1024; const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}
