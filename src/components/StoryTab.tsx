'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { BookOpen, MessageSquare, ChevronLeft, ChevronRight, CornerDownRight, Send } from 'lucide-react'
import { getPhotoStory, type StoryDto, getPhotoComments, getStoryComments, submitPhotoComment, type PublicCommentDto, type PhotoDto, resolveAssetUrl } from '@/lib/api'
import { useLanguage } from '@/contexts/LanguageContext'
import { useSettings } from '@/contexts/SettingsContext'
import ReactMarkdown from 'react-markdown'

interface StoryTabProps {
  photoId: string
  currentPhoto: PhotoDto
  onPhotoChange?: (photo: PhotoDto) => void
}

export function StoryTab({ photoId, currentPhoto, onPhotoChange }: StoryTabProps) {
  const { t, locale } = useLanguage()
  const { settings } = useSettings()
  const [story, setStory] = useState<StoryDto | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0)

  // Comments state
  const [comments, setComments] = useState<PublicCommentDto[]>([])
  const [commentsLoading, setCommentsLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    author: '',
    email: '',
    content: '',
  })
  const [submitMessage, setSubmitMessage] = useState<{
    type: 'success' | 'error' | 'pending'
    text: string
  } | null>(null)

  // Use refs to track fetch state and prevent duplicate requests
  const fetchedForPhotoId = useRef<string | null>(null)
  const currentStoryId = useRef<string | null>(null)
  const isFetching = useRef(false)
  const isInitialLoad = useRef(true)

  // Check if photo is within current story
  const isPhotoInCurrentStory = useCallback((pid: string) => {
    return story?.photos?.some(p => p.id === pid) ?? false
  }, [story?.photos])

  useEffect(() => {
    if (isPhotoInCurrentStory(photoId)) {
      const index = story!.photos.findIndex(p => p.id === currentPhoto.id)
      setCurrentPhotoIndex(index >= 0 ? index : 0)
      return
    }

    if (fetchedForPhotoId.current === photoId || isFetching.current) {
      return
    }

    isFetching.current = true
    fetchedForPhotoId.current = photoId

    async function fetchData() {
      if (isInitialLoad.current) {
        setLoading(true)
        setCommentsLoading(true)
      }
      setError(null)
      currentStoryId.current = null

      try {
        const data = await getPhotoStory(photoId)
        setStory(data)
        currentStoryId.current = data?.id ?? null

        if (data?.photos) {
          const index = data.photos.findIndex(p => p.id === currentPhoto.id)
          setCurrentPhotoIndex(index >= 0 ? index : 0)
        }

        if (data?.id) {
          const allComments = await getStoryComments(data.id)
          allComments.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
          setComments(allComments)
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load story'
        if (errorMessage.includes('No story found')) {
          setStory(null)
          setError(null)
          try {
            const photoComments = await getPhotoComments(photoId)
            setComments(photoComments)
          } catch (commentErr) {
            console.error('Failed to load comments:', commentErr)
          }
        } else {
          console.error('Failed to load story:', err)
          setError(errorMessage)
        }
      } finally {
        setLoading(false)
        setCommentsLoading(false)
        isFetching.current = false
        isInitialLoad.current = false
      }
    }

    fetchData()
  }, [photoId, currentPhoto.id, isPhotoInCurrentStory])

  useEffect(() => {
    if (story?.photos) {
      const index = story.photos.findIndex(p => p.id === currentPhoto.id)
      if (index >= 0) {
        setCurrentPhotoIndex(index)
      }
    }
  }, [currentPhoto.id, story?.photos])

  useEffect(() => {
    if (!story?.photos || story.photos.length <= 1 || !onPhotoChange) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && currentPhotoIndex > 0) {
        e.preventDefault()
        onPhotoChange(story.photos[currentPhotoIndex - 1])
      } else if (e.key === 'ArrowRight' && currentPhotoIndex < story.photos.length - 1) {
        e.preventDefault()
        onPhotoChange(story.photos[currentPhotoIndex + 1])
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [story?.photos, currentPhotoIndex, onPhotoChange])

  async function refreshComments() {
    try {
      setCommentsLoading(true)
      if (story?.id) {
        const allComments = await getStoryComments(story.id)
        allComments.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
        setComments(allComments)
      } else {
        const data = await getPhotoComments(photoId)
        setComments(data)
      }
    } catch (err) {
      console.error('Failed to refresh comments:', err)
    } finally {
      setCommentsLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!formData.author.trim() || !formData.content.trim()) return

    try {
      setSubmitting(true)
      setSubmitMessage(null)
      const result = await submitPhotoComment(photoId, {
        author: formData.author.trim(),
        email: formData.email.trim() || undefined,
        content: formData.content.trim(),
      })

      if (result.status === 'approved') {
        setSubmitMessage({ type: 'success', text: t('gallery.comment_success') })
        await refreshComments()
      } else {
        setSubmitMessage({ type: 'pending', text: t('gallery.comment_pending') })
      }
      setFormData({ author: '', email: '', content: '' })
      setTimeout(() => setSubmitMessage(null), 5000)
    } catch (err) {
      console.error('Failed to submit comment:', err)
      setSubmitMessage({
        type: 'error',
        text: err instanceof Error ? err.message : t('gallery.comment_error'),
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
        <div className="space-y-6 animate-pulse">
          <div className="h-10 bg-muted rounded-none w-3/4"></div>
          <div className="h-4 bg-muted rounded-none w-1/4"></div>
          <div className="space-y-3 mt-12">
            <div className="h-4 bg-muted rounded-none"></div>
            <div className="h-4 bg-muted rounded-none"></div>
            <div className="h-4 bg-muted rounded-none w-5/6"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 md:p-12 space-y-16">
      {!story ? (
        <div className="space-y-12">
          <div className="text-center py-12 border border-dashed border-border/50">
            <BookOpen className="w-10 h-10 mx-auto mb-4 opacity-10" />
            <p className="text-xs font-serif italic text-muted-foreground">{t('gallery.no_story')}</p>
          </div>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Story Header */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-px w-8 bg-primary/30" />
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-primary/60">Journal</span>
            </div>
            <h3 className="font-serif text-3xl md:text-4xl leading-[1.1] text-foreground tracking-tight">
              {story.title}
            </h3>
            <div className="flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-muted-foreground/60">
              {new Date(story.createdAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
          </div>

          {/* Photo Navigation */}
          {story.photos && story.photos.length > 1 && onPhotoChange && (
            <div className="py-8 border-t border-b border-border/50">
              <div className="flex items-center justify-between mb-6">
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold tracking-[0.3em] uppercase text-primary">
                    {locale === 'zh' ? '叙事相册' : 'STORY ALBUM'}
                  </h4>
                  <div className="text-[10px] font-mono text-muted-foreground/60 uppercase">
                    Record {currentPhotoIndex + 1} of {story.photos.length}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => currentPhotoIndex > 0 && onPhotoChange(story.photos[currentPhotoIndex - 1])}
                    disabled={currentPhotoIndex === 0}
                    className="w-10 h-10 flex items-center justify-center border border-border hover:border-primary hover:text-primary transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => currentPhotoIndex < story.photos.length - 1 && onPhotoChange(story.photos[currentPhotoIndex + 1])}
                    disabled={currentPhotoIndex === story.photos.length - 1}
                    className="w-10 h-10 flex items-center justify-center border border-border hover:border-primary hover:text-primary transition-all disabled:opacity-20 disabled:cursor-not-allowed"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                {story.photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    onClick={() => onPhotoChange(photo)}
                    className={`relative flex-shrink-0 w-20 h-20 overflow-hidden transition-all snap-start ${
                      index === currentPhotoIndex
                        ? 'grayscale-0 scale-105'
                        : 'grayscale hover:grayscale-0 hover:scale-105'
                    }`}
                  >
                    <img
                      src={resolveAssetUrl(photo.thumbnailUrl || photo.url, settings?.cdn_domain)}
                      alt={photo.title}
                      className="w-full h-full object-cover"
                    />
                    {index === currentPhotoIndex && (
                      <div className="absolute inset-0 border-2 border-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Story Content */}
          <div className="prose prose-stone dark:prose-invert max-w-none prose-p:font-serif prose-p:text-base prose-p:leading-relaxed prose-p:text-foreground/80">
            <ReactMarkdown
              components={{
                h1: ({ children }) => <h1 className="font-serif text-2xl mb-6 tracking-tight">{children}</h1>,
                h2: ({ children }) => <h2 className="font-serif text-xl mb-4 tracking-tight">{children}</h2>,
                blockquote: ({ children }) => (
                  <blockquote className="border-l-2 border-primary/30 pl-6 italic font-serif text-muted-foreground my-8">
                    {children}
                  </blockquote>
                ),
                p: ({ children }) => <p className="mb-6">{children}</p>,
                a: ({ href, children }) => (
                  <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline underline-offset-4">
                    {children}
                  </a>
                ),
              }}
            >
              {story.content}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Comments Section */}
      <div className="pt-16 border-t border-border/50">
        <div className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <MessageSquare className="w-5 h-5 text-primary/40" />
            <h3 className="text-[10px] font-bold tracking-[0.4em] uppercase text-primary/80">
              {t('gallery.comments')} {comments.length > 0 && `(${comments.length})`}
            </h3>
          </div>
        </div>

        {/* Comments List */}
        {commentsLoading ? (
          <div className="space-y-8 animate-pulse mb-12">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="space-y-3">
                <div className="h-4 bg-muted rounded-none w-1/4"></div>
                <div className="h-4 bg-muted rounded-none w-full"></div>
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 mb-12 bg-muted/5 border border-border/50">
            <p className="text-xs font-serif italic text-muted-foreground/60">{t('gallery.no_comments')}</p>
          </div>
        ) : (
          <div className="space-y-12 mb-16">
            {comments.map((comment) => (
              <div key={comment.id} className="relative pl-8">
                <div className="absolute left-0 top-0 text-primary/20">
                  <CornerDownRight className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-xs font-bold text-foreground tracking-tight">
                    {comment.author}
                  </span>
                  <div className="w-1 h-1 rounded-full bg-border" />
                  <span className="text-[9px] font-mono text-muted-foreground/60 uppercase tracking-widest">
                    {new Date(comment.createdAt).toLocaleDateString(locale === 'zh' ? 'zh-CN' : 'en-US')}
                  </span>
                </div>
                <p className="text-sm font-serif leading-relaxed text-foreground/70">
                  {comment.content}
                </p>
              </div>
            ))}
          </div>
        )}

        {/* Comment Form */}
        <div className="relative group">
          <div className="absolute -inset-4 bg-muted/5 opacity-0 group-focus-within:opacity-100 transition-opacity pointer-events-none" />
          <form onSubmit={handleSubmit} className="relative space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.3em]">
                  {t('gallery.comment_author')}
                </label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                  className="w-full py-3 bg-transparent border-b border-border focus:border-primary outline-none transition-all text-sm font-serif"
                  required
                  disabled={submitting}
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.3em]">
                  {t('gallery.comment_email')}
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full py-3 bg-transparent border-b border-border focus:border-primary outline-none transition-all text-sm font-serif placeholder:italic placeholder:text-muted-foreground/30"
                  placeholder="Optional"
                  disabled={submitting}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-bold text-muted-foreground/60 uppercase tracking-[0.3em]">
                {t('gallery.comment_content')}
              </label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full py-4 bg-transparent border border-border focus:border-primary p-4 outline-none transition-all text-sm font-serif min-h-[120px] resize-none"
                required
                disabled={submitting}
              />
            </div>

            {submitMessage && (
              <div className={`text-[10px] p-4 font-mono uppercase tracking-widest border ${
                submitMessage.type === 'success' ? 'bg-primary/5 border-primary/20 text-primary' :
                submitMessage.type === 'pending' ? 'bg-amber-500/5 border-amber-500/20 text-amber-600' :
                'bg-destructive/5 border-destructive/20 text-destructive'
              }`}>
                {submitMessage.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting || !formData.author.trim() || !formData.content.trim()}
              className="group/btn flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.4em] text-primary disabled:opacity-20"
            >
              <span>{submitting ? t('gallery.comment_submitting') : t('gallery.comment_submit')}</span>
              <div className="w-8 h-8 flex items-center justify-center border border-primary/20 rounded-full group-hover/btn:bg-primary group-hover/btn:text-primary-foreground transition-all">
                <Send className="w-3 h-3" />
              </div>
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
