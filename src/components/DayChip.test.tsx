import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import DayChip, { type DayCounts } from './DayChip'
import { Day } from '../types'

const counts: DayCounts = { completed: 1, total: 3, pct: 33 }

describe('DayChip', () => {
  it('renders the day label and date', () => {
    const day: Day = 'Monday'
    // Use component-style construction to avoid timezone drift
    const date = new Date(2025, 8, 1) // Sep 1, 2025 (month is 0-based)

    const expected = date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })

    render(<DayChip day={day} date={date} counts={{ completed: 1, total: 3, pct: 33 }} />)

    expect(screen.getByText(day)).toBeInTheDocument()
    expect(screen.getByText(expected)).toBeInTheDocument()
  })


  it('shows Today badge when isToday=true', () => {
    render(<DayChip day={'Tuesday' as Day} counts={counts} isToday />)
    expect(screen.getByText('Today')).toBeInTheDocument()
  })

  it('calls onSelect when clicked', () => {
    const onSelect = vi.fn()
    render(<DayChip day={'Wednesday' as Day} counts={counts} onSelect={onSelect} />)

    fireEvent.click(screen.getByRole('tab'))
    expect(onSelect).toHaveBeenCalledTimes(1)
  })

  it('applies selected styling', () => {
    render(<DayChip day={'Thursday' as Day} counts={counts} selected />)
    const btn = screen.getByRole('tab')
    expect(btn).toHaveAttribute('aria-selected', 'true')
  })
})
