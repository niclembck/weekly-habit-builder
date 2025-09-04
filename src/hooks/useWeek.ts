// src/hooks/useWeek.ts
import * as React from 'react'
import type { Day, Settings, DayEntry } from '../types'
import { supabase } from '../lib/supabaseClient'
import { useSupabaseAuth } from './useSupabaseAuth'

export const DAYS: Day[] = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

function isValidDate(v: any): v is Date { return v instanceof Date && !isNaN(v.getTime()) }
function coerceDate(v: any): Date { if (isValidDate(v)) return v; const d = new Date(v); return isNaN(d.getTime()) ? new Date() : d }
function startOfWeekMonday(d: Date) { const x = new Date(d); const day = x.getDay() || 7; if (day !== 1) x.setDate(x.getDate() - (day - 1)); x.setHours(0,0,0,0); return x }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x }
function getWeekDates(weekStart: Date): Record<Day, Date> { const out = {} as Record<Day, Date>; DAYS.forEach((d,i)=>{ out[d]=addDays(weekStart,i) }); return out }

function loadJSON<T>(key: string): T | undefined { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T : undefined } catch { return undefined } }
function saveJSON(key: string, value: unknown) { try { localStorage.setItem(key, JSON.stringify(value)) } catch {} }

const DEFAULT_SETTINGS: Settings = {
  defaults: { morning: 'Prototype 4-track', midday: 'Freelance UX', activity: 'Run', useTemplatesFirst: true },
  patterns: {},
  templates: [],
  projects: ['Prototype 4-track','Freelance UX','Music Practice','Linocut Book'],
  activityColors: { Run: '#888', Yoga: '#888', Strength: '#888' },
  projectEmojis: { 'Prototype 4-track':'🧪', 'Freelance UX':'💼', 'Music Practice':'🎸', 'Linocut Book':'📗' },
  activityEmojis: { Run:'🏃', Yoga:'🧘', Strength:'🏋️' },
  suggestedSlots: { morning:{start:'08:00',end:'10:00'}, midday:{start:'13:00',end:'15:00'}, activity:{start:'17:00',end:'18:00'} },
  theme: 'blue', dark: true,
}
function withSettingDefaults(s: Partial<Settings> | undefined): Settings {
  return {
    ...DEFAULT_SETTINGS, ...s,
    suggestedSlots: { ...DEFAULT_SETTINGS.suggestedSlots, ...(s?.suggestedSlots ?? {}) },
    activityColors: { ...DEFAULT_SETTINGS.activityColors, ...(s?.activityColors ?? {}) },
    projectEmojis: { ...DEFAULT_SETTINGS.projectEmojis, ...(s?.projectEmojis ?? {}) },
    activityEmojis: { ...DEFAULT_SETTINGS.activityEmojis, ...(s?.activityEmojis ?? {}) },
  }
}

function emptyDayEntry(): DayEntry {
  return {
    morningProject:'', middayProject:'', activity:'',
    doneMorning:false, doneMidday:false, doneActivity:false,
    morningNotes:'', middayNotes:'', activityNotes:'', gratitude:'', notes:'', mood:null, therapy:false,
    morningActualStart:'', morningActualEnd:'', middayActualStart:'', middayActualEnd:'', activityActualStart:'', activityActualEnd:''
  }
}
function makeEmptyWeek(): Record<Day, DayEntry> { const w = {} as Record<Day, DayEntry>; for (const d of DAYS) w[d]=emptyDayEntry(); return w }

export function applyDefaultsAndPatterns(prev: Record<Day, DayEntry>, _dates: Record<Day, Date>, settings: Settings) {
  if (!settings.projects?.length) return prev
  const first = settings.projects[0]
  const firstActivity = Object.keys(settings.activityColors || {})[0]
  const out: Record<Day, DayEntry> = JSON.parse(JSON.stringify(prev))
  for (const d of DAYS) {
    const e = out[d]
    if (!e.morningProject) e.morningProject = first
    if (!e.middayProject)  e.middayProject  = first
    if (!e.activity && firstActivity) e.activity = firstActivity
  }
  return out
}
export function fillBlanksWithSettings(week: Record<Day, DayEntry>, _dates: Record<Day, Date>, settings: Settings) {
  const first = settings.projects?.[0]
  const firstActivity = Object.keys(settings.activityColors || {})[0]
  if (!first && !firstActivity) return { changed:false, next:week }
  let changed = false
  const next: Record<Day, DayEntry> = JSON.parse(JSON.stringify(week))
  for (const d of DAYS) {
    const e = next[d]
    if (!e.morningProject && first) { e.morningProject = first; changed = true }
    if (!e.middayProject  && first) { e.middayProject  = first; changed = true }
    if (!e.activity && firstActivity) { e.activity = firstActivity; changed = true }
  }
  return { changed, next }
}

