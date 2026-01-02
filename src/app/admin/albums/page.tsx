'use client'

import { useAdmin } from '../layout'
import { AlbumsTab } from '@/components/admin/AlbumsTab'
import { useSettings } from '@/contexts/SettingsContext'

export default function AlbumsPage() {
  const {
    token,
    photos,
    t,
    notify,
    handleUnauthorized,
    setSelectedPhoto: onPreview,
  } = useAdmin()
  const { settings } = useSettings()
  const cdnDomain = settings?.cdn_domain || ''

  return (
    <AlbumsTab
      token={token}
      photos={photos}
      cdnDomain={cdnDomain}
      t={t}
      notify={notify}
      onUnauthorized={handleUnauthorized}
      onPreview={onPreview}
    />
  )
}
