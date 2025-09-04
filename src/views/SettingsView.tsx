import React, { useRef } from 'react'
import { useWeek } from '../hooks/useWeek'
import { ExportBundle } from '../types'

export default function SettingsView() {
  const { settings, setSettings, weekStart, week, setWeekStart, setWeek } = useWeek()
  const importRef = useRef<HTMLInputElement>(null)

  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings?.dark ? 'dark' : 'light')
  }, [settings?.dark])

  React.useEffect(() => {
    // simple map; adjust to your palette if needed
    const accent = { blue: '#60a5fa', teal: '#14b8a6', emerald: '#10b981' }[settings?.theme || 'blue']
    if (accent) document.documentElement.style.setProperty('--accent', accent)
  }, [settings?.theme])

  const saveSettings = (patch: Partial<typeof settings>) => setSettings({ ...settings, ...patch })

  const exportJSON = () => {
    const payload: ExportBundle = { weekStart, week, settings }
    const file = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(file)
    const a = document.createElement('a')
    a.href = url
    a.download = "weekly-habit-" + weekStart + ".json"
    a.click()
    URL.revokeObjectURL(url)
  }

  const importJSON = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as Partial<ExportBundle>
        if (data.settings) setSettings(data.settings as any)
        if (data.week) setWeek(data.week as any)
        if (data.weekStart) setWeekStart(data.weekStart as any)
        alert('Import complete.')
      } catch (e:any) {
        alert('Import failed: ' + e.message)
      } finally { if (importRef.current) importRef.current.value = '' }
    }
    reader.readAsText(file)
  }

  return (
    <main className="max-w-3xl mx-auto mt-6 grid gap-6 px-6 pb-12">
      <div className="card p-5">
        <div className="text-sm" style={{color:'var(--meta)'}}>Appearance</div>
        <div className="muted text-xs mt-1">Changes save automatically</div>
        <div className="mt-2 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="muted">Accent</span>
            <select className="select" value={settings.theme ?? 'blue'} onChange={(e)=> saveSettings({ theme: e.target.value as any })}>
              <option value="blue">Blue</option><option value="teal">Teal</option><option value="emerald">Emerald</option>
            </select>
          </div>
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={!!settings.dark} onChange={(e)=> saveSettings({ dark: e.target.checked })} />
            <span className="muted">Dark mode</span>
          </label>
        </div>
      </div>

      <div className="card p-5">
        <div className="text-sm" style={{color:'var(--meta)'}}>Data</div>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <button className="btn" onClick={exportJSON}>Export JSON</button>
          <button className="btn" onClick={()=> importRef.current?.click()}>Import JSON</button>
          <input ref={importRef} type="file" accept="application/json" className="hidden"
            onChange={(e)=> { const f = e.target.files?.[0]; if (f) importJSON(f) }} />
          <button className="btn" onClick={()=> window.print()}>Print</button>
        </div>
      </div>
    </main>
  )
}
