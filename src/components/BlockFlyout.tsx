import React from 'react';
import { createPortal } from 'react-dom';

type SlotKey = 'morning' | 'midday' | 'activity';

type Props = {
  open: boolean;
  slot: SlotKey | null;            // which block we’re editing
  onClose: () => void;
  // current values for the selected slot
  value: {
    project?: string;              // morning/midday
    activity?: string;             // activity
    done?: boolean;
    notes?: string;
    start?: string;                // HH:mm
    end?: string;                  // HH:mm
  };
  // global lists/config
  projects: string[];
  activityColors: Record<string, string>;
  projectEmojis: Record<string, string>;
  activityEmojis: Record<string, string>;
  suggested?: { start?: string; end?: string };
  // “apply” patch outward
  onChange: (patch: any) => void;
  onEnsureActivity: (name: string) => void;
};

function labelFor(slot: SlotKey) {
  if (slot === 'morning') return 'Morning Work';
  if (slot === 'midday')  return 'Midday Work';
  return 'Activity';
}

function withEmoji(label: string, emoji?: string) {
  return (emoji ? (emoji + ' ') : '') + label;
}

export default function BlockFlyout({
  open, slot, onClose,
  value, projects, activityColors, projectEmojis, activityEmojis,
  suggested, onChange, onEnsureActivity
}: Props) {
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open || !slot) return null;

  // map outward keys per slot
  const map = {
    projectKey: slot === 'activity' ? 'activity' : (slot === 'morning' ? 'morningProject' : 'middayProject'),
    doneKey:    slot === 'activity' ? 'doneActivity' : (slot === 'morning' ? 'doneMorning' : 'doneMidday'),
    notesKey:   slot === 'activity' ? 'activityNotes' : (slot === 'morning' ? 'morningNotes' : 'middayNotes'),
    startKey:   slot === 'activity' ? 'activityActualStart' : (slot === 'morning' ? 'morningActualStart' : 'middayActualStart'),
    endKey:     slot === 'activity' ? 'activityActualEnd'   : (slot === 'morning' ? 'morningActualEnd'   : 'middayActualEnd'),
  } as const;

  const body = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="whb-flyout-title"
      className="fixed inset-0 z-[70] flex"
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel (right side) */}
      <div className="ml-auto h-full w-[min(480px,92vw)] bg-[color:var(--surface)] border-l border-[color:var(--border)] shadow-2xl relative">
        <div className="p-4 border-b border-[color:var(--border)] flex items-center justify-between">
          <div id="whb-flyout-title" className="text-base font-semibold" style={{color:'var(--title)'}}>
            Edit {labelFor(slot)}
          </div>
          <button className="btn" onClick={onClose}>Close</button>
        </div>

        <div className="p-4 grid gap-4">
          {/* Completed */}
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="w-4 h-4"
              checked={!!value.done}
              onChange={(e) => onChange({ [map.doneKey]: e.target.checked })}
            />
            <span className="muted">Mark as completed</span>
          </label>

          {/* Selection */}
          {slot !== 'activity' ? (
            <div className="grid gap-2">
              <div className="text-sm font-medium" style={{color:'var(--title)'}}>Project</div>
              <div className="flex items-center gap-2">
                <select
                  className="select"
                  value={value.project ?? ''}
                  onChange={(e) => onChange({ [map.projectKey]: e.target.value })}
                >
                  {projects.map(p => (
                    <option key={p} value={p}>{withEmoji(p, projectEmojis[p])}</option>
                  ))}
                  <option value="">Custom…</option>
                </select>
                {value.project === '' && (
                  <input
                    className="input"
                    placeholder="Custom project…"
                    value={value.project ?? ''}
                    onChange={(e)=> onChange({ [map.projectKey]: e.target.value })}
                  />
                )}
              </div>
            </div>
          ) : (
            <div className="grid gap-2">
              <div className="text-sm font-medium" style={{color:'var(--title)'}}>Activity</div>
              <div className="flex items-center gap-2">
                <select
                  className="select"
                  value={value.activity ?? ''}
                  onChange={(e) => onChange({ [map.projectKey]: e.target.value })}
                >
                  {Object.keys(activityColors).map(a => (
                    <option key={a} value={a}>{withEmoji(a, activityEmojis[a])}</option>
                  ))}
                  <option value="">Custom…</option>
                </select>
                {value.activity === '' && (
                  <input
                    className="input"
                    placeholder="Custom activity…"
                    value={value.activity ?? ''}
                    onChange={(e)=> {
                      onChange({ [map.projectKey]: e.target.value });
                      onEnsureActivity(e.target.value);
                    }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Time window */}
          <div className="grid gap-2">
            <div className="text-sm font-medium" style={{color:'var(--title)'}}>Time</div>
            <div className="flex items-center gap-2">
              <input
                type="time"
                className="input"
                value={value.start ?? ''}
                onChange={(e)=> onChange({ [map.startKey]: e.target.value })}
              />
              <span className="muted">to</span>
              <input
                type="time"
                className="input"
                value={value.end ?? ''}
                onChange={(e)=> onChange({ [map.endKey]: e.target.value })}
              />
            </div>
            {suggested?.start && suggested?.end && (
              <div className="flex items-center flex-wrap gap-2">
                <span className="muted text-xs">Suggested:</span>
                <button
                  className="btn"
                  onClick={()=> onChange({ [map.startKey]: suggested.start, [map.endKey]: suggested.end })}
                >
                  {suggested.start}–{suggested.end}
                </button>
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="grid gap-2">
            <div className="text-sm font-medium" style={{color:'var(--title)'}}>Notes</div>
            <textarea
              className="textarea"
              placeholder="Add details…"
              value={value.notes ?? ''}
              onChange={(e)=> onChange({ [map.notesKey]: e.target.value })}
            />
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(body, document.body);
}
