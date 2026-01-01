'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ExternalLink, Users, Sparkles, Loader2 } from 'lucide-react'
import { useLanguage } from '@/contexts/LanguageContext'
import { getFriendLinks, FriendLinkDto } from '@/lib/api'

export default function TheyPage() {
  const { t } = useLanguage()
  const [friends, setFriends] = useState<FriendLinkDto[]>([])
  const [loading, setLoading] = useState(true)
  const [hoveredId, setHoveredId] = useState<string | null>(null)

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const data = await getFriendLinks()
        setFriends(data)
      } catch (error) {
        console.error('Failed to fetch friend links:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchFriends()
  }, [])

  return (
    <main className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative min-h-[60vh] flex items-center justify-center overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient Mesh */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          
          {/* Floating Orbs */}
          <motion.div
            className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/5 blur-3xl"
            animate={{
              x: [0, 50, 0],
              y: [0, -30, 0],
              scale: [1, 1.1, 1],
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full bg-primary/8 blur-3xl"
            animate={{
              x: [0, -40, 0],
              y: [0, 40, 0],
              scale: [1, 0.9, 1],
            }}
            transition={{
              duration: 15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          
          {/* Grid Pattern */}
          <div 
            className="absolute inset-0 opacity-[0.02]"
            style={{
              backgroundImage: `
                linear-gradient(to right, currentColor 1px, transparent 1px),
                linear-gradient(to bottom, currentColor 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
            }}
          />
        </div>

        {/* Content */}
        <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            {/* Icon */}
            <motion.div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 mb-8"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            >
              <Users className="w-10 h-10 text-primary" />
            </motion.div>

            {/* Title */}
            <h1 className="font-serif text-6xl md:text-8xl font-bold tracking-tight mb-6">
              <span className="bg-gradient-to-r from-foreground via-foreground/80 to-foreground bg-clip-text">
                {t('they.title')}
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg md:text-xl text-muted-foreground font-light tracking-wide mb-8">
              {t('they.subtitle')}
            </p>

            {/* Description */}
            <p className="text-sm text-muted-foreground/70 max-w-2xl mx-auto leading-relaxed">
              {t('they.description')}
            </p>
          </motion.div>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <motion.div
            className="w-6 h-10 rounded-full border-2 border-primary/30 flex items-start justify-center p-2"
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <motion.div
              className="w-1 h-2 rounded-full bg-primary/50"
              animate={{ y: [0, 8, 0], opacity: [1, 0.3, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </motion.div>
        </motion.div>
      </section>

      {/* Friends Grid */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : friends.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-24"
            >
              <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-6">
                <Users className="w-12 h-12 text-muted-foreground/30" />
              </div>
              <p className="text-muted-foreground font-serif italic">{t('they.empty')}</p>
            </motion.div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {friends.map((friend, index) => (
                <motion.a
                  key={friend.id}
                  href={friend.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group relative"
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onMouseEnter={() => setHoveredId(friend.id)}
                  onMouseLeave={() => setHoveredId(null)}
                >
                  {/* Card */}
                  <div className="relative overflow-hidden rounded-2xl bg-card border border-border/50 p-8 transition-all duration-500 group-hover:border-primary/30 group-hover:shadow-2xl group-hover:shadow-primary/5">
                    {/* Featured Badge */}
                    {friend.featured && (
                      <div className="absolute top-4 right-4">
                        <motion.div
                          className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary"
                          animate={hoveredId === friend.id ? { scale: [1, 1.1, 1] } : {}}
                          transition={{ duration: 0.5 }}
                        >
                          <Sparkles className="w-3 h-3" />
                          <span className="text-[10px] font-bold uppercase tracking-wider">Featured</span>
                        </motion.div>
                      </div>
                    )}

                    {/* Avatar */}
                    <div className="relative mb-6">
                      <motion.div
                        className="w-20 h-20 rounded-2xl overflow-hidden bg-muted/50 ring-2 ring-border/50 group-hover:ring-primary/30 transition-all duration-500"
                        whileHover={{ scale: 1.05, rotate: 2 }}
                      >
                        {friend.avatar ? (
                          <img
                            src={friend.avatar}
                            alt={friend.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                            <span className="text-2xl font-bold text-primary/60">
                              {friend.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </motion.div>
                      
                      {/* Decorative Ring */}
                      <motion.div
                        className="absolute -inset-2 rounded-3xl border border-primary/0 group-hover:border-primary/20 transition-all duration-500"
                        animate={hoveredId === friend.id ? { rotate: 360 } : { rotate: 0 }}
                        transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                      />
                    </div>

                    {/* Info */}
                    <div className="space-y-3">
                      <h3 className="font-serif text-xl font-semibold text-foreground group-hover:text-primary transition-colors duration-300">
                        {friend.name}
                      </h3>
                      
                      {friend.description && (
                        <p className="text-sm text-muted-foreground/70 line-clamp-2">
                          {friend.description}
                        </p>
                      )}

                      {/* URL Preview */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground/50 font-mono">
                        <ExternalLink className="w-3 h-3" />
                        <span className="truncate">{new URL(friend.url).hostname}</span>
                      </div>
                    </div>

                    {/* Hover Action */}
                    <motion.div
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary/0 via-primary to-primary/0"
                      initial={{ scaleX: 0 }}
                      animate={{ scaleX: hoveredId === friend.id ? 1 : 0 }}
                      transition={{ duration: 0.3 }}
                    />

                    {/* Visit Button */}
                    <motion.div
                      className="mt-6 flex items-center justify-between"
                      initial={{ opacity: 0.5 }}
                      animate={{ opacity: hoveredId === friend.id ? 1 : 0.5 }}
                    >
                      <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50">
                        {t('they.powered_by')}
                      </span>
                      <span className="flex items-center gap-2 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        {t('they.visit')}
                        <ExternalLink className="w-3 h-3" />
                      </span>
                    </motion.div>
                  </div>

                  {/* Background Glow */}
                  <motion.div
                    className="absolute -inset-4 rounded-3xl bg-primary/5 blur-2xl -z-10"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: hoveredId === friend.id ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                  />
                </motion.a>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-sm text-muted-foreground/60 mb-4">
              也在使用 MO Gallery？
            </p>
            <p className="text-xs text-muted-foreground/40">
              欢迎联系我们，将你的画廊添加到这里
            </p>
          </motion.div>
        </div>
      </section>
    </main>
  )
}