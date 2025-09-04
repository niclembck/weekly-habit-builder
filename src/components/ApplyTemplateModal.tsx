// src/components/ApplyTemplateModal.tsx
import React from "react"

type TemplateLike = { id: string; name: string }

export type ApplyScope = "entire" | "weekdays" | "weekends"
export type ApplyOptions = { overwrite: boolean; scope: ApplyScope }

type Props = {
  open: boolean
  template: TemplateLike | null
  onApply: (opts: ApplyOptions) => void
  onClose: () => void
}

export default function ApplyTemplateModal({ open, template, onApply, onClose }: Props) {
  const [opts, setOpts] = React.useState<ApplyOptions>({ overwrite: false, scope: "entire" })

  React.useEffect(() => {
    // reset when changing template/open
    setOpts({ overwrite: false, scope: "entire" })
  }, [template, open])

  if (!open || !template) return null

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", display: "grid", placeItems: "center", zIndex: 1000 }}>
      <div className="card p-5" style={{ width: 520 }}>
        <div className="text-xl font-semibold" style={{ color: "var(--title)" }}>Apply Template</div>
        <div className="muted mt-1">{template.name}</div>

        <div className="mt-4 grid gap-3">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={opts.overwrite}
              onChange={(e) => setOpts({ ...opts, overwrite: e.target.checked })}
            />
            <span className="muted">Overwrite existing selections (otherwise only blanks are filled)</span>
          </label>

          <div className="flex items-center gap-3">
            <span className="muted">Scope:</span>
            <label className="flex items-center gap-1">
              <input
                type="radio" name="scope" checked={opts.scope === "entire"}
                onChange={() => setOpts({ ...opts, scope: "entire" })}
              /> Entire week
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio" name="scope" checked={opts.scope === "weekdays"}
                onChange={() => setOpts({ ...opts, scope: "weekdays" })}
              /> Weekdays
            </label>
            <label className="flex items-center gap-1">
              <input
                type="radio" name="scope" checked={opts.scope === "weekends"}
                onChange={() => setOpts({ ...opts, scope: "weekends" })}
              /> Weekends
            </label>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-5">
          <button className="btn" onClick={onClose}>Cancel</button>
          <button className="btn" onClick={() => onApply(opts)}>Apply</button>
        </div>
      </div>
    </div>
  )
}
