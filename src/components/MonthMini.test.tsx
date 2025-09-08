import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import MonthMini from './MonthMini'
import { Day, DayEntry } from '../types'
import { getWeekDates } from '../utils/dates'

const DAYS: Day[] = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

function makeWeek(anchor: Date): { week: Record<Day, DayEntry>, dates: Record<Day, Date> } {
  const start = new Date(anchor)
  // normalize to Monday
  const day = start.getDay() || 7
  if (day !== 1) start.setDate(start.getDate() - (day - 1))
  start.setHours(0,0,0,0)

  const week: Record<Day, DayEntry> = {} as any
  const dates: Record<Day, Date> = {} as any
  for (let i = 0; i < 7; i++) {
    const d = new Date(start); d.setDate(start.getDate() + i)
    dates[DAYS[i]] = d
    week[DAYS[i]] = {
      morningProject:'', middayProject:'', activity:'',
      doneMorning:false, doneMidday:false, doneActivity:false,
      morningNotes:'', middayNotes:'', activityNotes:'',
      gratitude:'', notes:'', mood:null, therapy:false,
      morningActualStart:'', morningActualEnd:'',
      middayActualStart:'', middayActualEnd:'',
      activityActualStart:'', activityActualEnd:''
    }
  }
  // mark some completion so we get colored cells
  week.Monday.doneMorning = true
  week.Wednesday.doneMidday = true
  return { week, dates }
}

describe('MonthMini', () => {
  it('shows month label and 7×N grid with weekday headers', () => {
    const anchor = new Date('2025-09-03T00:00:00')
    const { week, dates } = makeWeek(anchor)
    render(<MonthMini monthAnchor={anchor} week={week} dates={dates} />)

    // Month label
    expect(screen.getByText(/Sep/i)).toBeInTheDocument()

    // Weekday headers
    for (const lbl of ['Mon','Tue','Wed','Thu','Fri','Sat','Sun']) {
      expect(screen.getByText(lbl)).toBeInTheDocument()
    }

    // At least 28 cells (Sep 2025 spans 5 weeks)
    const cells = screen.getAllByRole('button', { name: /—|Mon|Tue|Wed|Thu|Fri|Sat|Sun/i })
    expect(cells.length).toBeGreaterThanOrEqual(28)
  })

  it('clicking a date in the current week calls onSelectDay', () => {
    const weekStart = new Date('2025-09-01T00:00:00')
    const dates = getWeekDates(weekStart)
    const week: Record<Day, any> = {
      Monday:{}, Tuesday:{}, Wednesday:{}, Thursday:{}, Friday:{}, Saturday:{}, Sunday:{}
    }

    const onSelectDay = vi.fn()
    render(<MonthMini monthAnchor={weekStart} week={week} dates={dates} onSelectDay={onSelectDay} />)

    // Find the button whose label matches one of the current-week dates (e.g., Monday)
    const monDate = dates.Monday.getDate()
    const btn = screen.getAllByRole('button').find(b => b.textContent === String(monDate))!
    fireEvent.click(btn)

    expect(onSelectDay).toHaveBeenCalledWith('Monday')
  })

  it('guards invalid monthAnchor (falls back to today-like month label)', () => {
    const bad = 'not-a-date' as any
    // Build minimal week/dates for render
    const anchor = new Date()
    const dates: any = {
      Monday: anchor, Tuesday: anchor, Wednesday: anchor, Thursday: anchor,
      Friday: anchor, Saturday: anchor, Sunday: anchor,
    }
    const week: any = { Monday:{}, Tuesday:{}, Wednesday:{}, Thursday:{}, Friday:{}, Saturday:{}, Sunday:{} }
    render(<MonthMini monthAnchor={bad} week={week} dates={dates} />)

    // Just assert it renders a month label (short month name is fine)
    expect(screen.getByText(/[A-Za-z]{3}\s+\d{4}/)).toBeInTheDocument()
  })

  it('renders without click handlers when onSelectDay is omitted', () => {
    const anchor = new Date('2025-09-03T00:00:00')
    const { week, dates } = (function mk() {
      const w: any = { Monday:{}, Tuesday:{}, Wednesday:{}, Thursday:{}, Friday:{}, Saturday:{}, Sunday:{} }
      const ds: any = {
        Monday: new Date('2025-09-01'),
        Tuesday: new Date('2025-09-02'),
        Wednesday: new Date('2025-09-03'),
        Thursday: new Date('2025-09-04'),
        Friday: new Date('2025-09-05'),
        Saturday: new Date('2025-09-06'),
        Sunday: new Date('2025-09-07'),
      }
      return { week: w, dates: ds }
    })()

    render(<MonthMini monthAnchor={anchor} week={week} dates={dates} />)
    // Just ensure cells render; we won't click.
    expect(screen.getAllByRole('button').length).toBeGreaterThan(20)
  })
})
