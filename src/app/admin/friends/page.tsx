'use client'

import { FriendsTab } from '../FriendsTab'
import { useAdmin } from '../layout'

export default function FriendsPage() {
  const { t, notify } = useAdmin()

  return <FriendsTab t={t} notify={notify} />
}