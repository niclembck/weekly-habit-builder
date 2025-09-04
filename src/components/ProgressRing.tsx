import React from 'react'
type Props = { value: number, size?: number }
export default function ProgressRing({ value, size=48 }: Props) {
  const r = (size/2) - 2
  const c = 2 * Math.PI * r
  const clamped = Math.max(0, Math.min(1, value))
  const dash = clamped * c
  const viewBox = '0 0 ' + size + ' ' + size
  const transform = 'rotate(-90 ' + (size/2) + ' ' + (size/2) + ')'
  const dasharray = String(dash) + ' ' + String(c - dash)
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg viewBox={viewBox}>
        <circle className="bg" cx={size/2} cy={size/2} r={r} strokeWidth={3} fill="none" />
        <circle className="fg" cx={size/2} cy={size/2} r={r} strokeWidth={3} fill="none"
          strokeDasharray={dasharray} strokeLinecap="round" transform={transform} style={{ transition: 'stroke-dashoffset .45s ease, stroke .3s ease' }}/>
      </svg>
    </div>
  )
}
