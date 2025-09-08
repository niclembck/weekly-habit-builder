import { describe, it, expect } from 'vitest'
import { countObjectives } from './countObjectives'

// New contract (v6.5+):
// - We always show 3 objectives (Morning, Midday, Activity).
// - `completed` is the sum of the three done* flags.
// - `total` is always 3.
// - Labels being blank/whitespace do NOT change totals.
// - pct is rounded to nearest integer.

describe('countObjectives (fixed total=3)', () => {
  it('handles empty/undefined entry', () => {
    const res = countObjectives(undefined)
    expect(res).toEqual({ completed: 0, total: 3, pct: 0 })
  })

  it('counts all three present and completed', () => {
    const res = countObjectives({
      doneMorning: true,
      doneMidday: true,
      doneActivity: true,
      morningProject: 'A',
      middayProject: 'B',
      activity: 'C',
    } as any)
    expect(res).toEqual({ completed: 3, total: 3, pct: 100 })
  })

  it('counts only the done flags regardless of labels', () => {
    const res = countObjectives({
      doneMorning: true,
      doneMidday: false,
      doneActivity: true,
      morningProject: '',
      middayProject: '   ',        // whitespace
      activity: undefined,         // absent
    } as any)
    // completed 2/3 -> 67%
    expect(res).toEqual({ completed: 2, total: 3, pct: 67 })
  })

  it('rounds percentage to nearest integer (1/3 ≈ 33)', () => {
    const res = countObjectives({
      doneMorning: true,
      doneMidday: false,
      doneActivity: false,
    } as any)
    expect(res).toEqual({ completed: 1, total: 3, pct: 33 })
  })

  it('guards pct within [0,100]', () => {
    const res0 = countObjectives({} as any)
    const res3 = countObjectives({
      doneMorning: true,
      doneMidday: true,
      doneActivity: true,
    } as any)
    expect(res0.pct).toBeGreaterThanOrEqual(0)
    expect(res3.pct).toBeLessThanOrEqual(100)
  })

  it('treats truthy/falsy done flags defensively', () => {
    const res = countObjectives({
      doneMorning: 1 as any,     // truthy
      doneMidday: 0 as any,      // falsy
      doneActivity: 'yes' as any // truthy (if your impl coerces)
    } as any)
    // If your impl strictly checks === true, adjust expectation accordingly.
    expect(res.total).toBe(3)
    expect([1,2,3]).toContain(res.completed)
    expect(res.pct).toBeGreaterThanOrEqual(0)
    expect(res.pct).toBeLessThanOrEqual(100)
  })

  it('ignores extra fields and keeps total=3', () => {
    const res = countObjectives({
      doneMorning: true,
      doneMidday: false,
      doneActivity: false,
      doneEvening: true as any // should be ignored
    } as any)
    expect(res.total).toBe(3)
    expect(res.completed).toBe(1)
    expect(res.pct).toBe(33)
  })
})
