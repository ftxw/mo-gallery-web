'use client'

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X,
  Camera,
  Aperture,
  Timer,
  Gauge,
  MapPin,
  Download,
  Info,
  Star,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from 'lucide-react'
import { PhotoDto, resolveAssetUrl } from '@/lib/api'
import { useSettings } from '@/contexts/SettingsContext'
import { useLanguage } from '@/contexts/LanguageContext'
import { useAuth } from '@/contexts/AuthContext'
import { formatFileSize } from '@/lib/utils'
import { Toast, type Notification } from '@/components/Toast'
import { StoryTab } from '@/components/StoryTab'

type TabType = 'story' | 'info'

interface PhotoDetailModalProps {
  photo: PhotoDto | null
  isOpen: boolean
  onClose: () => void
  onPhotoChange?: (photo: PhotoDto) => void
  allPhotos?: PhotoDto[]
  totalPhotos?: number // Total count of all photos (for display)
  hasMore?: boolean // Whether there are more photos to load
  onLoadMore?: () => Promise<void> // Callback to load more photos
}

export function PhotoDetailModal({
  photo,
  isOpen,
  onClose,
  onPhotoChange,
  allPhotos = [],
  totalPhotos,
  hasMore = false,
  onLoadMore,
}: PhotoDetailModalProps) {
  const { settings } = useSettings()
  const { t, locale } = useLanguage()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('story')
  const [dominantColors, setDominantColors] = useState<string[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const pendingNextRef = useRef(false)
  const prevPhotosLengthRef = useRef(allPhotos.length)
  
  const currentPhotoIndex = photo && allPhotos.length > 0
    ? allPhotos.findIndex(p => p.id === photo.id)
    : -1
  const hasPrevious = currentPhotoIndex > 0
  // Can go next if there are more loaded photos OR if there are more to load
  const hasNextLoaded = currentPhotoIndex >= 0 && currentPhotoIndex < allPhotos.length - 1
  const canLoadMore = hasMore && onLoadMore
  const hasNext = hasNextLoaded || canLoadMore
  
  // Display total: use totalPhotos if provided, otherwise use loaded count
  const displayTotal = totalPhotos ?? allPhotos.length
  const displayIndex = currentPhotoIndex >= 0 ? currentPhotoIndex + 1 : 0

  const handlePrevious = () => {
    if (hasPrevious && onPhotoChange) {
      onPhotoChange(allPhotos[currentPhotoIndex - 1])
    }
  }

  const handleNext = async () => {
    if (!onPhotoChange) return
    
    if (hasNextLoaded) {
      // Navigate to next loaded photo
      onPhotoChange(allPhotos[currentPhotoIndex + 1])
    } else if (canLoadMore) {
      // Mark that we want to go to next photo after loading
      pendingNextRef.current = true
      setIsLoadingMore(true)
      try {
        await onLoadMore()
      } finally {
        setIsLoadingMore(false)
      }
    }
  }

  // Effect to handle navigation after loading more photos
  useEffect(() => {
    if (pendingNextRef.current && allPhotos.length > prevPhotosLengthRef.current) {
      // New photos were loaded, navigate to the next one
      const nextIndex = prevPhotosLengthRef.current
      if (nextIndex < allPhotos.length && onPhotoChange) {
        onPhotoChange(allPhotos[nextIndex])
      }
      pendingNextRef.current = false
    }
    prevPhotosLengthRef.current = allPhotos.length
  }, [allPhotos, onPhotoChange])

  useEffect(() => {
    if (!isOpen || allPhotos.length <= 1) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && hasPrevious) handlePrevious()
      if (e.key === 'ArrowRight' && hasNext) handleNext()
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, allPhotos, currentPhotoIndex, hasPrevious, hasNext])

  const notify = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9)
    setNotifications((prev) => [...prev, { id, message, type }])
    setTimeout(() => setNotifications((prev) => prev.filter((n) => n.id !== id)), 2000)
  }

  useEffect(() => {
    if (photo && isOpen) {
      if (photo.dominantColors && photo.dominantColors.length > 0) {
        setDominantColors(photo.dominantColors)
      } else {
        setDominantColors([])
      }
    } else {
      setDominantColors([])
    }
  }, [photo, isOpen])

  const handleCopyColor = (color: string) => {
    navigator.clipboard.writeText(color)
    notify(t('common.copied'))
  }

  if (!photo) return null

  const exifItems = [
    { icon: Camera, label: t('gallery.equipment'), value: photo.cameraModel },
    { icon: Aperture, label: t('gallery.aperture'), value: photo.aperture },
    { icon: Timer, label: t('gallery.shutter'), value: photo.shutterSpeed },
    { icon: Gauge, label: t('gallery.iso'), value: photo.iso?.toString() },
    { icon: Camera, label: t('gallery.focal'), value: photo.focalLength },
    { 
      icon: MapPin, 
      label: 'GPS', 
      value: photo.latitude && photo.longitude ? `${photo.latitude.toFixed(4)}, ${photo.longitude.toFixed(4)}` : undefined 
    },
  ].filter(item => item.value)

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex bg-background/95 backdrop-blur-xl"
        >
          <Toast notifications={notifications} remove={(id) => setNotifications(prev => prev.filter(n => n.id !== id))} />
          
          <div className="flex flex-col lg:flex-row w-full h-full overflow-hidden">
            {/* Left: Immersive Photo Viewer */}
            <div className="relative flex-1 bg-black/5 flex items-center justify-center group overflow-hidden">
              {/* Close Button */}
              <button
                onClick={onClose}
                className="absolute top-4 left-4 md:top-6 md:left-6 z-50 p-2.5 bg-black/20 hover:bg-black/40 text-white/90 hover:text-white rounded-full backdrop-blur-md transition-all border border-white/10"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="absolute inset-0 flex items-center justify-center p-4 md:p-12">
                <img
                  src={resolveAssetUrl(photo.url, settings?.cdn_domain)}
                  alt={photo.title}
                  className="max-w-full max-h-full object-contain shadow-2xl"
                />
              </div>

              {/* Navigation Arrows */}
              {(allPhotos.length > 1 || hasMore) && (
                <>
                  <button
                    onClick={handlePrevious}
                    disabled={!hasPrevious}
                    className="absolute left-4 top-1/2 -translate-y-1/2 p-4 text-foreground/20 hover:text-foreground disabled:opacity-0 transition-all"
                  >
                    <ChevronLeft className="w-8 h-8 md:w-12 md:h-12" />
                  </button>
                  <button
                    onClick={handleNext}
                    disabled={!hasNext || isLoadingMore}
                    className="absolute right-4 top-1/2 -translate-y-1/2 p-4 text-foreground/20 hover:text-foreground disabled:opacity-0 transition-all"
                  >
                    {isLoadingMore ? (
                      <Loader2 className="w-8 h-8 md:w-12 md:h-12 animate-spin" />
                    ) : (
                      <ChevronRight className="w-8 h-8 md:w-12 md:h-12" />
                    )}
                  </button>
                </>
              )}
              
              {/* Bottom Meta Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black/50 to-transparent text-white opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                <div className="flex items-end justify-between max-w-screen-2xl mx-auto">
                  <div className="space-y-2">
                    <p className="font-serif text-2xl md:text-3xl">{photo.title}</p>
                    {photo.takenAt && (
                      <p className="font-mono text-xs opacity-70 uppercase tracking-widest">
                        {user?.isAdmin
                          ? new Date(photo.takenAt).toLocaleString(locale, {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : new Date(photo.takenAt).toLocaleDateString(locale, { dateStyle: 'long' })
                        }
                      </p>
                    )}
                  </div>
                  <div className="font-mono text-xs opacity-60">
                    {displayIndex} / {displayTotal}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Info & Story Panel */}
            <div className="w-full lg:w-[480px] xl:w-[560px] bg-background border-l border-border flex flex-col h-[50vh] lg:h-full">
              {/* Tabs */}
              <div className="flex border-b border-border">
                {[
                  { id: 'story', icon: BookOpen, label: t('gallery.story') },
                  { id: 'info', icon: Info, label: t('gallery.info') }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex-1 flex items-center justify-center gap-2 py-5 text-[10px] font-bold uppercase tracking-[0.2em] transition-all
                      ${activeTab === tab.id ? 'text-primary bg-primary/5' : 'text-muted-foreground hover:bg-muted/30'}
                    `}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <div className="flex-1 overflow-hidden relative">
                <div className="absolute inset-0 overflow-y-auto custom-scrollbar">
                  {activeTab === 'info' ? (
                    <div className="p-8 md:p-12 space-y-12">
                      {/* Header Info */}
                      <div className="space-y-6 text-center">
                        <div className="inline-flex flex-wrap justify-center gap-2">
                          {photo.isFeatured && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 text-amber-600 text-[9px] font-bold uppercase tracking-widest border border-amber-500/20">
                              <Star className="w-3 h-3 fill-current" />
                              Feature
                            </span>
                          )}
                          {photo.category.split(',').map(cat => (
                            <span key={cat} className="px-3 py-1 bg-primary/5 text-primary text-[9px] font-bold uppercase tracking-widest border border-primary/20">
                              {cat}
                            </span>
                          ))}
                        </div>
                        <h2 className="font-serif text-3xl md:text-4xl text-foreground">{photo.title}</h2>
                      </div>

                      <div className="w-12 h-px bg-border mx-auto" />

                      {/* Technical Grid */}
                      <div className="grid grid-cols-2 gap-x-8 gap-y-8">
                        {exifItems.map((item, i) => (
                          <div key={i} className="space-y-2">
                            <div className="flex items-center gap-2 text-muted-foreground/60">
                              <item.icon className="w-3.5 h-3.5" />
                              <span className="text-[9px] font-bold uppercase tracking-[0.2em]">{item.label}</span>
                            </div>
                            <p className="font-mono text-sm border-b border-border/50 pb-2">{item.value}</p>
                          </div>
                        ))}
                      </div>

                      {/* File Details */}
                      <div className="p-6 bg-muted/10 border border-border/50 space-y-6">
                        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground text-center">
                          File Details
                        </h3>
                        <div className="flex justify-between items-center font-mono text-xs">
                          <span className="text-muted-foreground">Dimensions</span>
                          <span>{photo.width} × {photo.height}</span>
                        </div>
                        <div className="flex justify-between items-center font-mono text-xs">
                          <span className="text-muted-foreground">Size</span>
                          <span>{formatFileSize(photo.size)}</span>
                        </div>
                      </div>

                      {/* Colors */}
                      {dominantColors.length > 0 && (
                        <div className="space-y-4 text-center">
                          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
                            {t('gallery.palette')}
                          </h3>
                          <div className="flex justify-center flex-wrap gap-4">
                            {dominantColors.map((color, i) => (
                              <button
                                key={i}
                                onClick={() => handleCopyColor(color)}
                                className="group relative w-10 h-10 rounded-full border border-border/50 shadow-sm transition-transform hover:scale-110"
                                style={{ backgroundColor: color }}
                              >
                                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[9px] font-mono opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-background px-1 border border-border">
                                  {color}
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <StoryTab
                      photoId={photo.id}
                      currentPhoto={photo}
                      onPhotoChange={onPhotoChange}
                    />
                  )}
                </div>
              </div>

              {/* Action Bar */}
              <div className="p-6 border-t border-border bg-background flex gap-4 shrink-0">
                <a
                  href={resolveAssetUrl(photo.url, settings?.cdn_domain)}
                  target="_blank"
                  download
                  className="flex-1 flex items-center justify-center gap-3 py-3 bg-foreground text-background hover:bg-foreground/90 transition-colors text-xs font-bold uppercase tracking-[0.2em]"
                >
                  <Download className="w-4 h-4" />
                  {t('gallery.download')}
                </a>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
