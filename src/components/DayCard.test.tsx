// src/components/DayCard.test.tsx
import React from 'react'
import { screen, fireEvent } from '@testing-library/react'
import DayCard from './DayCard'
import { Day, DayEntry } from '../types'
import { renderControlled } from '../test/utils'

// NOTE: The old UI (Morning/Midday/Activity subcards, selects, inline notes)
// moved into a flyout. These tests target the current surface area:
// header, summary pills, hour grid, completion toggles, mood input.

const baseEntry: Partial<DayEntry> = {
  morningProject: 'Alpha',
  middayProject: 'Beta',
  activity: 'Run',
  doneMorning: false,
  doneMidday: true,
  doneActivity: false,
  morningActualStart: '08:00',
  morningActualEnd: '10:00',
  middayActualStart: '13:00',
  middayActualEnd: '15:00',
  activityActualStart: '17:00',
  activityActualEnd: '18:00',
}

const baseProps = {
  collapsible: false,
  day: 'Monday' as Day,
  date: new Date(2025, 8, 1), // Sep 1, 2025
  projects: ['Alpha', 'Beta'],
  activityColors: { Run: '#f00', Yoga: '#0f0' },
  projectEmojis: { Alpha: '🅰️', Beta: '🅱️' },
  activityEmojis: { Run: '🏃' },
  onToast: () => {},
}

describe('DayCard (current UI)', () => {
  it('renders header, summary pills, and hour grid', () => {
    renderControlled(DayCard, {
      ...baseProps,
      entry: baseEntry,
    })

    // Header (day label)
    expect(screen.getByText('Monday')).toBeInTheDocument()

    // Summary pills
    expect(screen.getByText(/AM:/i)).toBeInTheDocument()
    expect(screen.getByText(/Mid:/i)).toBeInTheDocument()
    expect(screen.getByText(/Act:/i)).toBeInTheDocument()

    // Hour grid (via aria-label from HourGridVertical)
    expect(screen.getByLabelText(/Day timeline/i)).toBeInTheDocument()

    // Completion toggles (compact labels below grid)
    expect(screen.getByLabelText(/Morning done/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Midday done/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Activity done/i)).toBeInTheDocument()
  })

  it('toggles "Morning done" and persists via controlled re-render', () => {
    renderControlled(DayCard, {
      ...baseProps,
      entry: { ...baseEntry, doneMorning: false },
    })

    const morningDone = screen.getByLabelText(/Morning done/i) as HTMLInputElement
    expect(morningDone.checked).toBe(false)

    fireEvent.click(morningDone)

    // After renderControlled applies the onChange patch, state should reflect
    const morningDoneAfter = screen.getByLabelText(/Morning done/i) as HTMLInputElement
    expect(morningDoneAfter.checked).toBe(true)
  })

  it('accepts mood 1–5 and becomes empty when cleared', () => {
    renderControlled(DayCard, {
      ...baseProps,
      entry: { ...baseEntry, mood: 3 },
    })

    const mood = screen.getByPlaceholderText('1–5') as HTMLInputElement

    fireEvent.change(mood, { target: { value: '5' } })
    expect((screen.getByPlaceholderText('1–5') as HTMLInputElement).value).toBe('5')

    fireEvent.change(mood, { target: { value: '' } })
    expect((screen.getByPlaceholderText('1–5') as HTMLInputElement).value).toBe('')
  })
})
