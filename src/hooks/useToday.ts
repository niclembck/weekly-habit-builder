// src/hooks/useToday.ts
import { Day } from "../types"
import { DAYS } from "./useWeek"

export function useToday(
  dates: Record<Day, Date | undefined>,
  fallback: Day = "Monday"
): Day {
  return ((() => {
    const todayISO = new Date().toDateString()
    for (const d of DAYS) {
      const dt = dates[d]
      if (dt && dt.toDateString() === todayISO) return d
    }
    return fallback
  })())
}
