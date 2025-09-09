import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'

// SUT
import MonthNavigator from './MonthNavigator'

// ---------- local date helpers (date-only logic) ----------
type Day = 'Monday'|'Tuesday'|'Wednesday'|'Thursday'|'Friday'|'Saturday'|'Sunday'
const DAYS: Day[] = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

function startOfWeekMonday(d: Date) {
  const x = new Date(d)
  const day = x.getDay() || 7 // Sun=0 -> 7
  if (day !== 1) x.setDate(x.getDate() - (day - 1))
  x.setHours(0,0,0,0)
  return x
}
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate()+n); return x }
function dayNameOfDate(d: Date): Day { return DAYS[(d.getDay() || 7) - 1] }
function monthLabel(d: Date) {
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}
function hasMonthLabel(node: Element, shortMon: string, year: number) {
  const txt = (node.textContent || '').replace(/\s+/g,' ').trim()
  // Accept “September 2025” or split across elements
  const re = new RegExp(`${shortMon}\\w*\\s+${year}`)
  return re.test(txt)
}
function labelForDate(d: Date) {
  return d.toLocaleString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    .replace(',', '')
    // Testing-library ByRole uses aria-label; our aria-labels are like "Wed, Oct 1"
    .replace(/^(\w{3}) (\w{3}) (\d{1,2})$/, (_m, w, m, dd) => `${w}, ${m} ${dd}`)
}

// ---------- helpers for hidden calendar cells ----------
function getHiddenCellByName(re: RegExp): HTMLButtonElement {
  const all = screen.getAllByRole('button', { hidden: true })
  const btn = all.find(b => re.test(b.getAttribute('aria-label') || b.textContent || '')) as HTMLButtonElement | undefined
  if (!btn) {
    const dump = all.map(b => b.getAttribute('aria-label') || b.textContent || '').join(' | ')
    throw new Error(`Could not find hidden month cell ${re}. Buttons seen: ${dump}`)
  }
  return btn
}

// ---------- shared spies ----------
const setWeekStart = vi.fn<(d: Date) => void>()
const setSelectedDay = vi.fn<(d: Day) => void>()
const onSelectDay = vi.fn<(d: Day) => void>()

// Base weekStart: Monday, 2025-09-01
const BASE_WEEK = new Date('2025-09-01T00:00:00')

