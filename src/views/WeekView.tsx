// src/views/WeekView.tsx
import React from 'react'
import {
  useWeek, DAYS, applyDefaultsAndPatterns,
  fillBlanksWithSettings, applyTemplateToWeek
} from '../hooks/useWeek'
import { Day } from '../types'
import Dashboard from '../components/Dashboard'
import { useProgress } from '../hooks/useProgress'
import ToastStack, { useToasts } from '../components/ToastStack'
import DayCard from '../components/DayCard'
import WeeklySetupWizard from '../components/WeeklySetupWizard'
import DayChip from '../components/DayChip'
import ApplyTemplateModal, { ApplyOptions } from '../components/ApplyTemplateModal'
import { useSearchParams } from 'react-router-dom'
import { useToday } from '../hooks/useToday'
import { countObjectives } from '../utils/countObjectives'
import WeekDatePicker from '../components/WeekDatePicker'
import MonthMini from '../components/MonthMini'

export default function WeekView() {
  const SHOW_WEEK_INSIGHTS = false
  const SHOW_PLANNER_TOOLS = false
  const SHOW_SETUP_BANNER = false
  const ENABLE_SETUP_WIZARD = false

  const [setupOpen, setSetupOpen] = React.useState(false)

  const { items } = useToasts()
  const { countedDays, bestStreak, updateFromWeek, currentStreak } = useProgress()
  const { settings, weekStart, week, setWeek, dates, ensureActivityInSettings, setWeekStart } = useWeek()
  ;(window as any).__WHB_WEEK__ = week

  // Auto-fill brand-new blank weeks
  React.useEffect(() => {
    const blank = Object.values(week).every((e: any) => !(e?.morningProject || e?.middayProject || e?.activity))
    if (blank) setWeek(prev => applyDefaultsAndPatterns(prev, dates as any, settings))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekStart])

  // Progress
  React.useEffect(() => {
    updateFromWeek(week, dates as any)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [week, dates])

  // Counts memo
  const countsByDay = React.useMemo(() => {
    const map = {} as Record<Day, { completed: number; total: number; pct: number }>
    for (const d of DAYS) map[d] = countObjectives((week as any)[d])
    return map
  }, [week])

  // Today & selection
  const todayDay = useToday(dates)
  const [selectedDay, setSelectedDay] = React.useState<Day>(todayDay)
  React.useEffect(() => { setSelectedDay(todayDay) }, [todayDay])

  // Keyboard nav
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const i = DAYS.indexOf(selectedDay)
      if (e.key === 'ArrowRight') { e.preventDefault(); setSelectedDay(DAYS[Math.min(DAYS.length - 1, i + 1)]) }
      else if (e.key === 'ArrowLeft') { e.preventDefault(); setSelectedDay(DAYS[Math.max(0, i - 1)]) }
      else if (e.key === 'Home') { e.preventDefault(); setSelectedDay(DAYS[0]) }
      else if (e.key === 'End') { e.preventDefault(); setSelectedDay(DAYS[DAYS.length - 1]) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [selectedDay])

  // URL persistence (?day=Wednesday)
  const [search, setSearch] = useSearchParams()
  // READ once on mount
  React.useEffect(() => {
    const q = search.get('day')
    if (q && DAYS.includes(q as any)) setSelectedDay(q as Day)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  // WRITE when selection changes (compare first to avoid loops)
  React.useEffect(() => {
    const current = new URLSearchParams(window.location.search).get('day')
    if (current !== selectedDay) {
      const next = new URLSearchParams(window.location.search)
      next.set('day', selectedDay)
      setSearch(next, { replace: true })
    }
  }, [selectedDay, setSearch])

  // Day update
  const updateDay = React.useCallback((patch: any) => {
    setWeek(prev => ({
      ...prev,
      [selectedDay]: { ...(prev as any)[selectedDay], ...patch }
    }))
  }, [setWeek, selectedDay])

  // --- Apply Template modal (hash-controlled) ---
  const hash = window.location.hash || ''
  const applyMatch = hash.match(/apply=([^&]+)/)
  const tplId = applyMatch ? decodeURIComponent(applyMatch[1]) : null
  const activeTemplate = tplId ? (settings.templates || []).find(t => t.id === tplId) || null : null
  const modalOpen = !!activeTemplate
  const closeModal = () => { window.location.hash = '#/week' }
  const applyTemplate = (opts: ApplyOptions) => {
    const next = applyTemplateToWeek(week, activeTemplate!, opts)
    setWeek(next)
    closeModal()
  }

  // Autofill "Actual" time inputs with suggested defaults (once per slot)
  React.useEffect(() => {
    const slots = settings.suggestedSlots
    if (!slots) return

    let changed = false
    const next = JSON.parse(JSON.stringify(week))

    for (const d of DAYS) {
      const e = next[d]
      if (slots.morning) {
        if (!e.morningActualStart) { e.morningActualStart = slots.morning.start; changed = true }
        if (!e.morningActualEnd)   { e.morningActualEnd   = slots.morning.end;   changed = true }
      }
      if (slots.midday) {
        if (!e.middayActualStart) { e.middayActualStart = slots.midday.start; changed = true }
        if (!e.middayActualEnd)   { e.middayActualEnd   = slots.midday.end;   changed = true }
      }
      if (slots.activity) {
        if (!e.activityActualStart) { e.activityActualStart = slots.activity.start; changed = true }
        if (!e.activityActualEnd)   { e.activityActualEnd   = slots.activity.end;   changed = true }
      }
    }

    if (changed) setWeek(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.suggestedSlots])

  return (
    <>
      {/* Optional: Week insights */}
      {SHOW_WEEK_INSIGHTS && (
        <Dashboard
          week={week}
          dates={dates as any}
          streak={currentStreak(countedDays)}
          bestStreak={bestStreak}
        />
      )}

      {/* Optional: Planner tools */}
      {SHOW_PLANNER_TOOLS && (
        <div className="max-w-5xl mx-auto px-6 mt-2">
          <div className="card p-4 flex items-center justify-between">
            <div className="muted text-sm">Planner tools</div>
            <div className="flex items-center gap-2">
              <button
                className="btn"
                onClick={() => {
                  const res = fillBlanksWithSettings(week, dates as any, settings)
                  if (res.changed) setWeek(res.next)
                  else alert('Nothing to fill – your week already has selections.')
                }}
              >
                Apply Defaults/Patterns to blanks
              </button>
              <a className="btn" href="#/library">Open Templates</a>
            </div>
          </div>
        </div>
      )}

      {/* Optional: Setup banner */}
      {SHOW_SETUP_BANNER && ENABLE_SETUP_WIZARD && (
        <div className="container mt-4">
          <div className="whb-setup-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div className="text-sm" style={{ fontWeight: 600, color: 'var(--title)' }}>Ready to plan next week?</div>
              <div className="muted text-xs">Set your plan in a quick 4-step flow</div>
            </div>
            <button className="btn btn-accent" onClick={() => setSetupOpen(true)}>Start Setup</button>
          </div>
        </div>
      )}

      {/* ===== Sticky weekday strip (full width of content column) ===== */}
      <div className="week-strip">
        <div className="week-strip__inner">
          <div className="flex items-center justify-between gap-3">
            {/* LEFT: scrollable chips */}
            <div className="week-strip__scroll w-full">
              <div
                className="flex gap-2 min-w-[780px] scroll-pl-2 snap-x snap-mandatory"
                role="tablist"
                aria-label="Week days"
              >
                {DAYS.map((d) => (
                  <DayChip
                    key={d}
                    day={d}
                    date={dates[d]}
                    counts={countsByDay[d]}
                    selected={selectedDay === d}
                    isToday={!!dates[d] && new Date().toDateString() === dates[d]!.toDateString()}
                    onSelect={() => setSelectedDay(d)}
                    tabId={`whb-tab-${d}`}
                    panelId={`whb-tabpanel-${d}`}
                  />
                ))}
              </div>
            </div>

            {/* RIGHT: mini month + picker */}
            <div className="shrink-0 flex items-center gap-4">
              <MonthMini
                monthAnchor={weekStart}
                week={week}
                dates={dates}
                onSelectDay={(d) => setSelectedDay(d)}
                cellSize={16}
              />
              <WeekDatePicker
                value={weekStart}
                onChange={(next) => setWeekStart(next)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== Constrained content below the sticky header ===== */}
      <div className="content-wrap">
        <main className="max-w-5xl mx-auto grid gap-6 pb-12">
          {/* Selected day — large callout */}
          <div className="mt-3" role="tabpanel" id={`whb-tabpanel-${selectedDay}`} aria-labelledby={`whb-tab-${selectedDay}`}>
            <DayCard
              collapsible={false}
              day={selectedDay}
              date={dates[selectedDay]}
              entry={(week as any)[selectedDay]}
              projects={settings.projects}
              activityColors={settings.activityColors}
              projectEmojis={settings.projectEmojis}
              activityEmojis={settings.activityEmojis}
              onChange={updateDay}
              onEnsureActivity={ensureActivityInSettings}
              suggestedSlots={settings.suggestedSlots}
            />
          </div>
        </main>
      </div>

      {ENABLE_SETUP_WIZARD && (
        <WeeklySetupWizard open={setupOpen} onClose={() => setSetupOpen(false)} />
      )}

      <ToastStack items={items} />

      <ApplyTemplateModal
        open={modalOpen}
        template={activeTemplate}
        onApply={applyTemplate}
        onClose={closeModal}
      />
    </>
  )
}
