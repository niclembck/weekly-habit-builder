// src/components/DayCard.tsx
import React, { useMemo } from 'react'
import { Day, SuggestedSlots } from '../types'
import HourGridVertical from './HourGridVertical'
import BlockFlyout from './BlockFlyout'

type SlotKey = 'morning'|'midday'|'activity'

type Props = {
  collapsible?: boolean
  day: Day
  date: Date
  entry: any
  projects: string[]
  activityColors: Record<string,string>
  projectEmojis: Record<string,string>
  activityEmojis: Record<string,string>
  onChange: (patch: Partial<any>) => void
  onEnsureActivity: (name: string) => void
  onToast?: (msg: string) => void
  suggestedSlots?: SuggestedSlots
}

function withEmoji(label: string, emoji?: string) {
  return (emoji ? (emoji + ' ') : '') + label
}

function Pill({ text, done }: { text: string, done?: boolean }){
  return (
    <span className={"px-2 py-1 text-xs rounded-full border " + (done ? 'opacity-100' : 'opacity-70')}>
      {text}
    </span>
  )
}

export default function DayCard(props: Props) {
  const {
    collapsible = false,
    day, date, entry,
    projects, activityColors, projectEmojis, activityEmojis,
    onChange, onEnsureActivity, onToast,
    suggestedSlots
  } = props

  const dateLabel = useMemo(
    () => date.toLocaleDateString(undefined, { month:'short', day:'numeric' }),
    [date]
  )

  // —— Flyout state & helpers ——
  const [editing, setEditing] = React.useState<SlotKey|null>(null)
  const openEdit  = (slot: SlotKey) => setEditing(slot)
  const closeEdit = () => setEditing(null)

  // Grid will call this when a block is clicked
  const handleGridEdit = (slot: SlotKey) => openEdit(slot)

  function handleCheck(field: 'doneMorning'|'doneMidday'|'doneActivity', label: string){
    return (e: React.ChangeEvent<HTMLInputElement>) => {
      onChange({ [field]: e.target.checked } as any)
      if (e.target.checked && onToast) onToast(label + ' completed')
    }
  }

  // Derive current slot values for the flyout
  function slotValue(slot: SlotKey) {
    if (slot === 'morning') {
      return {
        project: entry.morningProject,
        done: !!entry.doneMorning,
        notes: entry.morningNotes,
        start: entry.morningActualStart,
        end: entry.morningActualEnd,
      }
    } else if (slot === 'midday') {
      return {
        project: entry.middayProject,
        done: !!entry.doneMidday,
        notes: entry.middayNotes,
        start: entry.middayActualStart,
        end: entry.middayActualEnd,
      }
    }
    return {
      activity: entry.activity,
      done: !!entry.doneActivity,
      notes: entry.activityNotes,
      start: entry.activityActualStart,
      end: entry.activityActualEnd,
    }
  }

  const suggestedFor = (slot: SlotKey) => {
    const s = suggestedSlots
    if (!s) return undefined
    if (slot === 'morning') return s.morning
    if (slot === 'midday')  return s.midday
    return s.activity
  }

  // ——— Header: day + date (kept minimal) ———
  const header = (
    <div className="p-5 flex items-center justify-between">
      <div className="flex items-baseline gap-2">
        <div className="text-base font-semibold" style={{color:'var(--title)'}}>{day}</div>
        <div className="muted text-sm">• {dateLabel}</div>
      </div>
      {entry.therapy && (
        <span className="ml-4 text-[11px] font-medium px-2 py-1 rounded-full border border-border" style={{color:'var(--accent)'}}>
          Therapy @ 6pm (biweekly)
        </span>
      )}
    </div>
  )

  const body = (
    <div className="p-5 pt-0">
      {/* Summary line (read-only; editing now happens via grid click → flyout) */}
      <div className="collapsed-summary flex flex-wrap items-center gap-2 mb-4">
        <Pill text={'AM: ' + withEmoji(entry.morningProject || '—', projectEmojis[entry.morningProject])} done={!!entry.doneMorning} />
        <Pill text={'Mid: ' + withEmoji(entry.middayProject || '—', projectEmojis[entry.middayProject])} done={!!entry.doneMidday} />
        <Pill text={'Act: ' + withEmoji(entry.activity || '—', activityEmojis[entry.activity])} done={!!entry.doneActivity} />
        {typeof entry.mood === 'number' && <span className="muted">• Mood {entry.mood}</span>}
      </div>

      <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
        {/* MAIN COLUMN: Vertical hour grid only (click blocks to edit) */}
        <div className="grid gap-4">
          <HourGridVertical
            morningActualStart={entry.morningActualStart}
            morningActualEnd={entry.morningActualEnd}
            middayActualStart={entry.middayActualStart}
            middayActualEnd={entry.middayActualEnd}
            activityActualStart={entry.activityActualStart}
            activityActualEnd={entry.activityActualEnd}
            suggested={{
              morning:  suggestedSlots?.morning,
              midday:   suggestedSlots?.midday,
              activity: suggestedSlots?.activity,
            }}
            onChange={onChange}
            onEdit={handleGridEdit}   // <-- NEW: open flyout from grid
            startHour={6}
            endHour={22}
            hourPx={48}
            // (Optional) completion toggles from small badges on blocks
            onToggleDone={(slot) => {
              if (slot === 'morning') onChange({ doneMorning: !entry.doneMorning })
              else if (slot === 'midday') onChange({ doneMidday: !entry.doneMidday })
              else onChange({ doneActivity: !entry.doneActivity })
            }}
          />

          {/* Small completion toggles below grid (kept, minimal) */}
          <div className="grid grid-cols-3 gap-2">
            <label className="right">
              <input type="checkbox" className="w-4 h-4"
                checked={!!entry.doneMorning}
                onChange={handleCheck('doneMorning','Morning Work')}
              /> Morning done
            </label>
            <label className="right">
              <input type="checkbox" className="w-4 h-4"
                checked={!!entry.doneMidday}
                onChange={handleCheck('doneMidday','Midday Work')}
              /> Midday done
            </label>
            <label className="right">
              <input type="checkbox" className="w-4 h-4"
                checked={!!entry.doneActivity}
                onChange={handleCheck('doneActivity','Activity')}
              /> Activity done
            </label>
          </div>
        </div>

        {/* SIDEBAR: kept on-card (not part of flyout) */}
        <div className="grid gap-4">
          <div className="subcard">
            <div className="subhead"><div className="label">💡 Gratitude</div></div>
            <textarea
              className="textarea"
              value={entry.gratitude ?? ''}
              onChange={(e)=> onChange({ gratitude: e.target.value })}
              placeholder="What lifted you up today?"
            />
          </div>

          <div className="subcard">
            <div className="subhead"><div className="label">🙂 Mood</div></div>
            <input
              type="number" min={1} max={5}
              className="input w-24"
              value={entry.mood ?? ''}
              onChange={(e)=> onChange({ mood: e.target.value ? Number(e.target.value) : null })}
              placeholder="1–5"
            />
          </div>

          <div className="subcard">
            <div className="subhead"><div className="label">📝 Notes</div></div>
            <textarea
              className="textarea"
              value={entry.notes ?? ''}
              onChange={(e)=> onChange({ notes: e.target.value })}
              placeholder="Key tasks, reminders, blockers…"
            />
          </div>
        </div>
      </div>

      {/* Contextual details flyout (now the only place for block details) */}
      <BlockFlyout
        open={editing !== null}
        slot={editing}
        onClose={closeEdit}
        value={editing ? slotValue(editing) : {}}
        projects={projects}
        activityColors={activityColors}
        projectEmojis={projectEmojis}
        activityEmojis={activityEmojis}
        suggested={editing ? suggestedFor(editing) : undefined}
        onChange={onChange}
        onEnsureActivity={onEnsureActivity}
      />
    </div>
  )

  if (collapsible) {
    return (
      <details className="card overflow-hidden" open>
        <summary className="list-none cursor-pointer select-none">{header}</summary>
        <div className="border-t border-border">{body}</div>
      </details>
    )
  }

  return (
    <div className="card overflow-hidden">
      {header}
      <div className="border-t border-border">{body}</div>
    </div>
  )
}
