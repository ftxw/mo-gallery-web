'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  Calendar, 
  Ruler, 
  Star, 
  X, 
  LayoutGrid, 
  StretchVertical, 
  Clock, 
  ZoomIn, 
  ZoomOut,
  Filter,
  Maximize2,
  HardDrive,
  Loader2
} from 'lucide-react'
import { getCategories, getPhotos, resolveAssetUrl, type PhotoDto } from '@/lib/api'

type ViewMode = 'grid' | 'masonry' | 'timeline'

function formatFileSize(bytes?: number): string {
  if (!bytes) return '未知'
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export default function GalleryPage() {
  const [categories, setCategories] = useState<string[]>(['全部'])
  const [selectedCategory, setSelectedCategory] = useState('全部')
  const [viewMode, setViewMode] = useState<ViewMode>('grid')
  const [zoomLevel, setZoomLevel] = useState(3)

  const [photos, setPhotos] = useState<PhotoDto[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [selectedPhoto, setSelectedPhoto] = useState<PhotoDto | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const data = await getCategories()
        if (cancelled) return
        setCategories(data.includes('全部') ? data : ['全部', ...data])
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '加载分类失败')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    setError('')
    setLoading(true)
    ;(async () => {
      try {
        const data = await getPhotos({ category: selectedCategory, limit: 100 })
        if (cancelled) return
        setPhotos(data)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : '加载照片失败')
      } finally {
        if (cancelled) return
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [selectedCategory])

  const groupedPhotos = useMemo(() => {
    if (viewMode !== 'timeline') return []
    const groups: { title: string; photos: PhotoDto[] }[] = []
    const sorted = [...photos].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    
    sorted.forEach(photo => {
      const date = new Date(photo.createdAt)
      const title = `${date.getFullYear()}年${date.getMonth() + 1}月`
      const lastGroup = groups[groups.length - 1]
      if (lastGroup && lastGroup.title === title) {
        lastGroup.photos.push(photo)
      } else {
        groups.push({ title, photos: [photo] })
      }
    })
    return groups
  }, [photos, viewMode])

  const gridColsClass = useMemo(() => {
    if (viewMode === 'masonry') return ''
    switch (zoomLevel) {
      case 1: return 'grid-cols-4 sm:grid-cols-6 lg:grid-cols-10 gap-2'
      case 2: return 'grid-cols-3 sm:grid-cols-5 lg:grid-cols-8 gap-3'
      case 3: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4'
      case 4: return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6'
      default: return 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4'
    }
  }, [zoomLevel, viewMode])

  const masonryColsClass = useMemo(() => {
    switch (zoomLevel) {
      case 1: return 'columns-4 sm:columns-6 lg:columns-10 gap-2'
      case 2: return 'columns-3 sm:columns-5 lg:columns-8 gap-3'
      case 3: return 'columns-2 sm:columns-3 lg:columns-5 gap-4'
      case 4: return 'columns-1 sm:columns-2 lg:columns-3 gap-6'
      default: return 'columns-2 sm:columns-3 lg:columns-5 gap-4'
    }
  }, [zoomLevel])

  return (
    <div className="max-w-[1600px] mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-baseline justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">相册展示</h1>
          <p className="text-xs text-muted-foreground mt-0.5">共 {photos.length} 张摄影作品</p>
        </div>
      </div>

      {/* Control Bar */}
      <div className="sticky top-4 z-30 mb-8 px-4 py-2 bg-background/70 backdrop-blur-xl border border-white/10 rounded-full shadow-lg flex items-center gap-4 overflow-hidden">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar flex-1 border-r pr-4 border-muted">
          <Filter className="w-3.5 h-3.5 text-muted-foreground mr-2 shrink-0" />
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1 rounded-full text-xs transition-all whitespace-nowrap ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground font-medium'
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        <div className="flex items-center p-0.5 bg-muted/30 rounded-full shrink-0">
          <button
            onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('masonry')}
            className={`p-1.5 rounded-full transition-colors ${viewMode === 'masonry' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <StretchVertical className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setViewMode('timeline')}
            className={`p-1.5 rounded-full transition-colors ${viewMode === 'timeline' ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Clock className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="hidden sm:flex items-center gap-1 shrink-0 border-l pl-4 border-muted text-muted-foreground">
          <button 
            onClick={() => setZoomLevel(prev => Math.max(1, prev - 1))}
            className="p-1 hover:text-foreground disabled:opacity-20"
            disabled={zoomLevel === 1}
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <div className="text-[10px] font-mono w-4 text-center select-none">{zoomLevel}</div>
          <button 
            onClick={() => setZoomLevel(prev => Math.min(4, prev + 1))}
            className="p-1 hover:text-foreground disabled:opacity-20"
            disabled={zoomLevel === 4}
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-3 bg-destructive/5 border border-destructive/10 text-destructive rounded-lg text-xs">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-32 flex flex-col items-center justify-center space-y-3">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-[10px] text-muted-foreground tracking-widest uppercase">加载中</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {viewMode === 'timeline' ? (
            <motion.div
              key="timeline"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-10"
            >
              {groupedPhotos.map((group) => (
                <div key={group.title} className="relative pl-6 sm:pl-10">
                  <div className="absolute left-0 top-1 bottom-0 w-px bg-muted" />
                  <div className="absolute left-[-2px] top-1.5 w-1 h-1 rounded-full bg-primary" />
                  
                  <div className="mb-4">
                    <h2 className="text-sm font-bold tracking-tight flex items-center gap-2">
                      {group.title}
                      <span className="text-[10px] font-normal text-muted-foreground">
                        / {group.photos.length}
                      </span>
                    </h2>
                  </div>

                  <div className={`grid ${gridColsClass}`}>
                    {group.photos.map((photo, index) => (
                      <PhotoCard 
                        key={photo.id} 
                        photo={photo} 
                        index={index} 
                        zoomLevel={zoomLevel} 
                        onClick={() => setSelectedPhoto(photo)} 
                      />
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          ) : viewMode === 'masonry' ? (
            <motion.div
              key="masonry"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={masonryColsClass}
            >
              {photos.map((photo, index) => (
                <div key={photo.id} className="mb-4 break-inside-avoid">
                  <PhotoCard 
                    photo={photo} 
                    index={index} 
                    zoomLevel={zoomLevel} 
                    onClick={() => setSelectedPhoto(photo)} 
                  />
                </div>
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="grid"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className={`grid ${gridColsClass}`}
            >
              {photos.map((photo, index) => (
                <PhotoCard 
                  key={photo.id} 
                  photo={photo} 
                  index={index} 
                  zoomLevel={zoomLevel} 
                  onClick={() => setSelectedPhoto(photo)} 
                />
              ))}
            </motion.div>
          )}

          {photos.length === 0 && !error && !loading && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center"
            >
              <p className="text-xs text-muted-foreground">该分类下还没有照片</p>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {/* Modal with Progressive Loading and Blur Background */}
      <AnimatePresence>
        {selectedPhoto && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 overflow-hidden">
            {/* Ambient Blurred Background (Uses thumbnail first, then high-res) */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-0 bg-cover bg-center scale-110"
              style={{ 
                backgroundImage: `url(${resolveAssetUrl(selectedPhoto.thumbnail_url || selectedPhoto.url)})`,
                filter: 'blur(60px) brightness(0.3)'
              }}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative z-10 bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden w-full max-w-7xl h-[90vh] shadow-2xl flex flex-col lg:flex-row"
            >
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-background/50 hover:bg-background border shadow-sm transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="w-full lg:w-[70%] h-full flex items-center justify-center p-4 relative">
                <ProgressiveImage 
                  src={resolveAssetUrl(selectedPhoto.url)} 
                  placeholderSrc={resolveAssetUrl(selectedPhoto.thumbnail_url || selectedPhoto.url)} 
                  alt={selectedPhoto.title}
                />
              </div>

              <div className="w-full lg:w-[30%] h-full border-l border-white/10 p-8 overflow-y-auto bg-card/40">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-primary uppercase tracking-widest">{selectedPhoto.category}</span>
                    <h2 className="text-2xl font-bold leading-tight">{selectedPhoto.title}</h2>
                  </div>

                  <div className="space-y-4 pt-6 border-t border-white/10">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-2"><Ruler className="w-3.5 h-3.5" /> 分辨率</span>
                      <span className="font-mono">{selectedPhoto.width} × {selectedPhoto.height}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-2"><HardDrive className="w-3.5 h-3.5" /> 文件大小</span>
                      <span className="font-mono">{formatFileSize(selectedPhoto.size)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-3.5 h-3.5" /> 拍摄日期</span>
                      <span>{new Date(selectedPhoto.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <div className="pt-8 space-y-3">
                    <button 
                      onClick={() => window.open(resolveAssetUrl(selectedPhoto.url), '_blank')}
                      className="w-full py-2.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium flex items-center justify-center gap-2"
                    >
                      <Maximize2 className="w-3.5 h-3.5" /> 查看原图
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ProgressiveImage({ src, placeholderSrc, alt }: { src: string; placeholderSrc: string; alt: string }) {
  const [isLoaded, setIsLoaded] = useState(false)
  
  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Thumbnail/Placeholder (Should be instant) */}
      <img
        src={placeholderSrc}
        alt={alt}
        className={`max-w-full max-h-full object-contain transition-opacity duration-300 ${isLoaded ? 'opacity-0' : 'opacity-100'}`}
      />
      
      {/* High-res Image */}
      <img
        src={src}
        alt={alt}
        onLoad={() => setIsLoaded(true)}
        className={`absolute max-w-full max-h-full object-contain transition-opacity duration-500 shadow-2xl rounded-sm ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
      />

      {/* Loading Spinner in Bottom-Right */}
      <AnimatePresence>
        {!isLoaded && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute bottom-6 right-6 bg-black/40 backdrop-blur-md p-2 rounded-full text-white/80"
          >
            <Loader2 className="w-5 h-5 animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function PhotoCard({ photo, index, zoomLevel, onClick }: { 
  photo: PhotoDto; 
  index: number; 
  zoomLevel: number;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.01, 0.5) }}
      className="group w-full text-left outline-none"
      onClick={onClick}
    >
      <div className={`relative overflow-hidden rounded-xl bg-muted/20 transition-all duration-300 group-hover:shadow-md ${zoomLevel <= 2 ? 'aspect-square' : 'aspect-[3/4]'}`}>
        <img
          src={resolveAssetUrl(photo.thumbnail_url || photo.url)}
          alt={photo.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <p className="text-white text-[10px] font-medium truncate">{photo.title}</p>
        </div>

        {photo.isFeatured && (
          <div className="absolute top-2 right-2 p-1 bg-white/10 backdrop-blur-md rounded-full text-yellow-400">
            <Star className="w-3 h-3 fill-yellow-400" />
          </div>
        )}
      </div>
    </motion.button>
  )
}
