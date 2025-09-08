// src/utils/dates.ts

/** Coerces anything into a valid Date. Returns "now" if invalid. */
export function toValidDate(v: any): Date {
  if (v instanceof Date) return new Date(v.getTime()) // return a copy
  const d = new Date(v)
  return isNaN(d.getTime()) ? new Date() : d
}

/** Returns a new Date set to the Monday of the week containing `d` (00:00:00). */
export function startOfWeekMonday(d: Date): Date {
  const x = toValidDate(d)
  const day = x.getDay() || 7 // Sun -> 7
  if (day !== 1) x.setDate(x.getDate() - (day - 1))
  x.setHours(0, 0, 0, 0)
  return x
}

/** Returns a new Date that is `n` days from `d` (preserves time). */
export function addDays(d: Date, n: number): Date {
  const x = toValidDate(d)
  x.setDate(x.getDate() + n)
  return x
}

/** First day of the month that contains `d` (00:00:00). */
export function startOfMonth(d: Date): Date {
  const x = toValidDate(d)
  x.setDate(1)
  x.setHours(0, 0, 0, 0)
  return x
}

/** Last day of the month that contains `d` (00:00:00). */
export function endOfMonth(d: Date): Date {
  const x = toValidDate(d)
  x.setMonth(x.getMonth() + 1, 0) // move to day 0 of next month = last day of current
  x.setHours(0, 0, 0, 0)
  return x
}

export const DAY_KEYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'] as const;

/** Return Monday-anchored week map */
export function getWeekDates(weekStart: Date): Record<string, Date> {
  const base = startOfWeekMonday(weekStart);   // uses your existing exported helper
  const out: Record<string, Date> = {};
  DAY_KEYS.forEach((label, i) => {
    const d = new Date(base);
    d.setUTCDate(base.getUTCDate() + i);
    out[label] = d;
  });
  return out;
}
