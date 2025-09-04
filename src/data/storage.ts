// src/data/storage.ts
import type { Day, DayEntry, Settings } from '../types'

export type WeekPayload = {
  weekStartISO: string
  week: Record<Day, DayEntry>
  updatedAt: string
}

export interface StorageProvider {
  // Settings
  getSettings(): Promise<Settings | null>
  saveSettings(s: Settings): Promise<void>

  // Week data keyed by week start (ISO date, start-of-week)
  getWeek(weekStartISO: string): Promise<WeekPayload | null>
  saveWeek(data: WeekPayload): Promise<void>

  // Optional: list of week keys (for calendars/insights)
  listWeeks?(sinceISO: string, untilISO: string): Promise<string[]>
}
