import { describe, it, expect } from 'vitest'
import { toMin, toHHMM } from './time'

describe('time utils', () => {
  it('toMin coerces HH:MM to minutes with sensible fallbacks', () => {
    expect(toMin('00:00')).toBe(0)
    expect(toMin('01:30')).toBe(90)
    expect(toMin('23:59')).toBe(23 * 60 + 59)
    // App behavior: invalid/undefined fall back to 08:00 (480)
    expect(toMin('bad' as any)).toBe(480)
    expect(toMin(undefined as any)).toBe(480)
  })

  it('toHHMM formats minutes with zero-pad and handles bounds sanely', () => {
    expect(toHHMM(0)).toBe('00:00')
    expect(toHHMM(90)).toBe('01:30')
    expect(toHHMM(23 * 60 + 59)).toBe('23:59')
    expect(toHHMM(-10)).toBe('00:00') // floor at 00:00

    // Round-trip check
    const round = toHHMM(toMin('08:30'))
    expect(round).toBe('08:30')
  })

  it('parses midnight and leading zero omission', () => {
    expect(toMin('0:00')).toBe(0)
    expect(toMin('00:00')).toBe(0)
  })

  it('formats exactly midnight', () => {
    expect(toHHMM(0)).toBe('00:00')
  })

  it('clamps negative minutes to 00:00', () => {
    expect(toHHMM(-30)).toBe('00:00')
  })
})
