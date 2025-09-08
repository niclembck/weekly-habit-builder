// src/components/MonthMini.tsx
import React from 'react'
import { Day, DayEntry } from '../types'
import { countObjectives } from '../utils/countObjectives'
import {
  toValidDate,
  startOfMonth,
  endOfMonth,
  startOfWeekMonday,
  addDays,
} from '../utils/dates'

type Props = {
  monthAnchor: Date
  week: Record<Day, DayEntry>
  dates: Record<Day, Date>
  onSelectDay?: (d: Day) => void
  cellSize?: number
}

const DAYS_LABELS = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'] as const
const DAY_KEYS: Day[] = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']

function toValidDate(v: any): Date {
  // Always clone so callers can't mutate the original reference
  const d =
    v instanceof Date ? new Date(v.getTime())
    : new Date(v);
  return isNaN(d.getTime()) ? new Date() : d;
}

function sameDay(a?: Date, b?: Date) {
  if (!a || !b) return false
  return toValidDate(a).toDateString() === toValidDate(b).toDateString()
}
function safeFormat(d?: Date, opts?: Intl.DateTimeFormatOptions) {
  if (!d) return ''
  const x = toValidDate(d)
  return isNaN(x.getTime()) ? '' : x.toLocaleDateString(undefined, opts)
}
function startOfMonth(d: Date) { const x = toValidDate(d); x.setDate(1); x.setHours(0,0,0,0); return x }
function endOfMonth(d: Date)   { const x = toValidDate(d); x.setMonth(x.getMonth()+1,0); x.setHours(0,0,0,0); return x }
function startOfWeekMonday(d: Date) {
  const x = toValidDate(d)
  const day = (x.getDay() || 7)
  if (day !== 1) x.setDate(x.getDate() - (day - 1))
  x.setHours(0,0,0,0)
  return x
}
function addDays(d: Date, n: number) { const x = toValidDate(d); x.setDate(x.getDate() + n); return x }

export default function MonthMini({
  monthAnchor,
  week,
  dates,
  onSelectDay,
  cellSize = 18,
}: Props) {
  const anchor = React.useMemo(() => toValidDate(monthAnchor), [monthAnchor])
  const today  = React.useMemo(() => new Date(), [])

  const mo = startOfMonth(anchor)
  const lo = endOfMonth(anchor)

  const gridStart = startOfWeekMonday(mo)
  const gridEnd   = addDays(startOfWeekMonday(addDays(lo, 7)), -1)

  const days: Date[] = []
  for (let d = new Date(gridStart); d <= gridEnd; d = addDays(d, 1)) days.push(new Date(d))

  const weekMap = React.useMemo(() => {
    const m = new Map<string, Day>()
    for (const dk of DAY_KEYS) {
      const dt = dates[dk]
      if (dt) m.set(toValidDate(dt).toDateString(), dk)
    }
    return m
  }, [dates])

  function bgForPct(pct: number) {
    const a =
      pct >= 100 ? 1.0 :
      pct >= 75  ? 0.8 :
      pct >= 50  ? 0.6 :
      pct >= 25  ? 0.4 : 0.22
    return `color-mix(in srgb, var(--accent) ${Math.round(a*100)}%, transparent)`
  }

  const size = cellSize
  const cellStyle: React.CSSProperties = {
    width: size, height: size,
    borderRadius: 6,
    border: '1px solid color-mix(in srgb, var(--border) 70%, transparent)',
    display: 'grid', placeItems: 'center',
    fontSize: 10, lineHeight: 1, userSelect: 'none',
  }

  const currentWeekDates = new Set<string>(Object.values(dates).map(d => d ? toValidDate(d).toDateString() : ''))

  const monthLabel = anchor.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })

  return (
    <div className="monthmini" style={{ display:'grid', gap: 8 }}>
      <div className="flex items-center justify-between">
        <div className="muted text-xs">{monthLabel}</div>
        <div className="flex items-center gap-2">
          <span className="muted text-[10px]">Completion</span>
          <span title="low"  style={{ width:10, height:10, borderRadius:2, background:bgForPct(25),  display:'inline-block' }} />
          <span title="med"  style={{ width:10, height:10, borderRadius:2, background:bgForPct(50),  display:'inline-block' }} />
          <span title="high" style={{ width:10, height:10, borderRadius:2, background:bgForPct(100), display:'inline-block' }} />
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {DAYS_LABELS.map(lbl => (
          <div key={lbl} className="muted text-[10px] text-center" style={{ paddingBottom: 2 }}>
            {lbl}
          </div>
        ))}
      </div>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {days.map((raw) => {
          const d = toValidDate(raw)
          const inMonth = d.getMonth() === mo.getMonth()
          const isToday = sameDay(d, today)
          const dKey = weekMap.get(d.toDateString())
          const pct = dKey ? countObjectives(week[dKey]).pct : null

          const bg = pct != null ? bgForPct(pct) : (inMonth ? 'rgba(148,163,184,.14)' : 'transparent')
          const fg = inMonth ? 'var(--title)' : 'var(--meta)'
          const title = safeFormat(d, { weekday:'short', month:'short', day:'numeric' }) +
            (pct != null ? ` — ${pct}% complete` : '')

          const outline = currentWeekDates.has(d.toDateString())
            ? '1px solid color-mix(in srgb, var(--accent) 40%, transparent)'
            : '1px solid color-mix(in srgb, var(--border) 70%, transparent)'

          const onClick = dKey && onSelectDay ? () => onSelectDay(dKey) : undefined

          return (
            <button
              key={d.toISOString()}
              type="button"
              title={title}
              onClick={onClick}
              className="monthmini__cell"
              aria-label={title}
              style={{
                ...cellStyle,
                background: bg,
                color: fg,
                border: outline,
                position:'relative',
                opacity: inMonth ? 1 : 0.55,
                cursor: dKey && onSelectDay ? 'pointer' : 'default',
              }}
            >
              <span style={{ fontSize: 10, opacity: 0.9 }}>{d.getDate()}</span>
              {isToday && (
                <span
                  aria-hidden
                  style={{
                    position:'absolute',
                    inset:-2,
                    borderRadius:8,
                    border:'1px solid color-mix(in srgb, var(--accent) 60%, #fff 0%)'
                  }}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
