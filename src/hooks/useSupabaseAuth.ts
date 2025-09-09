import * as React from 'react'
import { supabase } from '../lib/supabaseClient'

export function useSupabaseAuth() {
  const [ready, setReady] = React.useState(false)
  const [userId, setUserId] = React.useState<string | null>(null)

  React.useEffect(() => {
    let mounted = true

    async function ensureSession() {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        // Anonymous sign-in (creates a user behind the scenes)
        const { data, error } = await supabase.auth.signInAnonymously()
        if (error) console.error('Anon sign-in error:', error)
        if (mounted) setUserId(data?.user?.id ?? null)
      } else {
        if (mounted) setUserId(session.user?.id ?? null)
      }
      if (mounted) setReady(true)
    }

    ensureSession()

    const { data: sub } = supabase.auth.onAuthStateChange((_evt, sess) => {
      if (!mounted) return
      setUserId(sess?.user?.id ?? null)
      setReady(true)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  return { ready, userId }
}
