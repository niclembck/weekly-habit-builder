// src/views/WeekView.test.tsx
import React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import WeekView from './WeekView'

function labelFor(d: Date) {
  const wd = d.toLocaleDateString(undefined, { weekday: 'short' })
  const mo = d.toLocaleDateString(undefined, { month: 'short' })
  const day = d.getDate()
  return new RegExp(`^${wd}\\,\\s+${mo}\\s+${day}\\b`, 'i')
}

// ----------------- Hoisted Mocks (no external refs inside factories) -----------------

// Toasts (single mock)
vi.mock('../components/ToastStack', () => ({
  default: () => null,
  useToasts: () => ({ items: [] }),
}))

// Child components simplified
let lastMonthMiniProps: any = null
let lastDayCardProps: any = null

vi.mock('../components/DayCard', () => ({
  default: (props: any) => {
    lastDayCardProps = props
    return <div data-testid="daycard">DayCard: {props.day}</div>
  },
}))

vi.mock('../components/MonthMini', () => ({
  default: (props: any) => {
    lastMonthMiniProps = props
    const label =
      props.monthAnchor instanceof Date ? props.monthAnchor.toISOString().slice(0, 10) : 'n/a'
    return <div data-testid="monthmini">MonthMini (anchor {label})</div>
  },
}))

// WeekDatePicker stub – shows current value and emits a Date when clicked
vi.mock('../components/WeekDatePicker', () => ({
  default: (props: any) => {
    const val = props.value instanceof Date ? props.value.toISOString().slice(0, 10) : ''
    return (
      <button
        data-testid="picker"
        aria-label="fake-picker"
        onClick={() => props.onChange?.(new Date('2025-10-06T00:00:00'))}
      >
        Picker: {val}
      </button>
    )
  },
}))

// Cosmetic/irrelevant components
vi.mock('../components/WeeklySetupWizard', () => ({ default: () => null }))
vi.mock('../components/ApplyTemplateModal', () => ({ default: () => null }))
vi.mock('../components/Dashboard', () => ({ default: () => null }))

// useProgress (WeekView calls it)
vi.mock('../hooks/useProgress', () => ({
  useProgress: () => ({
    countedDays: [],
    bestStreak: 0,
    currentStreak: () => 0,
    updateFromWeek: () => {},
  }),
}))

// Today helper → deterministic initial selection
vi.mock('../hooks/useToday', () => ({
  useToday: () => 'Wednesday',
}))

// DayChip → a simple, accessible button
vi.mock('../components/DayChip', () => ({
  default: (props: any) => (
    <button
      type="button"
      role="tab"
      aria-selected={props.selected ? 'true' : 'false'}
      onClick={() => props.onSelect?.()}
    >
      {props.day}
    </button>
  ),
}))

// useWeek – fully controlled mock with exposed spies
vi.mock('../hooks/useWeek', () => {
  type Day = 'Monday'|'Tuesday'|'Wednesday'|'Thursday'|'Friday'|'Saturday'|'Sunday'
  const DAYS: Day[] = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
  const startOfWeekMonday = (d: Date) => {
    const x = new Date(d)
    const day = x.getDay() || 7
    if (day !== 1) x.setDate(x.getDate() - (day - 1))
    x.setHours(0,0,0,0)
    return x
  }
  const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x }
  const getWeekDates = (weekStart: Date) => {
    const map: Record<Day, Date> = {} as any
    DAYS.forEach((k, i) => (map[k] = addDays(weekStart, i)))
    return map
  }

  const weekStart = startOfWeekMonday(new Date('2025-09-01T00:00:00'))
  const dates = getWeekDates(weekStart)

  const setWeekStartMock = vi.fn()
  const setWeekMock = vi.fn()
  const ensureActivityInSettings = vi.fn()

  // Build a simple week shape
  const week: Record<Day, any> = {} as any
  for (const d of DAYS) {
    week[d] = {
      morningProject: '', middayProject: '', activity: '',
      doneMorning: false, doneMidday: false, doneActivity: false,
      morningNotes:'', middayNotes:'', activityNotes:'',
      gratitude:'', notes:'', mood:null, therapy:false,
      morningActualStart:'08:00', morningActualEnd:'09:00',
      middayActualStart:'12:00',  middayActualEnd:'13:00',
      activityActualStart:'18:00', activityActualEnd:'19:00',
    }
  }

  return {
    __mocks: { setWeekStartMock, setWeekMock },
    DAYS,
    useWeek: () => ({
      settings: {
        projects: ['Alpha', 'Beta'],
        activityColors: { Run: '#aaa' },
        projectEmojis: {},
        activityEmojis: {},
        suggestedSlots: {},
      } as any,
      weekStart,
      setWeekStart: setWeekStartMock,
      week,
      setWeek: setWeekMock,
      dates,
      ensureActivityInSettings,
    }),
    // exported helpers that WeekView imports (no-ops for tests)
    applyDefaultsAndPatterns: (w: any) => w,
    fillBlanksWithSettings: (w: any) => ({ changed: false, next: w }),
    applyTemplateToWeek: (w: any) => w,
  }
})

// ----------------- Test Setup -----------------

beforeEach(() => {
  lastMonthMiniProps = null
  lastDayCardProps = null
  // reset spies from the module (get fresh refs each time)
  import('../hooks/useWeek').then((mod: any) => {
    mod.__mocks.setWeekStartMock.mockReset()
    mod.__mocks.setWeekMock.mockReset()
  })
})

// ----------------- Tests -----------------

describe('WeekView (integration-lite)', () => {
  it('renders 7 day chips and initial DayCard for the "today" (mocked Wednesday)', async () => {
    const { default: WeekView } = await import('./WeekView')
    render(
      <MemoryRouter initialEntries={['/week']}>
        <WeekView />
      </MemoryRouter>
    )

    const tabs = screen.getAllByRole('tab')
    expect(tabs).toHaveLength(7)

    expect(screen.getByTestId('daycard')).toHaveTextContent('DayCard: Wednesday')
  })

  it('clicking a DayChip updates the selected day (reflected in DayCard)', async () => {
    const { default: WeekView } = await import('./WeekView')
    render(
      <MemoryRouter initialEntries={['/week']}>
        <WeekView />
      </MemoryRouter>
    )

    fireEvent.click(screen.getByRole('tab', { name: 'Friday' }))
    expect(screen.getByTestId('daycard')).toHaveTextContent('DayCard: Friday')
  })

  
  it('clicking a date in the MonthNavigator updates weekStart (outside current week)', async () => {
    const mod: any = await import('../hooks/useWeek')
    const spy = mod.__mocks?.setWeekStartMock
    spy?.mockReset()

    render(
      <MemoryRouter initialEntries={['/week']}>
        <WeekView />
      </MemoryRouter>
    )

    // Choose a date outside the week of Sep 1, 2025 — e.g., Mon Sep 8, 2025
    const target = new Date('2025-09-08T00:00:00')
    fireEvent.click(screen.getByRole('button', { name: labelFor(target) }))

    expect(spy).toHaveBeenCalledTimes(1)
    const arg = spy.mock.calls[0][0]
    expect(arg instanceof Date).toBe(true)
  })

})
