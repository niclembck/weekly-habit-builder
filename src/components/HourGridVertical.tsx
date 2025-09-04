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
  /** Upstream setter for day entry fields */
  onChange: (patch: Partial<any>) => void

  /** Selection + UX hooks */
  active?: BlockKey | null
  onSelect?: (which: BlockKey) => void
  /** When user double-clicks a block, we can focus time inputs outside */
  onRequestFocusTimes?: (which: BlockKey, whichField: 'start' | 'end' | 'both') => void

  /** Keyboard nudge (if parent wants to bind keys globally) */
  onNudgeRequest?: (which: BlockKey, minutesDelta: number) => void

  /** Called when user wants to edit a block (opens flyout in parent) */
  onEdit?: (which: BlockKey) => void

  /** Behavior */
  preventOverlap?: boolean

  startHour?: number  // default 6
  endHour?: number    // default 22
  hourPx?: number     // pixels per hour (default 48)
}

const COLORS: Record<BlockKey, string> = {
  morning:  'var(--accent)',
  midday:   'color-mix(in srgb, var(--accent) 70%, #fff 30%)',
  activity: 'color-mix(in srgb, var(--accent) 55%, #fff 45%)',
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
  onEdit,
  preventOverlap = false,
  startHour = 6,
  endHour = 22,
  hourPx = 48,
}: Props) {
  const MIN = startHour * 60
  const MAX = endHour   * 60
  const RANGE = MAX - MIN
  const railHeight = Math.max(0, (endHour - startHour) * hourPx)

  const snap = (m: number) => Math.round(m / 15) * 15
  const clamp  = (m: number) => Math.max(MIN, Math.min(MAX, m))

  type DragState = {
    kind: 'move' | 'resize-start' | 'resize-end'
    which: BlockKey
    startMin: number
    endMin: number
    originY: number
  } | null

  const [drag, setDrag] = React.useState<DragState>(null)
  const ref = React.useRef<HTMLDivElement | null>(null)

  const pyToMin = (clientY: number) => {
    const el = ref.current
    if (!el) return MIN
    const rect = el.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (clientY - rect.top) / rect.height))
    return Math.round(MIN + ratio * RANGE)
  }

  const getBlockTimes = (k: BlockKey) => {
    if (k === 'morning')  return [toMin(morningActualStart, suggested?.morning?.start),  toMin(morningActualEnd, suggested?.morning?.end)]
    if (k === 'midday')   return [toMin(middayActualStart,  suggested?.midday?.start),   toMin(middayActualEnd,  suggested?.midday?.end)]
    return [toMin(activityActualStart, suggested?.activity?.start), toMin(activityActualEnd, suggested?.activity?.end)]
  }

  const setBlockTimes = (k: BlockKey, sMin: number, eMin: number) => {
    const start = toHHMM(clamp(snap(sMin)))
    const end   = toHHMM(clamp(snap(eMin)))
    if (k === 'morning')       onChange({ morningActualStart: start,  morningActualEnd: end })
    else if (k === 'midday')   onChange({ middayActualStart: start,   middayActualEnd: end })
    else                       onChange({ activityActualStart: start, activityActualEnd: end })
  }

  // Simple overlap guard (if enabled)
  const coerceNoOverlap = (which: BlockKey, s: number, e: number) => {
    if (!preventOverlap) return [s, e] as const
    const ranges: Record<BlockKey, [number, number]> = {
      morning:  getBlockTimes('morning') as [number, number],
      midday:   getBlockTimes('midday')  as [number, number],
      activity: getBlockTimes('activity')as [number, number],
    }
    const keys: BlockKey[] = ['morning','midday','activity']
    for (const k of keys) {
      if (k === which) continue
      const [os, oe] = ranges[k]
      // if overlap, snap the moved block tight against neighbor
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
    const [s, ed] = getBlockTimes(which)
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
  }, [startHour, endHour])

  const ghost = (sl?: {start:string,end:string}) => {
    if (!sl) return null
    const s = toMin(sl.start), e = toMin(sl.end)
    return <div className="vgrid__ghost" style={styleFor(s,e)} />
  }

  const renderBlock = (k: BlockKey) => {
    const [s, e] = getBlockTimes(k)
    const label = labels?.[k] ?? (k[0].toUpperCase() + k.slice(1))
    const isActive = active === k
    return (
      <div
        className={`vgrid__block${isActive ? ' is-active' : ''}`}
        style={{ ...styleFor(s,e), background: COLORS[k] }}
        role="button"
        aria-pressed={isActive}
        tabIndex={0}
        onKeyDown={(ev) => {
          if (!isActive) return
          const step =
            ev.altKey ? 30 :
            ev.shiftKey ? 5 : 15
          if (ev.key === 'ArrowUp')  { ev.preventDefault(); onNudgeRequest?.(k, -step) }
          if (ev.key === 'ArrowDown'){ ev.preventDefault(); onNudgeRequest?.(k,  step) }
        }}
      >
        <div
          className="vgrid__handle handle--start"
          onMouseDown={(ev)=>onMouseDownBlock(ev, k, 'resize-start')}
        />
        <div
          className="vgrid__drag"
          onMouseDown={(ev)=>onMouseDownBlock(ev, k, 'move')}
          onClick={() => { onSelect?.(k); onEdit?.(k) }}              // <-- open flyout on click
          onDoubleClick={() => onRequestFocusTimes?.(k, 'both')}      // keep dbl-click focus behavior
          title="Drag to move • Click to edit • Double-click to focus time inputs"
        >
          <span className="vgrid__drag-label">{label}</span>
          <span className="vgrid__time">{toHHMM(s)}–{toHHMM(e)}</span>
        </div>
        <div
          className="vgrid__handle handle--end"
          onMouseDown={(ev)=>onMouseDownBlock(ev, k, 'resize-end')}
        />
      </div>
    )
  }

  return (
    <div className="vgrid" aria-label="Day timeline">
      <div className="vgrid__rail" ref={ref} style={{ height: railHeight }}>
        {/* ghosts */}
        {ghost(suggested?.morning)}
        {ghost(suggested?.midday)}
        {ghost(suggested?.activity)}
        {/* blocks */}
        {renderBlock('morning')}
        {renderBlock('midday')}
        {renderBlock('activity')}
        {/* marks */}
        <div className="vgrid__marks">{hourMarks}</div>
      </div>
    </div>
  )
}
