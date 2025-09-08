// src/components/StorageBadge.tsx
import React from 'react'
import { getStorageKind } from '../data'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'

export default function StorageBadge() {
  const auth = useSupabaseAuth()
  const [kind, setKind] = React.useState(getStorageKind())

  // Re-check when auth state changes
  React.useEffect(() => {
    setKind(getStorageKind())
  }, [auth.ready, auth.userId])

  const isCloud = !!(auth.ready && auth.userId)
  const label = isCloud ? 'Cloud' : 'Local'
  const title = isCloud
    ? 'Saving to cloud (Supabase)'
    : 'Saving on this device (local storage)'

  return (
    <span className="storage-badge" title={title} aria-live="polite">
      <span className={`storage-badge__dot ${isCloud ? 'is-cloud' : 'is-local'}`} />
      <span className="storage-badge__text">Storage: {label}</span>
    </span>
  )
}
