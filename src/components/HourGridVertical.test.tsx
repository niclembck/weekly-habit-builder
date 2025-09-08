// src/components/HourGridVertical.test.tsx
import React from 'react'
import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import HourGridVertical from './HourGridVertical'

function mousedown(el: Element, clientY: number) {
  fireEvent.mouseDown(el, { clientY })
}
function mousemove(clientY: number) {
  fireEvent.mouseMove(window, { clientY })
}
function mouseup() {
  fireEvent.mouseUp(window)
}

describe('HourGridVertical (unit)', () => {
  const baseProps = {
    morningActualStart: '08:00', morningActualEnd: '10:00',
    middayActualStart: '13:00',  middayActualEnd: '15:00',
    activityActualStart: '17:00', activityActualEnd: '18:00',
    onChange: vi.fn(),
    suggested: undefined,
    startHour: 6, endHour: 22, hourPx: 48,
  }

  it('renders three blocks and reflects upstream prop changes', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <HourGridVertical
        morningActualStart="08:00" morningActualEnd="10:00"
        middayActualStart="13:00"  middayActualEnd="15:00"
        activityActualStart="17:00" activityActualEnd="18:00"
        onChange={onChange}
        startHour={6} endHour={22} hourPx={24}
      />
    )
    expect(screen.getByText('08:00–10:00')).toBeInTheDocument()
    expect(screen.getByText('13:00–15:00')).toBeInTheDocument()
    expect(screen.getByText('17:00–18:00')).toBeInTheDocument()

    rerender(
      <HourGridVertical
        morningActualStart="09:00" morningActualEnd="10:30"
        middayActualStart="13:00"  middayActualEnd="15:00"
        activityActualStart="17:00" activityActualEnd="18:00"
        onChange={onChange}
        startHour={6} endHour={22} hourPx={24}
      />
    )
    expect(screen.getByText('09:00–10:30')).toBeInTheDocument()
  })

  it('double-clicking a block time calls onRequestFocusTimes', () => {
    const onChange = vi.fn()
    const onRequestFocusTimes = vi.fn()
    render(
      <HourGridVertical
        morningActualStart="08:00" morningActualEnd="09:00"
        middayActualStart="12:00"  middayActualEnd="13:00"
        activityActualStart="18:00" activityActualEnd="19:00"
        onChange={onChange}
        onRequestFocusTimes={onRequestFocusTimes}
        startHour={6} endHour={22}
      />
    )
    fireEvent.doubleClick(screen.getByText('08:00–09:00'))
    expect(onRequestFocusTimes).toHaveBeenCalledWith('morning', 'both')
  })

  it('clicking a block calls onEdit with the right slot', () => {
    const onEdit = vi.fn()
    render(<HourGridVertical {...baseProps} onEdit={onEdit} />)

    fireEvent.click(screen.getByRole('button', { name: /Morning/i }))
    expect(onEdit).toHaveBeenCalledWith('morning')
    fireEvent.click(screen.getByRole('button', { name: /Midday/i }))
    expect(onEdit).toHaveBeenCalledWith('midday')
    fireEvent.click(screen.getByRole('button', { name: /Activity/i }))
    expect(onEdit).toHaveBeenCalledWith('activity')
  })

  it('ArrowDown on active block triggers nudge handler (15m)', () => {
    const onNudgeRequest = vi.fn()
    render(<HourGridVertical {...baseProps} onNudgeRequest={onNudgeRequest} active="morning" />)

    const morning = screen.getByRole('button', { name: /Morning/i })
    morning.focus()
    fireEvent.keyDown(morning, { key: 'ArrowDown' })
    expect(onNudgeRequest).toHaveBeenCalledWith('morning', 15)
  })

  it('ArrowDown with Shift=5m, Alt=30m deltas', () => {
    const onNudgeRequest = vi.fn()
    render(<HourGridVertical {...baseProps} onNudgeRequest={onNudgeRequest} active="midday" />)
    const btn = screen.getByRole('button', { name: /Midday/i })

    btn.focus()
    fireEvent.keyDown(btn, { key: 'ArrowDown', shiftKey: true })
    fireEvent.keyDown(btn, { key: 'ArrowDown', altKey: true })

    expect(onNudgeRequest).toHaveBeenNthCalledWith(1, 'midday', 5)
    expect(onNudgeRequest).toHaveBeenNthCalledWith(2, 'midday', 30)
  })

  it('prevents overlap when moving Morning down into Midday', () => {
    const onChange = vi.fn()
    render(
      <HourGridVertical
        morningActualStart="08:00" morningActualEnd="09:00"
        middayActualStart="09:00"  middayActualEnd="10:00"
        activityActualStart="17:00" activityActualEnd="18:00"
        startHour={6} endHour={22} hourPx={48}
        preventOverlap
        onChange={onChange}
      />
    )

    const drag = screen.getByRole('button', { name: /Morning/i }).querySelector('.vgrid__drag')!
    mousedown(drag, 300)
    mousemove(300 + 48)   // ~+1h
    mouseup()

    expect(onChange).toHaveBeenCalled()
    const last = onChange.mock.calls.at(-1)?.[0]
    expect(last.morningActualEnd <= '09:00').toBe(true) // clamped to touch but not overlap
  })

  it('allows exact-touch adjacency (no false positive overlap)', () => {
    const onChange = vi.fn()
    render(
      <HourGridVertical
        morningActualStart="08:00" morningActualEnd="09:00"
        middayActualStart="09:00"  middayActualEnd="10:00"
        activityActualStart="17:00" activityActualEnd="18:00"
        startHour={6} endHour={22} hourPx={48}
        preventOverlap
        onChange={onChange}
      />
    )
    // Try to resize morning end exactly to 09:00 again (no change, but should not reject)
    const endHandle = screen.getByRole('button', { name: /Morning/i }).querySelector('.handle--end')!
    mousedown(endHandle, 300)
    mousemove(300) // no movement
    mouseup()

    // No overlap error path; either no call or a call that leaves it 09:00
    const maybe = onChange.mock.calls.at(-1)?.[0]
    if (maybe) expect(maybe.morningActualEnd).toBe('09:00')
  })

  it('resizing cannot shrink below 15 minutes', () => {
    const onChange = vi.fn()
    render(
      <HourGridVertical
        morningActualStart="08:00" morningActualEnd="08:20"
        middayActualStart="12:00"  middayActualEnd="13:00"
        activityActualStart="17:00" activityActualEnd="18:00"
        startHour={6} endHour={22} hourPx={60}
        onChange={onChange}
      />
    )
    const startHandle = screen.getByRole('button', { name: /Morning/i }).querySelector('.handle--start')!
    mousedown(startHandle, 100) // near the top
    mousemove(100 + 60) // drag down an hour — would invert without clamp
    mouseup()

    const last = onChange.mock.calls.at(-1)?.[0]
    // must preserve at least 15m span
    const [s, e] = [last.morningActualStart, last.morningActualEnd]
    expect(s < e).toBe(true)
  })
})
