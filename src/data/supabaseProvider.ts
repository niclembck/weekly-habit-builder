// src/data/supabaseProvider.ts
import { supabase } from '../lib/supabaseClient'
import type { StorageProvider, WeekPayload } from './storage'
import type { Settings } from '../types'

/**
 * NOTE:
 * - This assumes you’ll enable Supabase Auth soon.
 * - For now, if not authenticated, this provider returns null (caller falls back to local).
 * - Tables you'll want:
 *   - settings(user_id pk, data jsonb, updated_at)
 *   - weeks(user_id, week_start_iso pk, data jsonb, updated_at)
 *   with simple RLS: auth.uid() = user_id
 */
async function getUserId(): Promise<string | null> {
  if (!supabase) return null
  const { data } = await supabase.auth.getUser()
  return data.user?.id || null
}

export const SupabaseProvider = (): StorageProvider | null => {
  if (!supabase) return null

  return {
    async getSettings() {
      const uid = await getUserId(); if (!uid) return null
      const { data, error } = await supabase
        .from('settings')
        .select('data')
        .eq('user_id', uid)
        .maybeSingle()
      if (error) { console.error(error); return null }
      return (data?.data as Settings) ?? null
    },

    async saveSettings(s: Settings) {
      const uid = await getUserId(); if (!uid) return
      const { error } = await supabase.from('settings')
        .upsert({ user_id: uid, data: s, updated_at: new Date().toISOString() })
      if (error) console.error(error)
    },

    async getWeek(weekStartISO: string) {
      const uid = await getUserId(); if (!uid) return null
      const { data, error } = await supabase
        .from('weeks')
        .select('data, updated_at')
        .eq('user_id', uid)
        .eq('week_start_iso', weekStartISO)
        .maybeSingle()
      if (error) { console.error(error); return null }
      if (!data) return null
      return { weekStartISO, week: data.data, updatedAt: data.updated_at }
    },

    async saveWeek({ weekStartISO, week }: WeekPayload) {
      const uid = await getUserId(); if (!uid) return
      const { error } = await supabase.from('weeks').upsert({
        user_id: uid,
        week_start_iso: weekStartISO,
        data: week,
        updated_at: new Date().toISOString(),
      })
      if (error) console.error(error)
    },

    async listWeeks(sinceISO: string, untilISO: string) {
      const uid = await getUserId(); if (!uid) return []
      const { data, error } = await supabase
        .from('weeks')
        .select('week_start_iso')
        .eq('user_id', uid)
        .gte('week_start_iso', sinceISO)
        .lte('week_start_iso', untilISO)
      if (error) { console.error(error); return [] }
      return (data || []).map(r => r.week_start_iso)
    },
  }
}
