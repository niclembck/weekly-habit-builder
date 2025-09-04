import React, { useState } from 'react'
import { useWeek } from '../hooks/useWeek'
import EmojiPicker from '../components/EmojiPicker'
import { captureWeekAsTemplate } from '../hooks/useWeek'

export default function LibraryView() {
  const { settings, setSettings } = useWeek()
  const [picker, setPicker] = useState<{ type: 'project'|'activity', key: string } | null>(null)

  const setProjects = (cb: (p: string[]) => string[]) => setSettings(prev => ({ ...prev, projects: cb(prev.projects) }))
  const setProjectEmojis = (cb: (m: Record<string,string>) => Record<string,string>) => setSettings(prev => ({ ...prev, projectEmojis: cb(prev.projectEmojis) }))
  const setActivityColors = (cb: (m: Record<string,string>) => Record<string,string>) => setSettings(prev => ({ ...prev, activityColors: cb(prev.activityColors) }))
  const setActivityEmojis = (cb: (m: Record<string,string>) => Record<string,string>) => setSettings(prev => ({ ...prev, activityEmojis: cb(prev.activityEmojis) }))

  const addProject = () => {
    const name = 'New Project'
    setProjects(p => [...p, name]); setProjectEmojis(e => ({ ...e, [name]: '' }))
  }
  const removeProject = (idx: number) => {
    const name = settings.projects[idx]
    setProjects(p => p.filter((_, i)=> i!==idx))
    setProjectEmojis(e => { const c = { ...e }; delete c[name]; return c })
  }
  const changeProjectName = (idx: number, newName: string) => {
    const old = settings.projects[idx]
    setProjects(prev => { const copy = [...prev]; copy[idx] = newName; return copy })
    setProjectEmojis(pe => { if (old === newName) return pe; const emo = pe[old] || ''; const ce = { ...pe }; delete ce[old]; ce[newName] = emo; return ce })
  }

  const addActivity = () => {
    let name = 'New Activity', i = 1
    while (settings.activityColors[name] || settings.activityEmojis[name]) name = 'New Activity ' + (++i)
    setActivityColors(c => ({ ...c, [name]: 'bg-neutral-100' })); setActivityEmojis(e => ({ ...e, [name]: '' }))
  }
  const removeActivity = (name: string) => {
    setActivityColors(c => { const n = { ...c }; delete n[name]; return n })
    setActivityEmojis(e => { const n = { ...e }; delete n[name]; return n })
  }
  const renameActivity = (oldName: string, newName: string) => {
    if (!newName || newName === oldName) return
    if (settings.activityColors[newName] || settings.activityEmojis[newName]) return
    setActivityColors(c => { const col = c[oldName]; const n = { ...c }; delete n[oldName]; n[newName] = col; return n })
    setActivityEmojis(e => { const emo = e[oldName] || ''; const n = { ...e }; delete n[oldName]; n[newName] = emo; return n })
  }

  return (
    <main className="max-w-5xl mx-auto mt-6 grid gap-6 px-6 pb-12">
      <div className="card p-5">
        <div className="text-xl font-semibold" style={{color:'var(--title)'}}>Templates</div>
        <div className="muted text-xs mb-2">Save and re-apply full week layouts</div>

        {((settings.templates && settings.templates.length) ? settings.templates : []).map((t,i)=> (
          <div key={t.id} className="grid grid-cols-12 gap-2 items-center mt-2">
            <input className="col-span-6 input text-sm" defaultValue={t.name}
              onBlur={(e)=> setSettings(prev => {
                const copy = [...(prev.templates||[])]
                copy[i] = { ...copy[i], name: e.target.value || copy[i].name }
                return { ...prev, templates: copy }
              })} />
            <div className="col-span-6 flex items-center gap-2 justify-end">
              <button className="btn text-xs" onClick={()=> window.location.hash = '/week?apply=' + encodeURIComponent(t.id)}>Apply…</button>
              <button className="btn text-xs" onClick={()=> setSettings(prev => ({ ...prev, templates: (prev.templates||[]).toSpliced(i,1) }))}>Delete</button>
            </div>
          </div>
        ))}

        <div className="mt-3 flex items-center gap-2">
          <button className="btn" onClick={()=> setSettings(prev => ({ ...prev, templates: [...(prev.templates||[]), captureWeekAsTemplate((window as any).__WHB_WEEK__ || {})] }))}>New from current week</button>
          <button className="btn" onClick={()=> setSettings(prev => ({ ...prev, templates: [...(prev.templates||[]), { id:String(Date.now()), name:'Blank Template', days:{ Mon:{}, Tue:{}, Wed:{}, Thu:{}, Fri:{}, Sat:{}, Sun:{} } }] }))}>New blank</button>
        </div>
      </div>
    
      <div className="card p-5">
        <div className="text-sm" style={{color:'var(--meta)'}}>Library</div>
        <div className="text-xl font-semibold" style={{color:'var(--title)'}}>Projects</div>
        {settings.projects.map((p,i)=> (
          <div key={i} className="grid grid-cols-12 gap-2 items-center relative mt-2">
            <div className="col-span-1 relative">
              <input className="w-full input text-sm text-center" placeholder="🎯"
                value={settings.projectEmojis[p] ?? ''}
                onChange={(e)=> setProjectEmojis(prev => ({ ...prev, [p]: e.target.value }))} />
              <button type="button" className="btn" onClick={()=> setPicker({ type: 'project', key: p })}>🙂</button>
              {picker && picker.type==='project' && picker.key===p && (
                <div className="card p-2" style={{position:'absolute', zIndex:50, top:32, left:0}}>
                  <EmojiPicker onPick={(emo)=> setProjectEmojis(prev => ({ ...prev, [p]: emo }))} onClose={()=> setPicker(null)} />
                </div>
              )}
            </div>
            <input className="col-span-9 input text-sm" value={p} onChange={(e)=> changeProjectName(i, e.target.value)} />
            <button className="col-span-1 btn text-xs" onClick={()=> removeProject(i)}>Remove</button>
          </div>
        ))}
        <button className="btn mt-2" onClick={addProject}>Add Project</button>
      </div>

      
      <div className="card p-5">
        <div className="text-sm" style={{color:'var(--meta)'}}>Planner Behavior</div>
        <div className="text-xl font-semibold" style={{color:'var(--title)'}}>Global Defaults</div>
        <div className="grid" style={{gridTemplateColumns:'repeat(3, minmax(160px, 1fr))', gap:12, marginTop:12}}>
          <div>
            <div className="muted text-xs mb-1">Default Morning Project</div>
            <select className="select w-full" value={settings.defaults?.morning ?? ''}
              onChange={(e)=> setSettings(prev => ({ ...prev, defaults: { ...(prev.defaults||{}), morning: e.target.value || null } }))}>
              <option value="">— None —</option>
              {settings.projects.map(p=> <option key={p} value={p}>{(settings.projectEmojis[p]||'') + (settings.projectEmojis[p]?' ':'') + p}</option>)}
            </select>
          </div>
          <div>
            <div className="muted text-xs mb-1">Default Midday Project</div>
            <select className="select w-full" value={settings.defaults?.midday ?? ''}
              onChange={(e)=> setSettings(prev => ({ ...prev, defaults: { ...(prev.defaults||{}), midday: e.target.value || null } }))}>
              <option value="">— None —</option>
              {settings.projects.map(p=> <option key={p} value={p}>{(settings.projectEmojis[p]||'') + (settings.projectEmojis[p]?' ':'') + p}</option>)}
            </select>
          </div>
          <div>
            <div className="muted text-xs mb-1">Default Activity</div>
            <select className="select w-full" value={settings.defaults?.activity ?? ''}
              onChange={(e)=> setSettings(prev => ({ ...prev, defaults: { ...(prev.defaults||{}), activity: e.target.value || null } }))}>
              <option value="">— None —</option>
              {Object.keys(settings.activityColors).map(a=> <option key={a} value={a}>{(settings.activityEmojis[a]||'') + (settings.activityEmojis[a]?' ':'') + a}</option>)}
            </select>
          </div>
        </div>
        <label className="flex items-center gap-2 mt-3">
          <input type="checkbox" checked={!!settings.defaults?.useTemplatesFirst}
            onChange={(e)=> setSettings(prev => ({ ...prev, defaults: { ...(prev.defaults||{}), useTemplatesFirst: e.target.checked } }))} />
          <span className="muted">Use templates before global defaults (when available)</span>
        </label>
      </div>
    

      <div className="card p-5">
        <div className="text-xl font-semibold" style={{color:'var(--title)'}}>Activities</div>
        {Object.keys(settings.activityColors).map((name)=> (
          <div key={name} className="grid grid-cols-12 gap-2 items-center relative mt-2">
            <div className="col-span-1 relative">
              <input className="w-full input text-sm text-center" placeholder="🏃"
                value={settings.activityEmojis[name] ?? ''}
                onChange={(e)=> setActivityEmojis(prev => ({ ...prev, [name]: e.target.value }))} />
              <button type="button" className="btn" onClick={()=> setPicker({ type: 'activity', key: name })}>🙂</button>
              {picker && picker.type==='activity' && picker.key===name && (
                <div className="card p-2" style={{position:'absolute', zIndex:50, top:32, left:0}}>
                  <EmojiPicker onPick={(emo)=> setActivityEmojis(prev => ({ ...prev, [name]: emo }))} onClose={()=> setPicker(null)} />
                </div>
              )}
            </div>
            <input className="col-span-5 input text-sm" defaultValue={name} onBlur={(e)=> renameActivity(name, e.target.value)} />
            <input className="col-span-5 input text-sm" value={settings.activityColors[name]}
              onChange={(e)=> setActivityColors(prev => ({ ...prev, [name]: e.target.value }))} />
            <button className="col-span-1 btn text-xs" onClick={()=> removeActivity(name)}>X</button>
          </div>
        ))}
        <button className="btn mt-2" onClick={addActivity}>Add Activity</button>
      </div>
    
      <div className="card p-5">
        <div className="text-xl font-semibold" style={{color:'var(--title)'}}>Day-of-Week Patterns</div>
        <div className="muted text-xs mb-2">Cells left blank will inherit from Global Defaults</div>
        <div className="grid" style={{gridTemplateColumns:'120px repeat(3, minmax(160px,1fr))', gap:8}}>
          {([['Mon','Monday'],['Tue','Tuesday'],['Wed','Wednesday'],['Thu','Thursday'],['Fri','Friday'],['Sat','Saturday'],['Sun','Sunday']] as any[]).map(([k,label]) => (
            <React.Fragment key={k}>
              <div className="muted text-sm" style={{alignSelf:'center'}}>{label}</div>
              <select className="select" value={(settings.patterns?.[k]?.morning ?? '') as any}
                onChange={(e)=> setSettings(prev => ({ ...prev, patterns: { ...(prev.patterns||{}), [k]: { ...(prev.patterns?.[k]||{}), morning: e.target.value || null } } }))}>
                <option value="">Inherit (Global)</option>
                {settings.projects.map(p=> <option key={p} value={p}>{(settings.projectEmojis[p]||'') + (settings.projectEmojis[p]?' ':'') + p}</option>)}
              </select>
              <select className="select" value={(settings.patterns?.[k]?.midday ?? '') as any}
                onChange={(e)=> setSettings(prev => ({ ...prev, patterns: { ...(prev.patterns||{}), [k]: { ...(prev.patterns?.[k]||{}), midday: e.target.value || null } } }))}>
                <option value="">Inherit (Global)</option>
                {settings.projects.map(p=> <option key={p} value={p}>{(settings.projectEmojis[p]||'') + (settings.projectEmojis[p]?' ':'') + p}</option>)}
              </select>
              <select className="select" value={(settings.patterns?.[k]?.activity ?? '') as any}
                onChange={(e)=> setSettings(prev => ({ ...prev, patterns: { ...(prev.patterns||{}), [k]: { ...(prev.patterns?.[k]||{}), activity: e.target.value || null } } }))}>
                <option value="">Inherit (Global)</option>
                {Object.keys(settings.activityColors).map(a=> <option key={a} value={a}>{(settings.activityEmojis[a]||'') + (settings.activityEmojis[a]?' ':'') + a}</option>)}
              </select>
            </React.Fragment>
          ))}
        </div>
      </div>
    
    </main>
  )
}
