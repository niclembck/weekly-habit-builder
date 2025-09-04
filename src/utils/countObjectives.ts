import type { DayEntry } from '../types'

export type ObjectiveCount = { completed: number; total: number; pct: number }

/**
 * Week chip / Day summary counters.
 * We always show 3 objectives: Morning, Midday, Activity.
 * `completed` is from the three `done*` flags; `total` is fixed at 3.
 */
export function countObjectives(entry?: Partial<DayEntry>): ObjectiveCount {
  const total = 3
  if (!entry) return { completed: 0, total, pct: 0 }

  const completed =
    (entry.doneMorning ? 1 : 0) +
    (entry.doneMidday ? 1 : 0) +
    (entry.doneActivity ? 1 : 0)

  const pct = Math.round((completed / total) * 100)
  return { completed, total, pct }
}

export default countObjectives
