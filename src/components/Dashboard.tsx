import React, { useMemo } from 'react'
import { WeekData, Day } from '../types'
import ProgressRing from './ProgressRing'

function pct(n: number) { return Math.round(n*100) }

const MESSAGES = [
  "Small wins compound. You got this.",
  "Keep the momentum going — next block is yours.",
  "One focused session at a time.",
  "Consistency beats intensity. Nice work.",
  "Show up for Future You."
]

export default function Dashboard({ week, dates, streak, bestStreak }:
  { week: WeekData, dates: Record<Day, Date>, streak: number, bestStreak: number }) {

  const value = useMemo(()=>{
    const days = Object.values(week)
    const done = days.filter(d => d.doneMorning && d.doneMidday && d.doneActivity).length
    return days.length ? done / days.length : 0
  }, [week])

  const msg = useMemo(()=> MESSAGES[(Object.values(week)[0]?.mood ?? 0) % MESSAGES.length], [week])

  const tomorrow = useMemo(()=> {
    const arr: Day[] = ["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"]
    // Rough tomorrow picker based on current weekday
    const now = new Date(); const idx = now.getDay(); const next = arr[(idx+1)%7]
    return next
  }, [])

  return (
    <section className="max-w-5xl mx-auto mt-6 px-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-5 flex items-center gap-4">
          <ProgressRing value={value} size={56} />
          <div>
            <div className="text-sm" style={{color:'var(--meta)'}}>Weekly completion</div>
            <div className="text-xl font-semibold" style={{color:'var(--title)'}}>{pct(value)}%</div>
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm" style={{color:'var(--meta)'}}>Streak</div>
          <div className="flex items-baseline gap-2">
            <div className="text-2xl font-bold" style={{color:'var(--title)'}}>{streak}</div>
            <div className="muted">best {bestStreak}</div>
          </div>
        </div>
        <div className="card p-5">
          <div className="text-sm" style={{color:'var(--meta)'}}>Nudge</div>
          <div className="mt-1 text-sm">{msg}</div>
          <div className="muted mt-2">Up next: {tomorrow}</div>
        </div>
      </div>
    </section>
  )
}
