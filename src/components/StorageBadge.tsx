// src/components/StorageBadge.tsx
import React from 'react'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'

export default function StorageBadge() {
  const auth = useSupabaseAuth()

  // While auth is initializing, show a neutral "…" state
  const isReady = auth.ready
  const isCloud = isReady && !!auth.userId

  const label = isReady ? (isCloud ? 'Cloud' : 'Local') : '…'
  const title = !isReady
    ? 'Checking storage…'
    : isCloud
      ? 'Saving to cloud (Supabase)'
      : 'Saving on this device (local storage)'

  return (
    <span className="storage-badge" title={title} aria-live="polite">
      <span
        className={[
          'storage-badge__dot',
          !isReady ? 'is-loading' : isCloud ? 'is-cloud' : 'is-local',
        ].join(' ')}
      />
      <span className="storage-badge__text">Storage: {label}</span>
    </span>
  )
}