beforeEach(() => {
  vi.useFakeTimers()
  setWeekStart.mockReset()
  setSelectedDay.mockReset()
  onSelectDay.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

function renderNav(overrides: Partial<React.ComponentProps<typeof MonthNavigator>> = {}) {
  const props: React.ComponentProps<typeof MonthNavigator> = {
    weekStart: startOfWeekMonday(BASE_WEEK),
    selectedDay: 'Wednesday',
    setWeekStart,
    setSelectedDay,
    onSelectDay,
    progressByDate: {}, // not important for these tests
    ...overrides,
  }
  return render(<MonthNavigator {...props} />)
}

describe('MonthNavigator', () => {
  it('renders month label and calendar grid', () => {
    renderNav()
    expect(
      screen.getAllByText((_, node) => !!node && hasMonthLabel(node, 'Sep', 2025))
    ).not.toHaveLength(0)

    // Headers Mon..Sun
    ;['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].forEach(h =>
      expect(screen.getAllByText(h)[0]).toBeInTheDocument()
    )

    // Contains at least a cell for Sep 1 (button with aria-label)
    expect(
      screen.getAllByRole('button', { hidden: true }).some(b =>
        /Mon,\s*Sep\s*1/i.test(b.getAttribute('aria-label') || '')
      )
    ).toBe(true)
  })

  it('clicking a date within the current week selects that day without changing weekStart', () => {
    renderNav()

    // Current week is the week of 2025-09-01; pick Wed 2025-09-03
    const wednesday = new Date('2025-09-03T00:00:00')
    const label = labelForDate(wednesday) // "Wed, Sep 3"
    fireEvent.click(getHiddenCellByName(new RegExp(`^${label.replace(/\s+/g,'\\s*')}$`, 'i')))

    // does not move the week
    expect(setWeekStart).not.toHaveBeenCalled()

    // selects Wednesday (either via setSelectedDay or fallback onSelectDay if you still emit it)
    const picked =
      (setSelectedDay.mock.calls[0]?.[0] as Day | undefined) ??
      (onSelectDay.mock.calls[0]?.[0] as Day | undefined)
    expect(picked).toBe('Wednesday')
  })

  it('clicking a date outside the current week jumps weekStart to that date’s Monday and selects the proper day', () => {
    renderNav()

    // Click Thu 2025-09-18 (outside the week of Sep 1)
    const target = new Date('2025-09-18T00:00:00')
    const label = labelForDate(target) // "Thu, Sep 18"
    fireEvent.click(getHiddenCellByName(new RegExp(`^${label.replace(/\s+/g,'\\s*')}$`, 'i')))

    expect(setWeekStart).toHaveBeenCalledTimes(1)
    const passed = setWeekStart.mock.calls[0][0]
    const expectedMonday = startOfWeekMonday(target)
    expect(passed.toISOString().slice(0,10)).toBe(expectedMonday.toISOString().slice(0,10))

    const picked =
      (setSelectedDay.mock.calls[0]?.[0] as Day | undefined) ??
      (onSelectDay.mock.calls[0]?.[0] as Day | undefined)
    expect(picked).toBe('Thursday')
  })

  it('Prev/Next change the visible month; Today jumps weekStart to this week', () => {
    renderNav()

    // Next month should not move weekStart, only anchor/month label
    fireEvent.click(screen.getByRole('button', { name: /next month/i }))
    expect(setWeekStart).toHaveBeenCalledTimes(0)
    expect(
      screen.getAllByText((_, node) => !!node && hasMonthLabel(node, 'Oct', 2025)).length
    ).toBeGreaterThan(0)

    // Prev month should not move weekStart either
    fireEvent.click(screen.getByRole('button', { name: /previous month/i }))
    expect(setWeekStart).toHaveBeenCalledTimes(0)
    expect(
      screen.getAllByText((_, node) => !!node && hasMonthLabel(node, 'Sep', 2025)).length
    ).toBeGreaterThan(0)

    // Today should move weekStart to this week's Monday (mock "today")
    const fakeNow = new Date('2025-10-16T13:00:00Z') // Thu Oct 16, 2025
    vi.setSystemTime(fakeNow)
    fireEvent.click(screen.getByRole('button', { name: /this week/i }))
    expect(setWeekStart).toHaveBeenCalledTimes(1)
    const monday = setWeekStart.mock.calls[0][0]
    expect(monday.toISOString().slice(0,10)).toBe(startOfWeekMonday(fakeNow).toISOString().slice(0,10))
  })

  it('clicking a leading/trailing grid day from adjacent month updates weekStart and selected day correctly', () => {
    renderNav()

    // Trailing cell: Oct 1 visible in September grid
    fireEvent.click(getHiddenCellByName(/^Wed,\s*Oct\s*1$/i))

    expect(setWeekStart).toHaveBeenCalledTimes(1)
    const passed = setWeekStart.mock.calls[0][0] as Date
    // Week containing 2025-10-01 has Monday 2025-09-29
    expect(passed.toISOString().slice(0, 10)).toBe('2025-09-29')

    const picked =
      (setSelectedDay.mock.calls[0]?.[0] as Day | undefined) ??
      (onSelectDay.mock.calls[0]?.[0] as Day | undefined)
    expect(picked).toBe('Wednesday')
  })

  it('Today jumps to the correct Monday across DST boundaries (date-only safe)', () => {
    renderNav()

    // Mock system time to a DST-crossing week (US) — Mar 12, 2025 is a Wednesday
    const fakeNow = new Date('2025-03-12T12:00:00Z')
    vi.setSystemTime(fakeNow)

    fireEvent.click(screen.getByRole('button', { name: /this week/i }))

    expect(setWeekStart).toHaveBeenCalledTimes(1)
    const monday = setWeekStart.mock.calls[0][0] as Date
    const expected = startOfWeekMonday(fakeNow)
    expect(monday.toISOString().slice(0,10)).toBe(expected.toISOString().slice(0,10))
  })

  it('changing the hidden date input jumps to that date’s Monday', () => {
    renderNav()

    const input = document.querySelector('input[type="date"]') as HTMLInputElement
    expect(input).toBeTruthy()

    // Thu 2025-10-16 → Monday 2025-10-13
    const picked = new Date('2025-10-16T00:00:00Z')
    fireEvent.change(input, {
      target: { value: '2025-10-16', valueAsDate: picked },
    } as any)

    expect(setWeekStart).toHaveBeenCalledTimes(1)
    const monday = setWeekStart.mock.calls[0][0] as Date
    expect(monday.toISOString().slice(0,10)).toBe('2025-10-13')
  })
})
