import { useLocalStorage } from './useLocalStorage'
import { WeekData } from '../types'

export function iso(d: Date) { return d.toISOString().slice(0,10) }

export function useProgress() {
  const [countedDays, setCountedDays] = useLocalStorage<Record<string, boolean>>('whb.countedDays', {})
  const [bestStreak, setBestStreak] = useLocalStorage<number>('whb.bestStreak', 0)

  function isFull(entry: any) { return !!(entry?.doneMorning && entry?.doneMidday && entry?.doneActivity) }

  function updateFromWeek(week: WeekData, dateMap: Record<string, Date>) {
    const next = { ...countedDays }
    ;(Object.keys(dateMap) as (keyof typeof dateMap)[]).forEach((day)=>{
      const date = dateMap[day]
      const key = iso(date)
      if (isFull((week as any)[day])) next[key] = true
      else delete next[key]
    })
    setCountedDays(next)
    // update best streak if needed
    const cs = currentStreak(next)
    if (cs > bestStreak) setBestStreak(cs)
  }

  function currentStreak(map: Record<string, boolean>) {
    // Count backward from today (local)
    const d = new Date(); d.setHours(12,0,0,0)
    let n = 0
    while (true) {
      const key = d.getFullYear().toString().padStart(4,'0') + '-' +
                  (d.getMonth()+1).toString().padStart(2,'0') + '-' +
                  d.getDate().toString().padStart(2,'0')
      if (map[key]) { n++; d.setDate(d.getDate()-1) } else break
    }
    return n
  }

  function weeklyCompletion(week: WeekData): number {
    const days = Object.values(week)
    const done = days.filter(isFull).length
    return days.length ? done / days.length : 0
  }

  return { countedDays, bestStreak, updateFromWeek, currentStreak, weeklyCompletion }
}
