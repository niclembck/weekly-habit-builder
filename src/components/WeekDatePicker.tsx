import * as React from 'react'

type Props = {
  value?: Date
  onChange?: (next: Date) => void
}

export default function WeekDatePicker({ value, onChange }: Props) {
  const yyyyMmDd = React.useMemo(() => {
    if (!(value instanceof Date)) return ''
    const y = value.getFullYear()
    const m = String(value.getMonth() + 1).padStart(2, '0')
    const d = String(value.getDate()).padStart(2, '0')
    return `${y}-${m}-${d}`
  }, [value])
  return (
    <label className="muted text-xs flex items-center gap-2">
      <span>Week of</span>
      <input
        type="date"
        className="input"
        value={yyyyMmDd}
        onChange={(e) => {
          const d = new Date(e.target.value) // emits a Date
          if (!isNaN(d.getTime())) onChange?.(d)
        }}
        aria-label="Select week start"
      />
    </label>
  )
}
