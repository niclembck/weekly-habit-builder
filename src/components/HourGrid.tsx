import React from 'react'
import { toMin, toHHMM } from '../utils/time'

type BlockKey = 'morning' | 'midday' | 'activity'

type Props = {
  // day entry fields (read-only values)
  morningActualStart?: string; morningActualEnd?: string
  middayActualStart?: string;  middayActualEnd?: string
  activityActualStart?: string; activityActualEnd?: string
  // suggested defaults (for ghost hints)
  suggested?: {
    morning?: { start: string, end: string }
    midday?:  { start: string, end: string }
    activity?:{ start: string, end: string }
  }
  // patch into DayCard entry
  onChange: (patch: Partial<any>) => void
  // visual options
  startHour?: number // default 6
  endHour?: number   // default 22
}

const COLORS: Record<BlockKey, string> = {
  morning:  'var(--accent)',
  midday:   'color-mix(in srgb, var(--accent) 70%, #fff 30%)',
  activity: 'color-mix(in srgb, var(--accent) 55%, #fff 45%)',
}

export default function HourGrid({
  morningActualStart, morningActualEnd,
  middayActualStart,  middayActualEnd,
  activityActualStart, activityActualEnd,
  suggested,
  onChange,
  startHour = 6,
  endHour = 22,
}: Props) {

  const MIN = startHour * 60
  const MAX = endHour   * 60
  const RANGE = MAX - MIN

  // snap to 15 minutes
  const snap15 = (m: number) => Math.round(m / 15) * 15
  const clamp  = (m: number) => Math.max(MIN, Math.min(MAX, m))

  type DragState = {
    kind: 'move' | 'resize-start' | 'resize-end'
    which: BlockKey
    startMin: number
    endMin: number
    originX: number
  } | null

  const [drag, setDrag] = React.useState<DragState>(null)
  const ref = React.useRef<HTMLDivElement | null>(null)

  // turn an X offset into minutes
  const pxToMin = (px: number) => {
    const el = ref.current
    if (!el) return MIN
    const rect = el.getBoundingClientRect()
    const w = rect.width
    const ratio = Math.max(0, Math.min(1, (px - rect.left) / w))
    return Math.round(MIN + ratio * RANGE)
  }

  const getBlockTimes = (k: BlockKey) => {
    if (k === 'morning')  return [toMin(morningActualStart, suggested?.morning?.start),  toMin(morningActualEnd, suggested?.morning?.end)]
    if (k === 'midday')   return [toMin(middayActualStart,  suggested?.midday?.start),   toMin(middayActualEnd,  suggested?.midday?.end)]
    return [toMin(activityActualStart, suggested?.activity?.start), toMin(activityActualEnd, suggested?.activity?.end)]
  }

  const setBlockTimes = (k: BlockKey, sMin: number, eMin: number) => {
    const start = toHHMM(clamp(snap15(sMin)))
    const end   = toHHMM(clamp(snap15(eMin)))
    if (k === 'morning')  onChange({ morningActualStart: start,  morningActualEnd: end })
    else if (k === 'midday') onChange({ middayActualStart: start,   middayActualEnd: end })
    else onChange({ activityActualStart: start, activityActualEnd: end })
  }

  const onMouseDownBlock = (e: React.MouseEvent, which: BlockKey, kind: DragState['kind']) => {
    // prevent text selection
    e.preventDefault()
    const [s, end] = getBlockTimes(which)
    setDrag({
      kind,
      which,
      startMin: s,
      endMin: end,
      originX: e.clientX,
    })
  }

  React.useEffect(() => {
    if (!drag) return
    const onMove = (e: MouseEvent) => {
      const el = ref.current
      if (!el) return
      const { kind, which, startMin, endMin } = drag

      if (kind === 'move') {
        const curr = pxToMin(e.clientX)
        // compute delta from origin-left edge (approximate by aligning origin)
        const delta = snap15(curr) - snap15(pxToMin(drag.originX))
        let s = clamp(startMin + delta)
        let ed = clamp(endMin + delta)
        // keep duration constant
        const dur = ed - s
        if (s < MIN) { s = MIN; ed = s + dur }
        if (ed > MAX) { ed = MAX; s = ed - dur }
        setBlockTimes(which, s, ed)
      } else if (kind === 'resize-start') {
        const curr = clamp(pxToMin(e.clientX))
        const s = Math.min(curr, endMin - 15)
        setBlockTimes(which, s, endMin)
      } else { // resize-end
        const curr = clamp(pxToMin(e.clientX))
        const ed = Math.max(curr, startMin + 15)
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

  // helper to style a block
  const styleFor = (s: number, e: number) => {
    const leftPct = ((s - MIN) / RANGE) * 100
    const wPct = ((e - s) / RANGE) * 100
    return { left: `${leftPct}%`, width: `${wPct}%` }
  }

  const HourMarks = React.useMemo(() => {
    const marks = []
    for (let h = startHour; h <= endHour; h++) {
      marks.push(
        <div key={h} className="hour-grid__mark">
          <div className="hour-grid__tick" />
          <div className="hour-grid__label">{String(h).padStart(2,'0')}:00</div>
        </div>
      )
    }
    return marks
  }, [startHour, endHour])

  const renderBlock = (k: BlockKey, label: string) => {
    const [s, e] = getBlockTimes(k)
    return (
      <div className="hour-grid__block" style={{ ...styleFor(s,e), background: COLORS[k] }}>
        <div className="hour-grid__handle handle--start" onMouseDown={(ev)=>onMouseDownBlock(ev, k, 'resize-start')} />
        <div className="hour-grid__drag" onMouseDown={(ev)=>onMouseDownBlock(ev, k, 'move')}>
          <span className="hour-grid__drag-label">{label}</span>
          <span className="hour-grid__time">{toHHMM(s)}–{toHHMM(e)}</span>
        </div>
        <div className="hour-grid__handle handle--end" onMouseDown={(ev)=>onMouseDownBlock(ev, k, 'resize-end')} />
      </div>
    )
  }

  // Optional “ghost” suggested slots in the background
  const ghost = (sl?: {start:string,end:string}) => {
    if (!sl) return null
    const s = toMin(sl.start), e = toMin(sl.end)
    return <div className="hour-grid__ghost" style={styleFor(s,e)} />
  }

  return (
    <div className="hour-grid">
      <div className="hour-grid__rail" ref={ref}>
        {/* ghosts */}
        {ghost(suggested?.morning)}
        {ghost(suggested?.midday)}
        {ghost(suggested?.activity)}
        {/* blocks */}
        {renderBlock('morning', 'Morning')}
        {renderBlock('midday', 'Midday')}
        {renderBlock('activity', 'Activity')}
        {/* marks */}
        <div className="hour-grid__marks">{HourMarks}</div>
      </div>
    </div>
  )
}
