// src/components/WeekDatePicker.tsx
import * as React from 'react'

type Props = {
  value?: Date
  onChange?: (next: Date) => void
}

export default function WeekDatePicker({ value, onChange }: Props) {
  const yyyyMmDd = React.useMemo(() => {
    if (!(value instanceof Date) || isNaN(value.getTime())) return ''
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [value])

  // Parse "YYYY-MM-DD" as a LOCAL date to avoid UTC shifting
  function parseLocalYmd(s: string): Date {
    const [y, m, d] = s.split('-').map(n => parseInt(n, 10))
    return new Date(y, (m ?? 1) - 1, d ?? 1) // local midnight
  }

  return (
    <label className="muted text-xs flex items-center gap-2">
      <span>Week of</span>
      <input
        type="date"
        className="input"
        value={yyyyMmDd}
        onChange={(e) => {
          const v = e.target.value
          if (!v) return
          const d = parseLocalYmd(v)
          if (!isNaN(d.getTime())) onChange?.(d)
        }}
        aria-label="Select week start"
      />
    </label>
  )
}
