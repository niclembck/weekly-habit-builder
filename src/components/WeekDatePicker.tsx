import * as React from 'react'

type Props = {
  value: Date
  onChange: (next: Date | string) => void
}

function toYMD(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function WeekDatePicker({ value, onChange }: Props) {
  return (
    <label className="muted text-xs flex items-center gap-2">
      <span>Week of</span>
      <input
        type="date"
        className="input"
        value={toYMD(value)}
        onChange={(e) => onChange(e.target.value)}
        aria-label="Select week start"
      />
    </label>
  )
}
