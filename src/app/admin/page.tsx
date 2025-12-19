'use client'

import { useEffect, useMemo, useState, useRef } from 'react'
import { 
  Upload, 
  Image as ImageIcon, 
  Settings, 
  LogOut, 
  Plus, 
  X, 
  ChevronDown, 
  Check, 
  Globe, 
  FolderTree, 
  Cloud, 
  MessageSquare,
  Search,
  Trash2,
  ExternalLink,
  Save,
  Menu,
  MoreVertical,
  LayoutGrid,
  Filter
} from 'lucide-react'
import ProtectedRoute from '@/components/ProtectedRoute'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import {
  ApiUnauthorizedError,
  deletePhoto,
  getAdminSettings,
  getCategories,
  getPhotos,
  resolveAssetUrl,
  updateAdminSettings,
  uploadPhoto,
  type AdminSettingsDto,
  type PhotoDto,
} from '@/lib/api'

function AdminDashboard() {
  const { logout, token, user } = useAuth()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('photos')
  const [settingsTab, setSettingsTab] = useState('site')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  const [categories, setCategories] = useState<string[]>([])
  const [photos, setPhotos] = useState<PhotoDto[]>([])
  const [photosLoading, setPhotosLoading] = useState(false)
  const [photosError, setPhotosError] = useState('')
  const [photoSearch, setPhotoSearch] = useState('')

  const [uploadFiles, setUploadFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadCategories, setUploadCategories] = useState<string[]>([])
  const [categoryInput, setCategoryInput] = useState('')
  const [isCategoryDropdownOpen, setIsCategoryDropdownOpen] = useState(false)
  const categoryContainerRef = useRef<HTMLDivElement>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const [uploadError, setUploadError] = useState('')

  const [settings, setSettings] = useState<AdminSettingsDto | null>(null)
  const [settingsLoading, setSettingsLoading] = useState(false)
  const [settingsSaving, setSettingsSaving] = useState(false)
  const [settingsError, setSettingsError] = useState('')

  const [uploadSource, setUploadSource] = useState('')
  const [uploadPath, setUploadPath] = useState('')

  const uploadPreviews = useMemo(() => {
    return uploadFiles.map(file => ({
      file,
      url: URL.createObjectURL(file)
    }))
  }, [uploadFiles])

  const resolvedCdnDomain = useMemo(() => settings?.cdn_domain?.trim() || undefined, [settings?.cdn_domain])

  const filteredPhotos = useMemo(() => {
    return photos.filter(p => 
      p.title.toLowerCase().includes(photoSearch.toLowerCase()) || 
      p.category.toLowerCase().includes(photoSearch.toLowerCase())
    )
  }, [photos, photoSearch])

  const filteredCategories = useMemo(() => {
    return categories.filter(c => 
      c !== '全部' && 
      c.toLowerCase().includes(categoryInput.toLowerCase()) && 
      !uploadCategories.includes(c)
    )
  }, [categories, categoryInput, uploadCategories])

  const addCategory = (cat: string) => {
    const trimmed = cat.trim()
    if (trimmed && !uploadCategories.includes(trimmed)) {
      setUploadCategories([...uploadCategories, trimmed])
    }
    setCategoryInput('')
  }

  const removeCategory = (cat: string) => {
    setUploadCategories(uploadCategories.filter(c => c !== cat))
  }

  const handleUnauthorized = () => {
    logout()
    router.push('/login')
  }

  const refreshCategories = async () => {
    try {
      const data = await getCategories()
      setCategories(data)
      if (uploadCategories.length === 0) {
        const first = data.find((c) => c && c !== '全部')
        if (first) setUploadCategories([first])
      }
    } catch {
      // optional
    }
  }

  const refreshPhotos = async () => {
    setPhotosError('')
    setPhotosLoading(true)
    try {
      const data = await getPhotos()
      setPhotos(data)
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        handleUnauthorized()
        return
      }
      setPhotosError(err instanceof Error ? err.message : '加载照片失败')
    } finally {
      setPhotosLoading(false)
    }
  }

  const refreshSettings = async () => {
    if (!token) return
    setSettingsError('')
    setSettingsLoading(true)
    try {
      const data = await getAdminSettings(token)
      setSettings(data)
      if (data.storage_provider) setUploadSource(data.storage_provider)
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        handleUnauthorized()
        return
      }
      setSettingsError(err instanceof Error ? err.message : '加载配置失败')
    } finally {
      setSettingsLoading(false)
    }
  }

  useEffect(() => {
    refreshCategories()
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryContainerRef.current && !categoryContainerRef.current.contains(event.target as Node)) {
        setIsCategoryDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    return () => {
      uploadPreviews.forEach(p => URL.revokeObjectURL(p.url))
    }
  }, [uploadPreviews])

  useEffect(() => {
    if (activeTab === 'photos') refreshPhotos()
    if (activeTab === 'settings') refreshSettings()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, token])

  const handleDelete = async (photoId: string) => {
    if (!token) return
    if (!window.confirm('确认删除这张照片吗？')) return
    try {
      await deletePhoto({ token, id: photoId })
      await refreshPhotos()
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        handleUnauthorized()
        return
      }
      setPhotosError(err instanceof Error ? err.message : '删除失败')
    }
  }

  const handleUpload = async () => {
    if (!token) return
    if (uploadFiles.length === 0) {
      setUploadError('请选择图片文件')
      return
    }
    if (uploadFiles.length === 1 && !uploadTitle.trim()) {
      setUploadError('请填写标题')
      return
    }
    if (uploadCategories.length === 0) {
      setUploadError('请选择至少一个分类')
      return
    }

    setUploadError('')
    setUploading(true)
    setUploadProgress({ current: 0, total: uploadFiles.length })
    
    try {
      for (let i = 0; i < uploadFiles.length; i++) {
        setUploadProgress(prev => ({ ...prev, current: i + 1 }))
        const file = uploadFiles[i]
        const title = uploadFiles.length === 1 ? uploadTitle.trim() : file.name.replace(/\.[^/.]+$/, "")
        
        await uploadPhoto({
          token,
          file: file,
          title: title,
          category: uploadCategories,
          storage_provider: uploadSource || undefined,
          storage_path: uploadPath.trim() || undefined,
        })
      }
      
      setUploadFiles([])
      setUploadTitle('')
      setUploadCategories([])
      setActiveTab('photos')
      await refreshPhotos()
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        handleUnauthorized()
        return
      }
      setUploadError(err instanceof Error ? err.message : '部分图片上传失败')
    } finally {
      setUploading(false)
      setUploadProgress({ current: 0, total: 0 })
    }
  }

  const handleSaveSettings = async () => {
    if (!token || !settings) return
    setSettingsError('')
    setSettingsSaving(true)
    try {
      const updated = await updateAdminSettings(token, settings)
      setSettings(updated)
    } catch (err) {
      if (err instanceof ApiUnauthorizedError) {
        handleUnauthorized()
        return
      }
      setSettingsError(err instanceof Error ? err.message : '保存失败')
    } finally {
      setSettingsSaving(false)
    }
  }

  const sidebarItems = [
    { id: 'photos', label: '照片管理', icon: ImageIcon },
    { id: 'upload', label: '上传照片', icon: Upload },
    { id: 'settings', label: '系统配置', icon: Settings },
  ]

  return (
    <div className="flex min-h-screen bg-muted/30">
      {/* Sidebar - Modern Design */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 bg-background border-r transform transition-transform duration-300 md:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold">M</div>
              <h2 className="text-lg font-bold tracking-tight">MO GALLERY</h2>
            </div>
          </div>

          <nav className="flex-1 p-4 space-y-1">
            {sidebarItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id)
                  setIsMobileMenuOpen(false)
                }}
                className={`
                  w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all
                  ${activeTab === item.id 
                    ? 'bg-primary text-primary-foreground shadow-md' 
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                `}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>

          <div className="p-4 border-t bg-muted/10">
            <div className="flex items-center space-x-3 mb-4 px-4">
              <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center text-[10px] text-white font-bold">
                {user?.username?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold truncate">{user?.username || '管理员'}</p>
                <p className="text-[10px] text-muted-foreground truncate">主管理员</p>
              </div>
            </div>
            <button
              onClick={() => {
                logout()
                router.push('/')
              }}
              className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium text-destructive hover:bg-destructive/5 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span>退出系统</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-background/80 backdrop-blur-md border-b">
          <div className="flex items-center">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 mr-4 rounded-lg md:hidden hover:bg-muted"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                {activeTab === 'photos' && '照片库管理'}
                {activeTab === 'upload' && '批量照片上传'}
                {activeTab === 'settings' && '系统全局配置'}
              </h1>
              <div className="flex items-center text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">
                <span>控制面板</span>
                <ChevronDown className="w-2 h-2 mx-1" />
                <span>{activeTab}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            {activeTab === 'photos' && (
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="搜索标题或分类..."
                  value={photoSearch}
                  onChange={(e) => setPhotoSearch(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-muted/50 border-none rounded-full text-xs focus:ring-1 focus:ring-primary w-64 transition-all"
                />
              </div>
            )}
            <button 
              onClick={() => router.push('/gallery')}
              className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors"
              title="查看前台"
            >
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-8 flex-1">
          {activeTab === 'photos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs">
                  <span className="text-muted-foreground">显示 {filteredPhotos.length} / {photos.length} 张照片</span>
                  <div className="h-4 w-px bg-border" />
                  <div className="flex items-center space-x-1 text-primary cursor-pointer hover:underline" onClick={refreshPhotos}>
                    <Globe className="w-3 h-3" />
                    <span>刷新数据</span>
                  </div>
                </div>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className="inline-flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-xl text-xs font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] transition-all"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  新增照片
                </button>
              </div>

              {photosError && (
                <div className="p-4 bg-destructive/5 border border-destructive/10 text-destructive rounded-2xl text-xs flex items-center space-x-2">
                  <X className="w-4 h-4" />
                  <span>{photosError}</span>
                </div>
              )}

              {photosLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {[...Array(10)].map((_, i) => (
                    <div key={i} className="aspect-square rounded-2xl bg-muted animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {filteredPhotos.map((photo) => (
                    <div key={photo.id} className="aspect-square rounded-2xl bg-background border p-1 group relative overflow-hidden transition-all hover:shadow-xl hover:-translate-y-1">
                      <img
                        src={resolveAssetUrl(photo.thumbnail_url || photo.url, resolvedCdnDomain)}
                        alt={photo.title}
                        className="w-full h-full object-cover rounded-[14px]"
                        loading="lazy"
                      />
                      <div className="absolute inset-x-2 bottom-2 bg-black/60 backdrop-blur-md p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                        <p className="text-[10px] text-white font-bold truncate">{photo.title}</p>
                        <p className="text-[8px] text-white/60 mb-2 truncate">{photo.category}</p>
                        <button
                          onClick={() => handleDelete(photo.id)}
                          className="w-full py-1.5 bg-red-500/80 hover:bg-red-500 text-white rounded-lg text-[10px] font-bold transition-colors flex items-center justify-center space-x-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>彻底删除</span>
                        </button>
                      </div>
                      {photo.isFeatured && (
                        <div className="absolute top-3 left-3 px-2 py-0.5 bg-yellow-400 text-yellow-950 text-[8px] font-black rounded-full shadow-sm uppercase tracking-tighter">
                          精选
                        </div>
                      )}
                    </div>
                  ))}
                  {filteredPhotos.length === 0 && (
                    <div className="col-span-full py-24 flex flex-col items-center justify-center text-muted-foreground">
                      <ImageIcon className="w-12 h-12 mb-4 opacity-10" />
                      <p className="text-xs">未发现符合条件的照片</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              <div className="lg:col-span-4 space-y-6">
                <div className="bg-background rounded-3xl border p-6 space-y-6 shadow-sm">
                  <h3 className="text-sm font-bold flex items-center space-x-2">
                    <Upload className="w-4 h-4 text-primary" />
                    <span>上传参数</span>
                  </h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">照片标题</label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        disabled={uploadFiles.length > 1}
                        className="w-full p-2.5 bg-muted/30 border rounded-xl text-sm focus:ring-1 focus:ring-primary disabled:opacity-40 transition-all"
                        placeholder={uploadFiles.length > 1 ? "多图上传将使用文件名" : "例如：落日余晖"}
                      />
                    </div>

                    <div ref={categoryContainerRef} className="relative">
                      <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">关联分类</label>
                      <div 
                        className="min-h-11 p-2 bg-muted/30 border rounded-xl flex flex-wrap gap-1.5 cursor-text items-center transition-all focus-within:ring-1 focus-within:ring-primary"
                        onClick={() => {
                          setIsCategoryDropdownOpen(true)
                          categoryContainerRef.current?.querySelector('input')?.focus()
                        }}
                      >
                        {uploadCategories.map(cat => (
                          <span key={cat} className="inline-flex items-center gap-1 px-2.5 py-1 bg-primary/10 text-primary text-[10px] font-bold rounded-lg border border-primary/20">
                            {cat}
                            <button onClick={(e) => { e.stopPropagation(); removeCategory(cat); }} className="hover:text-primary/70">
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                        <input
                          type="text"
                          value={categoryInput}
                          onChange={(e) => { setCategoryInput(e.target.value); setIsCategoryDropdownOpen(true); }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') { e.preventDefault(); if (categoryInput.trim()) addCategory(categoryInput); }
                            else if (e.key === 'Backspace' && !categoryInput && uploadCategories.length > 0) removeCategory(uploadCategories[uploadCategories.length - 1]);
                          }}
                          className="flex-1 min-w-[80px] outline-none bg-transparent text-sm"
                          placeholder={uploadCategories.length === 0 ? "搜索或创建..." : ""}
                        />
                      </div>

                      {isCategoryDropdownOpen && (
                        <div className="absolute z-10 w-full mt-2 bg-background border rounded-2xl shadow-xl max-h-48 overflow-y-auto p-1 overflow-x-hidden">
                          {filteredCategories.length > 0 ? (
                            filteredCategories.map(cat => (
                              <button
                                key={cat}
                                onClick={(e) => { e.stopPropagation(); addCategory(cat); }}
                                className="w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-xl flex items-center justify-between group"
                              >
                                <span>{cat}</span>
                                <Check className="w-3 h-3 text-primary opacity-0 group-hover:opacity-100" />
                              </button>
                            ))
                          ) : categoryInput.trim() ? (
                            <button onClick={(e) => { e.stopPropagation(); addCategory(categoryInput); }} className="w-full text-left px-3 py-2 text-xs hover:bg-primary/5 rounded-xl">
                              创建并选择 <span className="font-bold text-primary">&quot;{categoryInput}&quot;</span>
                            </button>
                          ) : (
                            <div className="px-3 py-4 text-center text-xs text-muted-foreground">暂无更多可选</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 gap-4 pt-2">
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">上传源</label>
                        <select
                          value={uploadSource}
                          onChange={(e) => setUploadSource(e.target.value)}
                          className="w-full p-2.5 bg-muted/30 border rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none"
                        >
                          <option value="local">本地存储 (Local)</option>
                          <option value="r2">Cloudflare R2</option>
                          <option value="github">GitHub</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1.5">路径前缀</label>
                        <input
                          type="text"
                          value={uploadPath}
                          onChange={(e) => setUploadPath(e.target.value)}
                          className="w-full p-2.5 bg-muted/30 border rounded-xl text-sm focus:ring-1 focus:ring-primary outline-none"
                          placeholder="例如: 2025/vacation"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <button
                      onClick={handleUpload}
                      disabled={uploading || uploadFiles.length === 0}
                      className="w-full py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-30 disabled:hover:scale-100 transition-all flex items-center justify-center space-x-2"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>正在上传 ({uploadProgress.current}/{uploadProgress.total})</span>
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          <span>开始上传任务</span>
                        </>
                      )}
                    </button>
                    {uploadError && <p className="mt-3 text-[10px] text-red-500 text-center font-medium">{uploadError}</p>}
                  </div>
                </div>
              </div>

              <div className="lg:col-span-8">
                <div 
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  className={`
                    border-2 border-dashed rounded-[32px] transition-all min-h-[500px] flex flex-col relative
                    ${isDragging ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-muted-foreground/20 bg-muted/10'}
                    ${uploadFiles.length > 0 ? 'bg-background' : ''}
                  `}
                >
                  {uploadFiles.length > 0 ? (
                    <div className="flex-1 p-6 overflow-y-auto max-h-[600px] space-y-6">
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {uploadPreviews.map((preview, idx) => (
                          <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden border-4 border-background shadow-sm bg-muted group">
                            <img src={preview.url} alt="preview" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <button 
                              onClick={() => setUploadFiles(uploadFiles.filter((_, i) => i !== idx))}
                              className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500 scale-90 group-hover:scale-100"
                            >
                              <X className="w-3 h-3" />
                            </button>
                            {uploading && uploadProgress.current > idx + 1 && (
                              <div className="absolute inset-0 bg-green-500/40 backdrop-blur-[1px] flex items-center justify-center">
                                <Check className="w-8 h-8 text-white drop-shadow-md" />
                              </div>
                            )}
                            {uploading && uploadProgress.current === idx + 1 && (
                              <div className="absolute inset-0 bg-primary/30 backdrop-blur-[1px] flex items-center justify-center">
                                <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
                              </div>
                            )}
                          </div>
                        ))}
                        {!uploading && (
                          <button 
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
                              input.onchange = (e) => setUploadFiles(prev => [...prev, ...Array.from((e.target as HTMLInputElement).files ?? [])]);
                              input.click();
                            }}
                            className="aspect-square rounded-2xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:border-primary hover:bg-primary/5 transition-all group"
                          >
                            <Plus className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="text-[10px] font-bold uppercase tracking-widest">继续添加</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-12 text-center">
                      <div className={`p-6 rounded-full bg-background shadow-xl mb-6 transition-transform duration-500 ${isDragging ? 'scale-125' : ''}`}>
                        <Upload className={`w-12 h-12 transition-colors ${isDragging ? 'text-primary' : 'text-muted-foreground/40'}`} />
                      </div>
                      <h4 className="text-lg font-bold mb-2">拖拽图片到这里</h4>
                      <p className="text-sm text-muted-foreground max-w-xs">支持 JPG, PNG, WEBP 等格式，您可以一次性拖入多张照片。</p>
                      <button 
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file'; input.accept = 'image/*'; input.multiple = true;
                          input.onchange = (e) => setUploadFiles(prev => [...prev, ...Array.from((e.target as HTMLInputElement).files ?? [])]);
                          input.click();
                        }}
                        className="mt-8 px-6 py-2.5 bg-background border rounded-full text-xs font-bold hover:bg-muted transition-colors shadow-sm"
                      >
                        选择本地文件
                      </button>
                    </div>
                  )}
                  {uploading && (
                    <div className="p-6 bg-background/80 backdrop-blur-md border-t rounded-b-[32px]">
                      <div className="flex justify-between text-xs font-bold mb-2">
                        <span className="flex items-center space-x-2">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>正在执行上传队列...</span>
                        </span>
                        <span>{Math.round((uploadProgress.current / uploadProgress.total) * 100)}%</span>
                      </div>
                      <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div 
                          className="h-full bg-primary" 
                          initial={{ width: 0 }}
                          animate={{ width: `${(uploadProgress.current / uploadProgress.total) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="max-w-6xl">
              <div className="flex flex-col md:flex-row gap-8">
                {/* Settings Sidebar - Pills */}
                <aside className="w-full md:w-56 space-y-1">
                  <div className="mb-4 px-4 py-2">
                    <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">配置分类</h4>
                  </div>
                  {[
                    { id: 'site', label: '网站设置', icon: Globe },
                    { id: 'categories', label: '分类管理', icon: FolderTree },
                    { id: 'storage', label: '上传源配置', icon: Cloud },
                    { id: 'comments', label: '评论管理', icon: MessageSquare },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSettingsTab(tab.id)}
                      className={`
                        w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl text-xs font-bold transition-all
                        ${settingsTab === tab.id ? 'bg-primary/10 text-primary border-r-4 border-primary' : 'text-muted-foreground hover:bg-muted'}
                      `}
                    >
                      <tab.icon className="w-4 h-4" />
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </aside>

                {/* Settings Panel */}
                <div className="flex-1 bg-background rounded-[32px] border p-8 shadow-sm min-h-[500px] flex flex-col">
                  {settingsError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-xs flex items-center space-x-2">
                      <X className="w-4 h-4" />
                      <span>{settingsError}</span>
                    </div>
                  )}

                  {settingsLoading || !settings ? (
                    <div className="flex-1 flex items-center justify-center text-muted-foreground text-xs italic">正在加载配置...</div>
                  ) : (
                    <div className="flex-1 space-y-8">
                      {settingsTab === 'site' && (
                        <div className="max-w-2xl space-y-6">
                          <div className="pb-2 border-b">
                            <h3 className="text-base font-bold">基础信息</h3>
                            <p className="text-xs text-muted-foreground mt-1">设置您的站点名称及全局 CDN 优化。</p>
                          </div>
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">站点标题</label>
                                <input
                                  type="text"
                                  value={settings.site_title}
                                  onChange={(e) => setSettings({ ...settings, site_title: e.target.value })}
                                  className="w-full p-3 bg-muted/30 border rounded-2xl text-sm focus:ring-2 focus:ring-primary transition-all outline-none"
                                  placeholder="我的摄影集"
                                />
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">CDN 边缘域名</label>
                                <input
                                  type="text"
                                  value={settings.cdn_domain}
                                  onChange={(e) => setSettings({ ...settings, cdn_domain: e.target.value })}
                                  placeholder="https://cdn.your-gallery.com"
                                  className="w-full p-3 bg-muted/30 border rounded-2xl text-sm focus:ring-2 focus:ring-primary transition-all outline-none"
                                />
                                <p className="text-[10px] text-muted-foreground px-1 italic">为空则默认使用 API 地址作为静态资源根目录。</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {settingsTab === 'categories' && (
                        <div className="space-y-6">
                          <div className="pb-2 border-b">
                            <h3 className="text-base font-bold">全部分类</h3>
                            <p className="text-xs text-muted-foreground mt-1">管理系统中的所有预设分类，删除分类不会删除相关照片。</p>
                          </div>
                          <div className="flex flex-wrap gap-2.5">
                            {categories.map(cat => (
                              <div key={cat} className="flex items-center space-x-2 px-3.5 py-1.5 bg-background border rounded-full text-xs font-medium shadow-sm hover:shadow-md transition-all group">
                                <span>{cat}</span>
                                {cat !== '全部' && (
                                  <button className="text-muted-foreground hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            ))}
                            <button className="flex items-center space-x-1 px-3.5 py-1.5 bg-primary/5 text-primary rounded-full text-xs font-bold hover:bg-primary/10 border border-primary/20">
                              <Plus className="w-3.5 h-3.5" />
                              <span>快速添加</span>
                            </button>
                          </div>
                        </div>
                      )}

                      {settingsTab === 'storage' && (
                        <div className="max-w-2xl space-y-6">
                          <div className="pb-2 border-b">
                            <h3 className="text-base font-bold">多源存储引擎</h3>
                            <p className="text-xs text-muted-foreground mt-1">配置第三方存储引擎凭据，建议使用云存储以获得更好的访问速度。</p>
                          </div>
                          
                          <div className="space-y-6">
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest px-1">当前默认提供商</label>
                              <div className="flex p-1 bg-muted/50 rounded-2xl w-fit">
                                {['local', 'r2', 'github'].map(p => (
                                  <button
                                    key={p}
                                    onClick={() => setSettings({ ...settings, storage_provider: p })}
                                    className={`
                                      px-5 py-2 rounded-xl text-xs font-bold transition-all
                                      ${settings.storage_provider === p ? 'bg-background shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}
                                    `}
                                  >
                                    {p.toUpperCase()}
                                  </button>
                                ))}
                              </div>
                            </div>

                            {settings.storage_provider === 'r2' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-blue-50/30 border border-blue-100 rounded-[24px]">
                                <div className="md:col-span-2 space-y-1.5">
                                  <label className="text-[9px] font-black uppercase text-blue-600 px-1">R2 S3 Endpoint</label>
                                  <input
                                    type="text"
                                    value={settings.r2_endpoint ?? ''}
                                    onChange={(e) => setSettings({ ...settings, r2_endpoint: e.target.value })}
                                    className="w-full p-2.5 bg-background border rounded-xl text-xs focus:ring-2 focus:ring-blue-400 outline-none"
                                    placeholder="https://<id>.r2.cloudflarestorage.com"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black uppercase text-blue-600 px-1">Access Key</label>
                                  <input
                                    type="text"
                                    value={settings.r2_access_key_id ?? ''}
                                    onChange={(e) => setSettings({ ...settings, r2_access_key_id: e.target.value })}
                                    className="w-full p-2.5 bg-background border rounded-xl text-xs focus:ring-2 focus:ring-blue-400 outline-none"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black uppercase text-blue-600 px-1">Secret Key</label>
                                  <input
                                    type="password"
                                    value={settings.r2_secret_access_key ?? ''}
                                    onChange={(e) => setSettings({ ...settings, r2_secret_access_key: e.target.value })}
                                    className="w-full p-2.5 bg-background border rounded-xl text-xs focus:ring-2 focus:ring-blue-400 outline-none"
                                    placeholder="••••••••••••"
                                  />
                                </div>
                                <div className="md:col-span-2 space-y-1.5">
                                  <label className="text-[9px] font-black uppercase text-blue-600 px-1">Bucket Name</label>
                                  <input
                                    type="text"
                                    value={settings.r2_bucket ?? ''}
                                    onChange={(e) => setSettings({ ...settings, r2_bucket: e.target.value })}
                                    className="w-full p-2.5 bg-background border rounded-xl text-xs focus:ring-2 focus:ring-blue-400 outline-none"
                                  />
                                </div>
                              </div>
                            )}

                            {settings.storage_provider === 'github' && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-6 bg-slate-50 border border-slate-200 rounded-[24px]">
                                <div className="md:col-span-2 space-y-1.5">
                                  <label className="text-[9px] font-black uppercase text-slate-600 px-1">Personal Access Token</label>
                                  <input
                                    type="password"
                                    value={settings.github_token ?? ''}
                                    onChange={(e) => setSettings({ ...settings, github_token: e.target.value })}
                                    className="w-full p-2.5 bg-background border rounded-xl text-xs focus:ring-2 focus:ring-slate-400 outline-none"
                                    placeholder="ghp_••••••••••••"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black uppercase text-slate-600 px-1">Repository (owner/repo)</label>
                                  <input
                                    type="text"
                                    value={settings.github_repo ?? ''}
                                    onChange={(e) => setSettings({ ...settings, github_repo: e.target.value })}
                                    className="w-full p-2.5 bg-background border rounded-xl text-xs focus:ring-2 focus:ring-slate-400 outline-none"
                                    placeholder="username/storage"
                                  />
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[9px] font-black uppercase text-slate-600 px-1">Store Path</label>
                                  <input
                                    type="text"
                                    value={settings.github_path ?? ''}
                                    onChange={(e) => setSettings({ ...settings, github_path: e.target.value })}
                                    className="w-full p-2.5 bg-background border rounded-xl text-xs focus:ring-2 focus:ring-slate-400 outline-none"
                                    placeholder="images"
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {settingsTab === 'comments' && (
                        <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center">
                            <MessageSquare className="w-8 h-8 text-muted-foreground opacity-20" />
                          </div>
                          <div className="text-center">
                            <h4 className="text-sm font-bold">评论管理模块</h4>
                            <p className="text-xs text-muted-foreground mt-1">此功能正在内部开发测试中，敬请期待。</p>
                          </div>
                        </div>
                      )}

                      <div className="pt-8 border-t flex justify-end">
                        <button
                          onClick={handleSaveSettings}
                          disabled={settingsSaving}
                          className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl text-sm font-bold shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all flex items-center space-x-2"
                        >
                          {settingsSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                          <span>保存全局配置</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
    </svg>
  )
}

export default function AdminPage() {
  return (
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  )
}