export type WeekTemplate = { id: string; name: string; days: Partial<Record<Day, Partial<DayEntry>>>; createdAt?: string }
function isBlank(v: unknown) { return v == null || (typeof v === 'string' && v.trim() === '') }

export function applyTemplateToWeek(
  week: Record<Day, DayEntry>,
  tpl: { id: string; name: string; days?: Partial<Record<Day, Partial<DayEntry>>> },
  opts: { overwrite: boolean; scope: 'entire'|'weekdays'|'weekends' }
): Record<Day, DayEntry> {
  const isWeekend = (d: Day) => d === 'Saturday' || d === 'Sunday'
  const inScope = (d: Day) => opts.scope === 'entire' ? true : opts.scope === 'weekdays' ? !isWeekend(d) : isWeekend(d)
  const next: Record<Day, DayEntry> = JSON.parse(JSON.stringify(week))
  for (const d of DAYS) {
    if (!inScope(d)) continue
    const patch = tpl.days?.[d]
    if (!patch) continue
    if (opts.overwrite) next[d] = { ...next[d], ...patch }
    else {
      const e = next[d]
      for (const k of Object.keys(patch) as (keyof DayEntry)[]) {
        const v = patch[k]
        const isEmpty = (x: any) => x == null || (typeof x === 'string' && x.trim() === '')
        if (isEmpty((e as any)[k])) (e as any)[k] = v as any
      }
    }
  }
  return next
}

export function captureWeekAsTemplate(week: Record<Day, DayEntry>, opts?: { name?: string; scope?: 'entire'|'weekdays'|'weekends'; includeNotes?: boolean }): WeekTemplate {
  const name = opts?.name || 'My Template'
  const scope = opts?.scope || 'entire'
  const includeNotes = !!opts?.includeNotes
  const isWeekend = (d: Day) => d === 'Saturday' || d === 'Sunday'
  const inScope = (d: Day) => scope === 'entire' ? true : scope === 'weekdays' ? !isWeekend(d) : isWeekend(d)
  const days: Partial<Record<Day, Partial<DayEntry>>> = {}
  for (const d of DAYS) {
    if (!inScope(d)) continue
    const e = week[d]; if (!e) continue
    const pick: Partial<DayEntry> = {}
    if (!isBlank(e.morningProject)) pick.morningProject = e.morningProject
    if (!isBlank(e.middayProject))  pick.middayProject = e.middayProject
    if (!isBlank(e.activity))       pick.activity      = e.activity
    if (e.doneMorning)  pick.doneMorning  = true
    if (e.doneMidday)   pick.doneMidday   = true
    if (e.doneActivity) pick.doneActivity = true
    if (!isBlank(e.morningActualStart)) pick.morningActualStart = e.morningActualStart
    if (!isBlank(e.morningActualEnd))   pick.morningActualEnd   = e.morningActualEnd
    if (!isBlank(e.middayActualStart))  pick.middayActualStart  = e.middayActualStart
    if (!isBlank(e.middayActualEnd))    pick.middayActualEnd    = e.middayActualEnd
    if (!isBlank(e.activityActualStart)) pick.activityActualStart = e.activityActualStart
    if (!isBlank(e.activityActualEnd))   pick.activityActualEnd   = e.activityActualEnd
    if (includeNotes) {
      if (!isBlank(e.morningNotes))  pick.morningNotes  = e.morningNotes
      if (!isBlank(e.middayNotes))   pick.middayNotes   = e.middayNotes
      if (!isBlank(e.activityNotes)) pick.activityNotes = e.activityNotes
      if (!isBlank(e.gratitude))     pick.gratitude     = e.gratitude
      if (!isBlank(e.notes))         pick.notes         = e.notes
      if (typeof e.mood === 'number') pick.mood = e.mood
    }
    if (Object.keys(pick).length) days[d] = pick
  }
  return { id: 'tpl_' + Math.random().toString(36).slice(2, 8), name, days, createdAt: new Date().toISOString() }
}

