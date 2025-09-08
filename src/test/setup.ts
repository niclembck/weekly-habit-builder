// src/test/setup.ts
import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Make matchMedia exist (some components / libs expect it)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),            // deprecated
    removeListener: vi.fn(),         // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock our Supabase client to avoid real network/auth in tests
vi.mock('../lib/supabaseClient', () => {
  return {
    supabase: {
      from: () => ({
        select: () => ({ eq: () => ({ maybeSingle: async () => ({ data: null, error: null }) }) }),
        upsert: async () => ({ data: null, error: null }),
      }),
      auth: {
        getUser: async () => ({ data: { user: null }, error: null }),
        signOut: async () => ({ error: null }),
      },
    },
  }
})

// Mock the auth hook so app thinks cloud is “not ready” in tests (keeps it in local-only path)
vi.mock('../hooks/useSupabaseAuth', () => {
  return {
    useSupabaseAuth: () => ({
      ready: false,
      userId: null,
      signOut: async () => {},
    }),
  }
})