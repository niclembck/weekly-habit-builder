// Parse "HH:MM" to minutes since 00:00
export function toMin(t: string | undefined | null, fallback = "08:00") {
  const s = (t ?? fallback).trim();
  const m = s.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return 8 * 60; // 08:00
  const hh = Math.max(0, Math.min(23, parseInt(m[1], 10)));
  const mm = Math.max(0, Math.min(59, parseInt(m[2], 10)));
  return hh * 60 + mm;
}

// Minutes to "HH:MM"
export function toHHMM(m: number) {
  const hh = Math.floor(m / 60);
  const mm = m % 60;
  const H = String(Math.max(0, Math.min(23, hh))).padStart(2, "0");
  const M = String(Math.max(0, Math.min(59, mm))).padStart(2, "0");
  return `${H}:${M}`;
}
