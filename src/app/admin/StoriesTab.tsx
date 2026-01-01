'use client'

import { useState, useEffect, useRef } from 'react'
import {
  BookOpen,
  Plus,
  History,
  FileText,
  Edit3,
  Trash2,
  ChevronLeft,
  Save,
  Eye,
  EyeOff,
  Image as ImageIcon,
  X,
  GripVertical,
} from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  getAdminStories,
  createStory,
  updateStory,
  deleteStory,
  addPhotosToStory,
  removePhotoFromStory,
  reorderStoryPhotos,
  getPhotos,
  resolveAssetUrl,
  type StoryDto,
  type PhotoDto,
} from '@/lib/api'
import { CustomInput } from '@/components/ui/CustomInput'
import { useSettings } from '@/contexts/SettingsContext'

interface StoriesTabProps {
  token: string | null
  t: (key: string) => string
  notify: (message: string, type?: 'success' | 'error' | 'info') => void
  editStoryId?: string
}

export function StoriesTab({ token, t, notify, editStoryId }: StoriesTabProps) {
  const { settings } = useSettings()
  const [stories, setStories] = useState<StoryDto[]>([])
  const [loading, setLoading] = useState(true)
  const [currentStory, setCurrentStory] = useState<StoryDto | null>(null)
  const [storyEditMode, setStoryEditMode] = useState<'list' | 'editor'>('list')
  const [storyPreviewActive, setStoryPreviewActive] = useState(false)
  const [saving, setSaving] = useState(false)
  
  // Photo management
  const [allPhotos, setAllPhotos] = useState<PhotoDto[]>([])
  const [showPhotoSelector, setShowPhotoSelector] = useState(false)
  const [selectedPhotoIds, setSelectedPhotoIds] = useState<Set<string>>(new Set())
  const [photosLoading, setPhotosLoading] = useState(false)
  
  // Drag and drop state
  const [draggedPhotoId, setDraggedPhotoId] = useState<string | null>(null)
  const [dragOverPhotoId, setDragOverPhotoId] = useState<string | null>(null)

  useEffect(() => {
    loadStories()
  }, [token])

  // Handle editStoryId - auto-open editor for the specified story
  useEffect(() => {
    if (editStoryId && stories.length > 0) {
      const storyToEdit = stories.find(s => s.id === editStoryId)
      if (storyToEdit) {
        setCurrentStory({ ...storyToEdit })
        setStoryEditMode('editor')
        setStoryPreviewActive(false)
      }
    }
  }, [editStoryId, stories])

  // Load all photos when entering editor mode
  useEffect(() => {
    if (storyEditMode === 'editor' && allPhotos.length === 0) {
      loadAllPhotos()
    }
  }, [storyEditMode])

  async function loadStories() {
    if (!token) return
    try {
      setLoading(true)
      const data = await getAdminStories(token)
      setStories(data)
    } catch (err) {
      console.error('Failed to load stories:', err)
      notify(t('story.load_failed'), 'error')
    } finally {
      setLoading(false)
    }
  }

  async function loadAllPhotos() {
    try {
      setPhotosLoading(true)
      const data = await getPhotos({ all: true })
      setAllPhotos(data)
    } catch (err) {
      console.error('Failed to load photos:', err)
    } finally {
      setPhotosLoading(false)
    }
  }

  function handleCreateStory() {
    setCurrentStory({
      id: crypto.randomUUID(),
      title: '',
      content: '',
      isPublished: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      photos: [],
    })
    setStoryEditMode('editor')
    setStoryPreviewActive(false)
  }

  function handleEditStory(story: StoryDto) {
    setCurrentStory({ ...story })
    setStoryEditMode('editor')
    setStoryPreviewActive(false)
  }

  async function handleDeleteStory(id: string) {
    if (!token) return
    if (!window.confirm(t('common.confirm') + '?')) return

    try {
      await deleteStory(token, id)
      notify(t('story.deleted'), 'success')
      await loadStories()
    } catch (err) {
      console.error('Failed to delete story:', err)
      notify(t('story.delete_failed'), 'error')
    }
  }

  async function handleSaveStory() {
    if (!token || !currentStory) return
    if (!currentStory.title.trim() || !currentStory.content.trim()) {
      notify(t('story.fill_title_content'), 'error')
      return
    }

    try {
      setSaving(true)
      const isNew = !stories.find((s) => s.id === currentStory.id)

      if (isNew) {
        await createStory(token, {
          title: currentStory.title,
          content: currentStory.content,
          isPublished: currentStory.isPublished,
          photoIds: currentStory.photos?.map(p => p.id) || [],
        })
        notify(t('story.created'), 'success')
      } else {
        await updateStory(token, currentStory.id, {
          title: currentStory.title,
          content: currentStory.content,
          isPublished: currentStory.isPublished,
        })
        notify(t('story.updated'), 'success')
      }

      setStoryEditMode('list')
      setCurrentStory(null)
      await loadStories()
    } catch (err) {
      console.error('Failed to save story:', err)
      notify(t('story.save_failed'), 'error')
    } finally {
      setSaving(false)
    }
  }

  async function handleTogglePublish(story: StoryDto) {
    if (!token) return

    try {
      await updateStory(token, story.id, {
        isPublished: !story.isPublished,
      })
      notify(story.isPublished ? t('story.unpublished') : t('story.published'), 'success')
      await loadStories()
    } catch (err) {
      console.error('Failed to toggle publish:', err)
      notify(t('story.operation_failed'), 'error')
    }
  }

  async function handleAddPhotos() {
    if (!token || !currentStory || selectedPhotoIds.size === 0) return
    
    const isNew = !stories.find((s) => s.id === currentStory.id)
    
    if (isNew) {
      // For new stories, just add to local state
      const photosToAdd = allPhotos.filter(p => selectedPhotoIds.has(p.id))
      setCurrentStory(prev => ({
        ...prev!,
        photos: [...(prev?.photos || []), ...photosToAdd]
      }))
    } else {
      // For existing stories, call API
      try {
        const updated = await addPhotosToStory(token, currentStory.id, Array.from(selectedPhotoIds))
        setCurrentStory(updated)
        notify(t('admin.photos_added'), 'success')
      } catch (err) {
        console.error('Failed to add photos:', err)
        notify(t('common.error'), 'error')
      }
    }
    
    setSelectedPhotoIds(new Set())
    setShowPhotoSelector(false)
  }

  async function handleRemovePhoto(photoId: string) {
    if (!token || !currentStory) return
    
    const isNew = !stories.find((s) => s.id === currentStory.id)
    
    if (isNew) {
      // For new stories, just remove from local state
      setCurrentStory(prev => ({
        ...prev!,
        photos: prev?.photos?.filter(p => p.id !== photoId) || []
      }))
    } else {
      // For existing stories, call API
      try {
        const updated = await removePhotoFromStory(token, currentStory.id, photoId)
        setCurrentStory(updated)
        notify(t('admin.photo_removed'), 'success')
      } catch (err) {
        console.error('Failed to remove photo:', err)
        notify(t('common.error'), 'error')
      }
    }
  }

  async function handleSetCover(photoId: string) {
    if (!token || !currentStory) return
    
    const isNew = !stories.find((s) => s.id === currentStory.id)
    
    if (isNew) {
      setCurrentStory(prev => ({
        ...prev!,
        coverPhotoId: photoId
      }))
    } else {
      try {
        const updated = await updateStory(token, currentStory.id, { coverPhotoId: photoId })
        setCurrentStory(updated)
        notify(t('admin.cover_set'), 'success')
      } catch (err) {
        console.error('Failed to set cover:', err)
        notify(t('common.error'), 'error')
      }
    }
  }

  // Drag and drop handlers
  function handleDragStart(e: React.DragEvent, photoId: string) {
    setDraggedPhotoId(photoId)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', photoId)
    // Add a slight delay to show the drag effect
    setTimeout(() => {
      const element = e.target as HTMLElement
      element.style.opacity = '0.5'
    }, 0)
  }

  function handleDragEnd(e: React.DragEvent) {
    const element = e.target as HTMLElement
    element.style.opacity = '1'
    setDraggedPhotoId(null)
    setDragOverPhotoId(null)
  }

  function handleDragOver(e: React.DragEvent, photoId: string) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    if (photoId !== draggedPhotoId) {
      setDragOverPhotoId(photoId)
    }
  }

  function handleDragLeave() {
    setDragOverPhotoId(null)
  }

  async function handleDrop(e: React.DragEvent, targetPhotoId: string) {
    e.preventDefault()
    setDragOverPhotoId(null)
    
    if (!currentStory?.photos || !draggedPhotoId || draggedPhotoId === targetPhotoId) {
      return
    }

    const photos = [...currentStory.photos]
    const draggedIndex = photos.findIndex(p => p.id === draggedPhotoId)
    const targetIndex = photos.findIndex(p => p.id === targetPhotoId)

    if (draggedIndex === -1 || targetIndex === -1) return

    // Remove dragged item and insert at target position
    const [draggedPhoto] = photos.splice(draggedIndex, 1)
    photos.splice(targetIndex, 0, draggedPhoto)

    // Update local state immediately for smooth UX
    setCurrentStory(prev => ({
      ...prev!,
      photos
    }))

    // If it's an existing story, save the new order to the server
    const isNew = !stories.find((s) => s.id === currentStory.id)
    if (!isNew && token) {
      try {
        const photoIds = photos.map(p => p.id)
        await reorderStoryPhotos(token, currentStory.id, photoIds)
        notify(t('admin.photos_reordered'), 'success')
      } catch (err) {
        console.error('Failed to reorder photos:', err)
        notify(t('common.error'), 'error')
        // Revert on error
        await loadStories()
      }
    }
  }

  // Get available photos (not already in story)
  const availablePhotos = allPhotos.filter(
    p => !currentStory?.photos?.some(sp => sp.id === p.id)
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-6 overflow-hidden">
      {storyEditMode === 'list' ? (
        <div className="space-y-8 flex-1 flex flex-col overflow-hidden">
          <div className="flex items-center justify-between border-b border-border pb-4 flex-shrink-0">
            <div className="flex items-center gap-4">
              <BookOpen className="w-6 h-6 text-primary" />
              <h3 className="font-serif text-2xl uppercase tracking-tight">
                {t('ui.photo_story')}
              </h3>
            </div>
            <button
              onClick={handleCreateStory}
              className="flex items-center px-6 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all rounded-md"
            >
              <Plus className="w-4 h-4 mr-2" />
              {t('ui.create_story')}
            </button>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-1 gap-4">
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="flex items-center justify-between p-6 border border-border hover:border-primary transition-all group rounded-lg"
                >
                  <div
                    className="flex-1 min-w-0"
                    onClick={() => handleEditStory(story)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <h4 className="font-serif text-xl group-hover:text-primary transition-colors">
                        {story.title || t('story.untitled')}
                      </h4>
                      <span
                        className={`text-[8px] font-black uppercase px-1.5 py-0.5 border rounded ${
                          story.isPublished
                            ? 'border-primary text-primary bg-primary/10'
                            : 'border-muted-foreground text-muted-foreground'
                        }`}
                      >
                        {story.isPublished ? 'PUBLISHED' : 'DRAFT'}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-[10px] text-muted-foreground font-mono uppercase">
                      <span className="flex items-center gap-1">
                        <History className="w-3 h-3" />{' '}
                        {new Date(story.updatedAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <FileText className="w-3 h-3" /> {story.content.length}{' '}
                        {t('admin.characters')}
                      </span>
                      {story.photos && story.photos.length > 0 && (
                        <span className="flex items-center gap-1">
                          <ImageIcon className="w-3 h-3" /> {story.photos.length} {t('ui.photos_count')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTogglePublish(story)
                      }}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-muted"
                      title={story.isPublished ? t('story.unpublish') : t('story.publish')}
                    >
                      {story.isPublished ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditStory(story)
                      }}
                      className="p-2 text-muted-foreground hover:text-primary transition-colors rounded-md hover:bg-muted"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteStory(story.id)
                      }}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors rounded-md hover:bg-muted"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {stories.length === 0 && (
                <div className="py-24 text-center border border-dashed border-border rounded-lg">
                  <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                    {t('ui.no_story')}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col gap-4 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border pb-4 flex-shrink-0">
            <button
              onClick={() => {
                setStoryEditMode('list')
                setCurrentStory(null)
              }}
              className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest hover:text-primary transition-colors"
            >
              <ChevronLeft className="w-4 h-4" /> {t('admin.back_list')}
            </button>
            <div className="flex items-center gap-4">
              <div className="flex bg-muted p-1 border border-border rounded-md">
                <button
                  onClick={() => setStoryPreviewActive(false)}
                  className={`p-1.5 transition-all text-[10px] font-black uppercase px-3 rounded ${
                    !storyPreviewActive
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('ui.edit')}
                </button>
                <button
                  onClick={() => setStoryPreviewActive(true)}
                  className={`p-1.5 transition-all text-[10px] font-black uppercase px-3 rounded ${
                    storyPreviewActive
                      ? 'bg-background text-primary shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {t('admin.preview')}
                </button>
              </div>
              <button
                onClick={handleSaveStory}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-all disabled:opacity-50 rounded-md"
              >
                <Save className="w-4 h-4" />
                <span>{saving ? t('ui.saving') : t('admin.save')}</span>
              </button>
            </div>
          </div>

          {/* Main Content - Left/Right Layout */}
          <div className="flex-1 flex gap-4 overflow-hidden">
            {/* Left: Editor (70%) */}
            <div className="flex-[7] flex flex-col gap-4 overflow-hidden">
              {storyPreviewActive ? (
                <div className="flex-1 overflow-y-auto custom-scrollbar border border-border bg-background rounded-lg p-8 md:p-12 prose prose-invert max-w-none prose-gold prose-serif">
                  <h1 className="font-serif text-4xl md:text-5xl mb-8 border-b border-border pb-6">
                    {currentStory?.title || t('story.untitled')}
                  </h1>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {currentStory?.content || ''}
                  </ReactMarkdown>
                </div>
              ) : (
                <>
                  {/* Title Input */}
                  <CustomInput
                    variant="config"
                    type="text"
                    value={currentStory?.title || ''}
                    onChange={(e) =>
                      setCurrentStory((prev) => ({
                        ...prev!,
                        title: e.target.value,
                      }))
                    }
                    placeholder={t('story.title_placeholder')}
                    className="text-xl md:text-2xl font-serif p-4 md:p-6"
                  />
                  
                  {/* Publish Checkbox */}
                  <div className="flex items-center gap-3 px-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={currentStory?.isPublished || false}
                        onChange={(e) =>
                          setCurrentStory((prev) => ({
                            ...prev!,
                            isPublished: e.target.checked,
                          }))
                        }
                        className="w-4 h-4 accent-primary cursor-pointer rounded"
                      />
                      <span className="text-xs font-bold uppercase tracking-widest">
                        {t('ui.publish_now')}
                      </span>
                    </label>
                    <span className="text-xs text-muted-foreground">
                      {currentStory?.content?.length || 0} {t('admin.characters')}
                    </span>
                  </div>
                  
                  {/* Markdown Editor */}
                  <div className="flex-1 relative border border-border bg-card/30 rounded-lg overflow-hidden">
                    <textarea
                      value={currentStory?.content || ''}
                      onChange={(e) =>
                        setCurrentStory((prev) => ({
                          ...prev!,
                          content: e.target.value,
                        }))
                      }
                      placeholder={t('ui.markdown_placeholder')}
                      className="w-full h-full p-6 md:p-8 bg-transparent outline-none resize-none font-mono text-sm leading-relaxed custom-scrollbar"
                    />
                  </div>
                </>
              )}
            </div>

            {/* Right: Photos Panel (30%) */}
            <div className="flex-[3] flex flex-col border border-border rounded-lg bg-muted/20 overflow-hidden">
              {/* Photos Header */}
              <div className="flex items-center justify-between p-4 border-b border-border bg-background/50">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-widest">
                    {t('story.related_photos')}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({currentStory?.photos?.length || 0})
                  </span>
                </div>
                <button
                  onClick={() => setShowPhotoSelector(true)}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10 rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('admin.add_photos')}</span>
                </button>
              </div>

              {/* Photos Grid */}
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {currentStory?.photos && currentStory.photos.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2">
                    {currentStory.photos.map((photo, index) => (
                      <div
                        key={photo.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, photo.id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, photo.id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, photo.id)}
                        className={`relative group aspect-square rounded-lg overflow-hidden border-2 transition-all cursor-grab active:cursor-grabbing ${
                          dragOverPhotoId === photo.id
                            ? 'border-primary border-dashed scale-105 shadow-lg'
                            : currentStory.coverPhotoId === photo.id
                            ? 'border-primary'
                            : 'border-transparent hover:border-border'
                        } ${draggedPhotoId === photo.id ? 'opacity-50' : ''}`}
                      >
                        {/* Drag Handle Indicator */}
                        <div className="absolute top-1 right-1 z-10 p-1 bg-black/40 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          <GripVertical className="w-3 h-3 text-white" />
                        </div>
                        
                        {/* Order Number */}
                        <div className="absolute bottom-1 right-1 z-10 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                          <span className="text-[10px] font-bold text-white">{index + 1}</span>
                        </div>
                        
                        <img
                          src={resolveAssetUrl(photo.thumbnailUrl || photo.url, settings?.cdn_domain)}
                          alt={photo.title}
                          className="w-full h-full object-cover pointer-events-none"
                        />
                        
                        {/* Cover Badge */}
                        {currentStory.coverPhotoId === photo.id && (
                          <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-primary text-primary-foreground text-[8px] font-bold uppercase rounded">
                            {t('admin.cover')}
                          </div>
                        )}
                        
                        {/* Hover Actions */}
                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          {currentStory.coverPhotoId !== photo.id && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleSetCover(photo.id)
                              }}
                              className="p-1.5 bg-white/20 hover:bg-white/40 text-white rounded text-[10px] font-medium"
                              title={t('admin.set_as_cover')}
                            >
                              Cover
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemovePhoto(photo.id)
                            }}
                            className="p-1.5 bg-white/20 hover:bg-destructive text-white rounded"
                            title={t('admin.remove')}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
                    <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                    <p className="text-xs text-center mb-3">
                      {t('admin.no_photos_available')}
                    </p>
                    <button
                      onClick={() => setShowPhotoSelector(true)}
                      className="text-xs text-primary hover:underline"
                    >
                      {t('admin.add_photos')}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Photo Selector Modal */}
      {showPhotoSelector && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => {
              setShowPhotoSelector(false)
              setSelectedPhotoIds(new Set())
            }}
          />
          <div className="relative bg-background border border-border rounded-lg shadow-2xl w-full max-w-4xl max-h-[80vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-border">
              <div className="flex items-center gap-3">
                <ImageIcon className="w-5 h-5 text-primary" />
                <h3 className="font-bold">{t('admin.select_photos')}</h3>
                {selectedPhotoIds.size > 0 && (
                  <span className="px-2 py-0.5 bg-primary/10 text-primary text-xs font-medium rounded">
                    {selectedPhotoIds.size} {t('admin.selected')}
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setShowPhotoSelector(false)
                  setSelectedPhotoIds(new Set())
                }}
                className="p-2 hover:bg-muted rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {photosLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : availablePhotos.length > 0 ? (
                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {availablePhotos.map((photo) => (
                    <div
                      key={photo.id}
                      onClick={() => {
                        setSelectedPhotoIds(prev => {
                          const next = new Set(prev)
                          if (next.has(photo.id)) {
                            next.delete(photo.id)
                          } else {
                            next.add(photo.id)
                          }
                          return next
                        })
                      }}
                      className={`relative aspect-square cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                        selectedPhotoIds.has(photo.id)
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'border-transparent hover:border-border'
                      }`}
                    >
                      <img
                        src={resolveAssetUrl(photo.thumbnailUrl || photo.url, settings?.cdn_domain)}
                        alt={photo.title}
                        className="w-full h-full object-cover"
                      />
                      {selectedPhotoIds.has(photo.id) && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="w-6 h-6 bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <ImageIcon className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm">{t('admin.no_photos_available')}</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-border">
              <button
                onClick={() => {
                  setShowPhotoSelector(false)
                  setSelectedPhotoIds(new Set())
                }}
                className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleAddPhotos}
                disabled={selectedPhotoIds.size === 0}
                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-bold rounded-md hover:opacity-90 disabled:opacity-50 transition-all"
              >
                {t('admin.add')} ({selectedPhotoIds.size})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