// ----------------------------- useWeek
export function useWeek() {
  const auth = useSupabaseAuth()

  const [weekStart, setWeekStartState] = React.useState<Date>(() => {
    const saved = loadJSON<string>('whb_weekStart')
    return startOfWeekMonday(saved ? coerceDate(saved) : new Date())
  })
  function setWeekStart(next: Date | string | number) { setWeekStartState(startOfWeekMonday(coerceDate(next))) }
  React.useEffect(() => { saveJSON('whb_weekStart', weekStart.toISOString()) }, [weekStart])

  const weekStartISO = React.useMemo(() => weekStart.toISOString().slice(0,10), [weekStart])
  const dates = React.useMemo(() => getWeekDates(weekStart), [weekStart])

  const [settings, setSettings] = React.useState<Settings>(() => withSettingDefaults(loadJSON<Settings>('whb_settings')))
  const [week, setWeek] = React.useState<Record<Day, DayEntry>>(() => {
    const iso = startOfWeekMonday(new Date()).toISOString().slice(0,10)
    return loadJSON<Record<Day, DayEntry>>(`whb_week_${iso}`) || makeEmptyWeek()
  })
  React.useEffect(() => { setWeek(loadJSON<Record<Day, DayEntry>>(`whb_week_${weekStartISO}`) || makeEmptyWeek()) }, [weekStartISO])

  // SETTINGS: pull then initial insert if missing
  React.useEffect(() => {
    if (!auth.ready || !auth.userId) return
    let cancelled = false
    ;(async () => {
      const { data, error } = await supabase.from('settings').select('data').eq('user_id', auth.userId).maybeSingle()
      if (cancelled) return
      if (error && error.code !== 'PGRST116') console.error('Load settings error', error)
      if (data?.data) {
        setSettings(prev => withSettingDefaults({ ...prev, ...data.data }))
      } else {
        const toInsert = withSettingDefaults(settings)
        await supabase.from('settings').upsert({ user_id: auth.userId, data: toInsert }, { onConflict: 'user_id' })
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth.ready, auth.userId])

  // SETTINGS: save (local + remote, debounced)
  React.useEffect(() => {
    saveJSON('whb_settings', settings)
    if (!auth.ready || !auth.userId) return
    const t = setTimeout(async () => {
      await supabase.from('settings').upsert({ user_id: auth.userId, data: settings }, { onConflict: 'user_id' })
    }, 400)
    return () => clearTimeout(t)
  }, [settings, auth.ready, auth.userId])

  // WEEK: pull then initial insert if missing (for current week)
  React.useEffect(() => {
    if (!auth.ready || !auth.userId) return
    let cancelled = false
    ;(async () => {
      const week_start = weekStartISO
      const { data, error } = await supabase
        .from('weeks')
        .select('week_data')
        .eq('user_id', auth.userId)
        .eq('week_start', week_start)
        .maybeSingle()

      if (cancelled) return
      if (error && error.code !== 'PGRST116') console.error('Load week error', error)

      if (data?.week_data) {
        setWeek(data.week_data)
        saveJSON(`whb_week_${week_start}`, data.week_data)
      } else {
        const empty = makeEmptyWeek()
        await supabase.from('weeks').upsert(
          { user_id: auth.userId, week_start, week_data: empty },
          { onConflict: 'user_id,week_start' }
        )
        setWeek(empty)
        saveJSON(`whb_week_${week_start}`, empty)
      }
    })()
    return () => { cancelled = true }
  }, [auth.ready, auth.userId, weekStartISO])

  // WEEK: save (local + remote, debounced)
  React.useEffect(() => {
    saveJSON(`whb_week_${weekStartISO}`, week)
    if (!auth.ready || !auth.userId) return
    const week_start = weekStartISO
    const t = setTimeout(async () => {
      await supabase.from('weeks').upsert(
        { user_id: auth.userId, week_start, week_data: week },
        { onConflict: 'user_id,week_start' }
      )
    }, 400)
    return () => clearTimeout(t)
  }, [week, auth.ready, auth.userId, weekStartISO])

  function ensureActivityInSettings(name?: string) {
    const label = (name || '').trim()
    if (!label) return
    if (settings.activityColors[label]) return
    setSettings(prev => ({ ...prev, activityColors: { ...prev.activityColors, [label]: '#888' } }))
  }

  return { settings, setSettings, weekStart, setWeekStart, week, setWeek, dates, ensureActivityInSettings }
}

export default useWeek
