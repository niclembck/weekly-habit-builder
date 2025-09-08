// src/components/HourGridVertical.tsx
import React from 'react'
import { toMin, toHHMM } from '../utils/time'

type BlockKey = 'morning' | 'midday' | 'activity'

type Props = {
  morningActualStart?: string; morningActualEnd?: string
  middayActualStart?: string;  middayActualEnd?: string
  activityActualStart?: string; activityActualEnd?: string
  suggested?: {
    morning?: { start: string, end: string }
    midday?:  { start: string, end: string }
    activity?:{ start: string, end: string }
  }
  labels?: Partial<Record<BlockKey, string>>
  onChange: (patch: Partial<any>) => void

  /** Selection + UX hooks */
  active?: BlockKey | null
  onSelect?: (which: BlockKey) => void
  onRequestFocusTimes?: (which: BlockKey, whichField: 'start' | 'end' | 'both') => void
  onNudgeRequest?: (which: BlockKey, minutesDelta: number) => void

  /** Optional: open your flyout from here */
  onOpenFlyout?: (which: BlockKey) => void

  /** Behavior */
  preventOverlap?: boolean

  startHour?: number  // default 6
  endHour?: number    // default 22
  hourPx?: number     // pixels per hour (default 48)

  /** old alias kept for compatibility in tests */
  onEdit?: (which: BlockKey) => void
}

const DEFAULT_COLORS: Record<BlockKey, string> = {
  morning:  'var(--accent)',
  midday:   'color-mix(in srgb, var(--accent) 70%, #fff 30%)',
  activity: 'color-mix(in srgb, var(--accent) 55%, #fff 45%)',
}

/** synthesize safe non-overlapping windows if nothing provided */
function autoDefaults(startHour: number, endHour: number) {
  const min = startHour * 60
  const max = endHour   * 60
  const span = Math.max(6 * 60, max - min) // at least 6h span

  // simple “bands” that fit most days; adjust if compressed
  const m1s = min + Math.round(span * 0.15) // ~ 9:00 if start 6:00
  const m1e = m1s + 90                       // 1.5h

  const m2s = min + Math.round(span * 0.45)  // ~ 13:30
  const m2e = m2s + 120                      // 2h

  const a1s = min + Math.round(span * 0.75)  // ~ 17:30
  const a1e = a1s + 60                       // 1h

  const clamp = (m: number) => Math.max(min, Math.min(max, m))
  const fix = (s: number, e: number, minDur = 30) => {
    s = clamp(s); e = clamp(e)
    if (e - s < minDur) e = Math.min(max, s + minDur)
    return [s, e] as const
  }

  return {
    morning:  fix(m1s, m1e, 45),
    midday:   fix(m2s, m2e, 45),
    activity: fix(a1s, a1e, 30),
  }
}

