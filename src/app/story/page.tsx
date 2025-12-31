'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Calendar, ArrowRight, Image as ImageIcon, ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { getStories, type StoryDto } from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSettings } from '@/contexts/SettingsContext'
import { resolveAssetUrl } from '@/lib/api'

export default function StoryListPage() {
  const { t } = useLanguage()
  const { settings } = useSettings()
  const [stories, setStories] = useState<StoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        const storiesData = await getStories()
        setStories(storiesData)
      } catch (error) {
        console.error('Failed to fetch story data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Group stories by year
  const timelineData = useMemo(() => {
    const grouped: Record<string, StoryDto[]> = {}
    stories.forEach(story => {
      const date = new Date(story.createdAt)
      const year = date.getFullYear().toString()
      if (!grouped[year]) grouped[year] = []
      grouped[year].push(story)
    })
    return grouped
  }, [stories])

  const years = useMemo(() => {
    return Object.keys(timelineData).sort((a, b) => parseInt(b) - parseInt(a))
  }, [timelineData])

  const getCoverUrl = (story: StoryDto): string | null => {
    if (story.coverPhotoId && story.photos.length > 0) {
      const coverPhoto = story.photos.find(p => p.id === story.coverPhotoId)
      if (coverPhoto) {
        return resolveAssetUrl(coverPhoto.thumbnailUrl || coverPhoto.url, settings?.cdn_domain)
      }
    }
    if (story.photos.length > 0) {
      const firstPhoto = story.photos[0]
      return resolveAssetUrl(firstPhoto.thumbnailUrl || firstPhoto.url, settings?.cdn_domain)
    }
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-24 pb-16">
        <div className="px-6 md:px-12 lg:px-24">
          <div className="max-w-screen-xl mx-auto">
            <div className="animate-pulse space-y-12">
              <div className="h-16 bg-muted rounded-none w-1/3"></div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="space-y-6">
                    <div className="aspect-[16/9] bg-muted rounded-none"></div>
                    <div className="space-y-3">
                      <div className="h-6 bg-muted rounded-none w-3/4"></div>
                      <div className="h-4 bg-muted rounded-none w-full"></div>
                      <div className="h-4 bg-muted rounded-none w-2/3"></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pt-28 pb-20">
      {/* Header Section */}
      <div className="px-6 md:px-12 lg:px-24 mb-16 md:mb-24">
        <div className="max-w-screen-xl mx-auto">
          <header className="relative">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-4 mb-4"
            >
              <div className="h-px w-8 bg-primary" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary">
                Journal
              </span>
            </motion.div>
            
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl md:text-7xl font-serif font-light tracking-tighter leading-[0.9]"
              >
                {t('nav.story')}
              </motion.h1>
              
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="max-w-xs"
              >
                <p className="text-xs text-muted-foreground leading-relaxed font-serif italic">
                  A collection of visual narratives, personal journeys, and documented moments in time.
                </p>
                <div className="mt-3 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
                  {stories.length} {t('story.count_suffix') || 'STORIES'}
                </div>
              </motion.div>
            </div>
          </header>
        </div>
      </div>

      {/* Stories Content */}
      <div className="px-6 md:px-12 lg:px-24">
        <div className="max-w-screen-xl mx-auto">
          {stories.length === 0 ? (
            <div className="py-24 text-center border-t border-border/50">
              <BookOpen className="w-10 h-10 mx-auto mb-4 opacity-20" />
              <p className="text-muted-foreground font-serif italic text-sm">{t('story.empty') || 'No stories found yet.'}</p>
            </div>
          ) : (
            <div className="space-y-24">
              {years.map((year, yearIndex) => (
                <section key={year} className="relative">
                  {/* Year Header */}
                  <div className="sticky top-20 z-10 flex items-center gap-4 mb-12 mix-blend-difference">
                    <span className="text-4xl md:text-5xl font-mono font-black tracking-tighter opacity-10">
                      {year}
                    </span>
                    <div className="h-px flex-1 bg-border/30" />
                  </div>

                  {/* Story Grid */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-16 gap-y-24">
                    {timelineData[year].map((story, index) => {
                      const coverUrl = getCoverUrl(story)
                      const isLarge = index % 3 === 0
                      
                      return (
                        <motion.div
                          key={story.id}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true, margin: "-50px" }}
                          transition={{ duration: 0.6, ease: [0.21, 0.45, 0.32, 0.9] }}
                          className={`group relative ${isLarge ? 'lg:col-span-2' : ''}`}
                          onMouseEnter={() => setHoveredId(story.id)}
                          onMouseLeave={() => setHoveredId(null)}
                        >
                          <Link href={`/story/${story.id}`} className="block">
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
                              {/* Index & Date */}
                              <div className="md:col-span-2 flex flex-row md:flex-col justify-between md:justify-start gap-4">
                                <span className="text-[10px] font-mono text-muted-foreground/40 font-bold tracking-tighter">
                                  {String(index + 1).padStart(2, '0')}
                                </span>
                                <div className="flex flex-col items-end md:items-start gap-0.5">
                                  <span className="text-[9px] font-mono uppercase tracking-widest text-muted-foreground">
                                    {new Date(story.createdAt).toLocaleDateString('en-US', { month: 'short' })}
                                  </span>
                                  <span className="text-lg font-mono tracking-tighter">
                                    {new Date(story.createdAt).toLocaleDateString('en-US', { day: '2-digit' })}
                                  </span>
                                </div>
                              </div>

                              {/* Image Container */}
                              <div className={`md:col-span-10 ${isLarge ? 'lg:col-span-8' : 'lg:col-span-10'}`}>
                                <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                                  {coverUrl ? (
                                    <motion.img
                                      src={coverUrl}
                                      alt={story.title}
                                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <BookOpen className="w-10 h-10 opacity-10" />
                                    </div>
                                  )}
                                  
                                  {/* Hover Overlay */}
                                  <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                                  
                                  {/* Photo Count */}
                                  <div className="absolute bottom-4 left-4 flex items-center gap-2 px-2 py-1 bg-background/90 backdrop-blur-md text-[9px] font-mono tracking-widest">
                                    <ImageIcon className="w-3 h-3" />
                                    {story.photos.length}
                                  </div>
                                </div>
                              </div>

                              {/* Content Info */}
                              <div className={`md:col-start-3 md:col-span-10 ${isLarge ? 'lg:col-start-11 lg:col-span-2' : 'lg:col-start-3 lg:col-span-10'} pt-4 lg:pt-0`}>
                                <div className="space-y-4">
                                  <h3 className="text-2xl md:text-3xl font-serif font-light tracking-tight leading-none group-hover:text-primary transition-colors duration-300">
                                    {story.title}
                                  </h3>
                                  
                                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 font-serif italic">
                                    {story.content.replace(/[#*`\[\]]/g, '').substring(0, 120)}...
                                  </p>

                                  <div className="flex items-center gap-3 group/btn pt-2">
                                    <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">
                                      {t('story.read_more') || 'READ'}
                                    </span>
                                    <div className="relative w-6 h-6 flex items-center justify-center border border-primary/20 rounded-full group-hover/btn:bg-primary group-hover/btn:border-primary transition-all duration-300">
                                      <ArrowUpRight className="w-3 h-3 text-primary group-hover/btn:text-primary-foreground transition-colors" />
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}

          {/* Footer Navigation */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="mt-32 pt-16 border-t border-border/50 text-center"
          >
            <Link
              href="/gallery"
              className="group inline-flex flex-col items-center gap-4"
            >
              <span className="text-[9px] font-bold uppercase tracking-[0.4em] text-muted-foreground group-hover:text-primary transition-colors">
                Explore More
              </span>
              <span className="text-3xl md:text-5xl font-serif font-light italic tracking-tight hover:text-primary transition-colors">
                {t('story.back_to_gallery') || 'Back to Gallery'}
              </span>
            </Link>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
