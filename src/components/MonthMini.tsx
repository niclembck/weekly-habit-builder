// src/components/MonthMini.tsx
import React from 'react'
import { Day, DayEntry } from '../types'
import { countObjectives } from '../utils/countObjectives'

type Props = {
  monthAnchor: Date
  week: Record<Day, DayEntry>
  dates: Record<Day, Date>
  onSelectDay?: (d: Day) => void
  /** Size of each day cell in px (square) */
  cellSize?: number
}

const DAYS: Day[] = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const dow = (d: Date) => d.getDay() // 0=Sun..6=Sat

export default function MonthMini({
  monthAnchor,
  week,
  dates,
  onSelectDay,
  cellSize = 18,
}: Props) {
  const year = monthAnchor.getFullYear()
  const month = monthAnchor.getMonth()

  // First day of month, and how many days it has
  const firstOfMonth = new Date(year, month, 1)
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Build a 6x7 grid of Dates covering the month (including leading/trailing days)
  const startOffset = (dow(firstOfMonth) + 6) % 7 // shift so Monday=0
  const grid: Date[] = []
  for (let i = 0; i < 42; i++) {
    const dayNum = i - startOffset + 1
    grid.push(new Date(year, month, dayNum))
  }

  // Reverse map: which Day enum corresponds to which date in the current displayed week
  const dayByDateString = new Map<string, Day>()
  for (const d of DAYS) {
    const dt = dates[d]
    if (dt) dayByDateString.set(dt.toDateString(), d)
  }

  const isSameMonth = (d: Date) => d.getMonth() === month
  const fmt = (d: Date) => d.toLocaleDateString(undefined, { day: 'numeric' })

  return (
    <div
      aria-label="Monthly heatmap"
      className="mini-month"
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(7, 1fr)',
        gap: 2,
        padding: 4,
        border: '1px solid var(--border)',
        borderRadius: 10,
        background: 'var(--surface)',
      }}
    >
      {grid.map((d, idx) => {
        const key = `${d.toDateString()}_${idx}`
        const dayEnum = dayByDateString.get(d.toDateString())
        const inThisMonth = isSameMonth(d)

        // Completion tint (only for days that exist in the current week)
        let pct = 0
        if (dayEnum) {
          const { pct: p } = countObjectives(week[dayEnum])
          pct = p
        }

        // Visuals
        const size = cellSize
        const base = 'color-mix(in srgb, var(--accent) 18%, transparent)'
        const tint =
          pct >= 90 ? 'color-mix(in srgb, var(--accent) 90%, transparent)' :
          pct >= 70 ? 'color-mix(in srgb, var(--accent) 70%, transparent)' :
          pct >= 40 ? 'color-mix(in srgb, var(--accent) 40%, transparent)' :
          pct >   0 ? 'color-mix(in srgb, var(--accent) 22%, transparent)' : base

        const bg = dayEnum ? tint : 'transparent'
        const color = inThisMonth ? 'var(--title)' : 'var(--meta)'

        // Clickable only if this cell corresponds to a Week day we know about
        const clickable = Boolean(dayEnum && onSelectDay)

        if (clickable) {
          return (
            <button
              key={key}
              type="button"
              className="mini-month__cell"
              aria-label={`Select ${dayEnum}`}
              onClick={() => onSelectDay?.(dayEnum!)}
              style={{
                width: size, height: size,
                borderRadius: 6,
                border: '1px solid var(--border)',
                background: bg,
                display: 'grid',
                placeItems: 'center',
                fontSize: 10,
                color,
                cursor: 'pointer',
              }}
              title={`${dayEnum}`}
            >
              {fmt(d)}
            </button>
          )
        }

        return (
          <div
            key={key}
            className="mini-month__cell--muted"
            style={{
              width: size, height: size,
              borderRadius: 6,
              border: '1px solid var(--border)',
              background: 'transparent',
              display: 'grid',
              placeItems: 'center',
              fontSize: 10,
              color,
            }}
            aria-hidden
          >
            {fmt(d)}
          </div>
        )
      })}
    </div>
  )
}