export default function HourGridVertical({
  morningActualStart, morningActualEnd,
  middayActualStart,  middayActualEnd,
  activityActualStart, activityActualEnd,
  suggested,
  labels,
  onChange,
  active = null,
  onSelect,
  onRequestFocusTimes,
  onNudgeRequest,
  onOpenFlyout,
  preventOverlap = false,
  startHour = 6,
  endHour = 22,
  hourPx = 48,
  onEdit, // compat alias
}: Props) {
  // ---- timeline math
  const MIN = startHour * 60
  const MAX = endHour   * 60
  const RANGE = Math.max(1, MAX - MIN)
  const railHeight = Math.max(0, (endHour - startHour) * hourPx)

  const snap   = (m: number) => Math.round(m / 15) * 15
  const clamp  = (m: number) => Math.max(MIN, Math.min(MAX, m))

  // ---- drag state
  type DragState = {
    kind: 'move' | 'resize-start' | 'resize-end'
    which: BlockKey
    startMin: number
    endMin: number
    originY: number
  } | null
  const [drag, setDrag] = React.useState<DragState>(null)
  const ref = React.useRef<HTMLDivElement | null>(null)

  // Turn various inputs into minutes or undefined
  const parseRange = (start?: string, end?: string, fallback?: {start?: string; end?: string}) => {
    const s = start ? toMin(start) : (fallback?.start ? toMin(fallback.start) : undefined)
    const e = end   ? toMin(end)   : (fallback?.end   ? toMin(fallback.end)   : undefined)
    return (typeof s === 'number' && typeof e === 'number' && e > s) ? [s, e] : undefined
  }

  // Effective ranges for render: actual → suggested → autoDefaults
  const effective = React.useMemo(() => {
    const auto = autoDefaults(startHour, endHour)

    const morningRaw  = parseRange(morningActualStart, morningActualEnd, suggested?.morning)
    const middayRaw   = parseRange(middayActualStart,  middayActualEnd,  suggested?.midday)
    const activityRaw = parseRange(activityActualStart,activityActualEnd,suggested?.activity)

    // seed with something valid
    let morning  = morningRaw  ?? auto.morning
    let midday   = middayRaw   ?? auto.midday
    let activity = activityRaw ?? auto.activity

    // coerce overlaps in order morning → midday → activity
    const minDur = { morning:45, midday:45, activity:30 } as const
    const ensure = (s: number, e: number, wantMin: number) => {
      s = clamp(s); e = clamp(e)
      if (e - s < wantMin) e = Math.min(MAX, s + wantMin)
      if (e <= s) e = Math.min(MAX, s + wantMin)
      return [s, e] as const
    }

    // keep midday ≥ morning.end
    if (midday[0] < morning[1]) midday = ensure(Math.max(morning[1], midday[0]), Math.max(morning[1] + minDur.midday, midday[1]), minDur.midday)
    // keep activity ≥ midday.end
    if (activity[0] < midday[1]) activity = ensure(Math.max(midday[1], activity[0]), Math.max(midday[1] + minDur.activity, activity[1]), minDur.activity)

    // Final clamp in bounds
    morning  = ensure(morning[0],  morning[1],  minDur.morning)
    midday   = ensure(midday[0],   midday[1],   minDur.midday)
    activity = ensure(activity[0], activity[1], minDur.activity)

    return { morning, midday, activity }
  }, [
    morningActualStart, morningActualEnd,
    middayActualStart,  middayActualEnd,
    activityActualStart,activityActualEnd,
    suggested, startHour, endHour
  ])

  // Mouse coord → minutes
  const pyToMin = (clientY: number) => {
    const el = ref.current
    if (!el) return MIN
    const rect = el.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / Math.max(1, rect.height)))
    return Math.round(MIN + ratio * RANGE)
  }

  // Persist new minutes to parent
  const setBlockTimes = (k: BlockKey, sMin: number, eMin: number) => {
    const start = toHHMM(clamp(snap(sMin)))
    const end   = toHHMM(clamp(snap(eMin)))
    if (k === 'morning')  onChange({ morningActualStart: start,  morningActualEnd: end })
    else if (k === 'midday') onChange({ middayActualStart: start,   middayActualEnd: end })
    else onChange({ activityActualStart: start, activityActualEnd: end })
  }

  // Optional overlap guard during drag
  const coerceNoOverlap = (which: BlockKey, s: number, e: number) => {
    if (!preventOverlap) return [clamp(s), clamp(e)] as const
    const ranges: Record<BlockKey, [number, number]> = {
      morning:  effective.morning,
      midday:   effective.midday,
      activity: effective.activity,
    }
    const keys: BlockKey[] = ['morning','midday','activity']
    for (const k of keys) {
      if (k === which) continue
      const [os, oe] = ranges[k]
      if (Math.max(s, os) < Math.min(e, oe)) {
        if (e > os && s < os) e = os
        else if (s < oe && e > oe) s = oe
      }
    }
    if (e - s < 15) e = s + 15
    return [clamp(s), clamp(e)] as const
  }

  const onMouseDownBlock = (e: React.MouseEvent, which: BlockKey, kind: DragState['kind']) => {
    e.preventDefault()
    onSelect?.(which)
    const [s, ed] = effective[which]
    setDrag({ kind, which, startMin: s, endMin: ed, originY: e.clientY })
  }

  React.useEffect(() => {
    if (!drag) return
    const onMove = (e: MouseEvent) => {
      const { kind, which, startMin, endMin, originY } = drag
      if (kind === 'move') {
        const curr = pyToMin(e.clientY)
        const delta = snap(curr) - snap(pyToMin(originY))
        let s = startMin + delta
        let ed = endMin + delta
        ;[s, ed] = coerceNoOverlap(which, s, ed)
        setBlockTimes(which, s, ed)
      } else if (kind === 'resize-start') {
        let s = clamp(pyToMin(e.clientY))
        s = Math.min(s, endMin - 15)
        ;[s] = coerceNoOverlap(which, s, endMin)
        setBlockTimes(which, s, endMin)
      } else {
        let ed = clamp(pyToMin(e.clientY))
        ed = Math.max(ed, startMin + 15)
        ;[, ed] = coerceNoOverlap(which, startMin, ed)
        setBlockTimes(which, startMin, ed)
      }
    }
    const onUp = () => setDrag(null)
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [drag]) // eslint-disable-line react-hooks/exhaustive-deps

  const styleFor = (s: number, e: number) => {
    const topPct = ((s - MIN) / RANGE) * 100
    const hPct   = ((e - s) / RANGE) * 100
    return { top: `${topPct}%`, height: `${hPct}%` }
  }

  const hourMarks = React.useMemo(() => {
    const out: React.ReactNode[] = []
    for (let h = startHour; h <= endHour; h++) {
      const t = ((h * 60 - MIN) / RANGE) * 100
      out.push(
        <div key={h} className="vgrid__mark" style={{ top: `${t}%` }}>
          <div className="vgrid__tick" />
          <div className="vgrid__label">{String(h).padStart(2, '0')}:00</div>
        </div>
      )
    }
    return out
  }, [startHour, endHour, MIN, RANGE])

  const ghost = (sl?: {start:string,end:string}) => {
    if (!sl) return null
    const s = toMin(sl.start), e = toMin(sl.end)
    if (!(s < e)) return null
    return <div className="vgrid__ghost" style={styleFor(s,e)} />
  }

  const renderBlock = (k: BlockKey) => {
    const [s, e] = effective[k]
    const label = labels?.[k] ?? (k[0].toUpperCase() + k.slice(1))
    const isActive = active === k
    return (
      <div
        className={`vgrid__block${isActive ? ' is-active' : ''}`}
        style={{ ...styleFor(s,e), background: DEFAULT_COLORS[k] }}
        role="button"
        aria-label={label}
        aria-pressed={isActive}
        tabIndex={0}
        onClick={() => { onSelect?.(k); onEdit?.(k); onOpenFlyout?.(k) }}
        onDoubleClick={() => onRequestFocusTimes?.(k, 'both')}
        onKeyDown={(ev) => {
          if (!isActive) return
          const step = ev.altKey ? 30 : ev.shiftKey ? 5 : 15
          if (ev.key === 'ArrowUp')  { ev.preventDefault(); onNudgeRequest?.(k, -step) }
          if (ev.key === 'ArrowDown'){ ev.preventDefault(); onNudgeRequest?.(k,  step) }
        }}
      >
        <div className="vgrid__handle handle--start" onMouseDown={(ev)=>onMouseDownBlock(ev, k, 'resize-start')} />
        <div className="vgrid__drag" onMouseDown={(ev)=>onMouseDownBlock(ev, k, 'move')}>
          <span className="vgrid__drag-label">{label}</span>
          <span className="vgrid__time">{toHHMM(s)}–{toHHMM(e)}</span>
        </div>
        <div className="vgrid__handle handle--end" onMouseDown={(ev)=>onMouseDownBlock(ev, k, 'resize-end')} />
      </div>
    )
  }

  return (
    <div className="vgrid" aria-label="Day timeline">
      <div className="vgrid__rail" ref={ref} style={{ height: railHeight }}>
        {/* ghosts (suggested) */}
        {ghost(suggested?.morning)}
        {ghost(suggested?.midday)}
        {ghost(suggested?.activity)}
        {/* blocks (always have safe effective times now) */}
        {renderBlock('morning')}
        {renderBlock('midday')}
        {renderBlock('activity')}
        {/* hour marks */}
        <div className="vgrid__marks">{hourMarks}</div>
      </div>
    </div>
  )
}
