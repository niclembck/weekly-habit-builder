// src/data/index.ts
import { LocalStorageProvider } from './localStorageProvider'
import { SupabaseProvider } from './supabaseProvider'
import type { StorageProvider } from './storage'

let _kind: 'cloud' | 'local' = 'local'

export function getStorage(): StorageProvider {
  const supa = SupabaseProvider?.() // will be null if not configured or not authed
  if (supa) {
    _kind = 'cloud'
    return supa
  }
  _kind = 'local'
  return LocalStorageProvider()
}

export function getStorageKind(): 'cloud' | 'local' {
  return _kind
}
