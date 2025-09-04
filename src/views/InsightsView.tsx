import React from 'react'
import { useWeek } from '../hooks/useWeek'
import { useProgress } from '../hooks/useProgress'
import Dashboard from '../components/Dashboard'

export default function InsightsView() {
  const { week, dates } = useWeek()
  const { countedDays, bestStreak, currentStreak } = useProgress()
  const streak = currentStreak(countedDays)
  return (
    <main className="max-w-5xl mx-auto mt-6 grid gap-6 px-6 pb-12">
      <Dashboard week={week} dates={dates as any} streak={streak} bestStreak={bestStreak} />
      <div className="card p-5">
        <div className="text-sm" style={{color:'var(--meta)'}}>Insights</div>
        <div className="mt-1 text-sm">More trends and badges can live here later.</div>
      </div>
    </main>
  )
}
