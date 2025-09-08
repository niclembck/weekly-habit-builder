import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import WeekDatePicker from './WeekDatePicker'

describe('WeekDatePicker', () => {
  it('renders and emits a Date via onChange', () => {
    const onChange = vi.fn()
    const value = new Date('2025-09-01T00:00:00')
    render(<WeekDatePicker value={value} onChange={onChange} />)

    const input = screen.getByLabelText(/Select week start/i) as HTMLInputElement
    expect(input.value).toBe('2025-09-01')

    fireEvent.change(input, { target: { value: '2025-10-06' } })
    expect(onChange).toHaveBeenCalledTimes(1)
    const arg = onChange.mock.calls[0][0] as Date

    // Assert using UTC (or ISO) to avoid timezone shifts
    expect(arg.getUTCFullYear()).toBe(2025)
    expect(arg.getUTCMonth()).toBe(9)   // Oct (0-based)
    expect(arg.getUTCDate()).toBe(6)
    expect(arg.toISOString().startsWith('2025-10-06')).toBe(true)
  })

  it('prints a YYYY-MM-DD for the passed value and emits a UTC-anchored Date on change', () => {
    const onChange = vi.fn()
    const monday = new Date('2025-10-06T12:00:00')
    render(<WeekDatePicker value={monday} onChange={onChange} />)

    const input = screen.getByLabelText(/Week of/i) as HTMLInputElement
    expect(input.value).toBe('2025-10-06')

    fireEvent.change(input, { target: { value: '2025-10-10' } })
    const arg = onChange.mock.calls[0][0] as Date

    // Same: check UTC/ISO to be timezone-agnostic
    expect(arg.getUTCFullYear()).toBe(2025)
    expect(arg.getUTCMonth()).toBe(9) // Oct
    expect(arg.getUTCDate()).toBe(10)
    expect(arg.toISOString().startsWith('2025-10-10')).toBe(true)
  })
})
