// src/components/DayChip.tsx
import React from "react"
import { Day } from "../types"

export type DayCounts = { completed: number; total: number; pct: number }

type Props = {
  day: Day
  date?: Date
  counts: DayCounts
  selected?: boolean
  isToday?: boolean
  onSelect?: () => void
  tabId?: string
  panelId?: string
}

export default function DayChip({
  day, date, counts, selected = false, isToday = false, onSelect, tabId, panelId
}: Props) {
  const dateLabel = date
    ? date.toLocaleDateString(undefined, { month: "short", day: "numeric" })
    : ""

  return (
    <button
      id={tabId}
      role="tab"
      aria-selected={selected}
      aria-controls={panelId}
      onClick={onSelect}
      title={`Select ${day}`}
      className={[
        "flex-1 min-w-[120px] rounded-xl border px-3 py-2 text-left transition",
        "bg-[color:var(--surface)] border-[color:var(--border)] hover:border-[color:var(--accent)]/60",
        selected && "border-[color:var(--accent)] ring-2 ring-[color:var(--accent)]",
        "focus:outline-none focus:ring-2 focus:ring-[color:var(--accent)]"
      ].filter(Boolean).join(" ")}
    >
      <div className="flex items-center gap-2">
        <div className="text-[11px] uppercase tracking-wide text-[color:var(--meta)]">{day}</div>
        {isToday && (
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-[color:var(--accent)]/15 text-[color:var(--accent)]">
            Today
          </span>
        )}
      </div>

      <div data-testid="daychip-date" className="text-sm font-semibold text-[color:var(--title)]">{dateLabel}</div>

      {/* tiny progress bar */}
      <div className="mt-2 h-1.5 w-full rounded bg-[color:var(--border)]/60 overflow-hidden" aria-hidden>
        <div
          className="h-full rounded bg-[color:var(--accent)] transition-[width]"
          style={{ width: `${counts.pct}%` }}
        />
      </div>

      <div className="mt-1 text-[12px] text-[color:var(--meta)]">
        {counts.completed} of {Math.max(counts.total, 0)} completed
      </div>
    </button>
  )
}
