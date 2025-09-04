import { TimeRange } from '../types'

// "HH:MM" -> minutes since midnight
export function toMin(hhmm?: string): number|undefined {
  if (!hhmm) return undefined
  const [h, m] = hhmm.split(':').map(Number)
  if (Number.isNaN(h) || Number.isNaN(m)) return undefined
  return h * 60 + m
}

export function midpoint(range?: TimeRange): number|undefined {
  if (!range) return undefined
  const s = toMin(range.start), e = toMin(range.end)
  if (s == null || e == null) return undefined
  return Math.round((s + e) / 2)
}

export function duration(range?: TimeRange): number|undefined {
  if (!range) return undefined
  const s = toMin(range.start), e = toMin(range.end)
  if (s == null || e == null) return undefined
  return Math.max(0, e - s)
}

export function varianceMinutes(suggested?: TimeRange, actual?: TimeRange) {
  const midS = midpoint(suggested)
  const midA = midpoint(actual)
  const durS = duration(suggested)
  const durA = duration(actual)

  const startDelta = (midS != null && midA != null) ? Math.abs(midA - midS) : undefined
  const durationDelta = (durS != null && durA != null) ? Math.abs(durA - durS) : undefined

  return { startDelta, durationDelta }
}

// Helper to build actual range from entry fields
export function actualFromEntry(start?: string, end?: string): TimeRange|undefined {
  if (!start && !end) return undefined
  return { start: start || '', end: end || '' }
}
