// src/data/localStorageProvider.ts
import type { Settings } from '../types'
import type { StorageProvider, WeekPayload } from './storage'

const KEY_SETTINGS = 'whb_settings'
const KEY_WEEKSTART = 'whb_weekStart' // we keep this locally so routing stays snappy
const KEY_WEEK = (iso: string) => `whb_week_${iso}`

// Lightweight helpers
function loadJSON<T>(key: string): T | null {
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : null } catch { return null }
}
function saveJSON(key: string, value: unknown) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

export const LocalStorageProvider = (): StorageProvider => ({
  async getSettings() {
    return loadJSON<Settings>(KEY_SETTINGS)
  },
  async saveSettings(s) {
    saveJSON(KEY_SETTINGS, s)
  },
  async getWeek(weekStartISO) {
    const week = loadJSON<Record<string, any>>(KEY_WEEK(weekStartISO))
    if (!week) return null
    return { weekStartISO, week: week as any, updatedAt: new Date().toISOString() }
  },
  async saveWeek({ weekStartISO, week }) {
    saveJSON(KEY_WEEK(weekStartISO), week)
  },
  async listWeeks(sinceISO: string, untilISO: string) {
    const keys = Object.keys(localStorage).filter(k => k.startsWith('whb_week_'))
    const isInRange = (iso: string) => iso >= sinceISO && iso <= untilISO
    return keys.map(k => k.replace('whb_week_', '')).filter(isInRange)
  },
})

// Expose these small helpers if you want to keep local weekStart in sync
export const LocalKeys = { KEY_SETTINGS, KEY_WEEKSTART, KEY_WEEK, loadJSON, saveJSON }
