// src/hooks/useToday.test.ts
import React from 'react'
import { renderHook } from '@testing-library/react'
import { useToday } from './useToday'
import { Day } from '../types'

const allDays: Day[] = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]

function makeDates(start: Date) {
  // produce a Mon–Sun map anchored to provided Monday
  const dates = {} as Record<Day, Date>
  allDays.forEach((d, i) => {
    const dt = new Date(start)
    dt.setDate(start.getDate() + i)
    dates[d] = dt
  })
  return dates
}

describe('useToday', () => {
  it('returns the matching weekday when today is inside the provided week', () => {
    // craft a week where Monday == today’s Monday
    const now = new Date()
    const monday = new Date(now)
    const day = monday.getDay() // 0..6, Sun=0
    const diffToMonday = ((day + 6) % 7) // days since Monday
    monday.setHours(0,0,0,0)
    monday.setDate(monday.getDate() - diffToMonday)

    const dates = makeDates(monday)
    const { result } = renderHook(() => useToday(dates))
    // toDateString matching ensures local calendar logic
    const expected = allDays.find(d => dates[d].toDateString() === new Date().toDateString())
    expect(result.current).toBe(expected ?? 'Monday')
  })

  it('falls back to Monday if today is not in the provided week', () => {
    // Provide a week far in the past
    const monday = new Date('2000-01-03T00:00:00')
    const dates = makeDates(monday)
    const { result } = renderHook(() => useToday(dates))
    expect(result.current).toBe('Monday')
  })

  it('honors a custom fallback', () => {
    const dates = {} as any // empty map
    const { result } = renderHook(() => useToday(dates, 'Sunday'))
    expect(result.current).toBe('Sunday')
  })
})
