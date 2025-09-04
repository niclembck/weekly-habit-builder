import React, { useEffect, useRef } from 'react'

const EMO = ["🎉","✨","💫","🌟","🎊","🔥"]

export default function Confetti({ burst }:{ burst: number }){
  const ref = useRef<HTMLDivElement>(null)
  useEffect(()=>{
    if (!burst || !ref.current) return
    const root = ref.current
    root.innerHTML = ''
    const w = window.innerWidth, h = window.innerHeight
    for (let i=0;i<14;i++){
      const span = document.createElement('div')
      span.className = 'p'
      span.textContent = EMO[i % EMO.length]
      const x = (w*0.5 - 60) + Math.random()*120
      const y = (h*0.3 - 20) + Math.random()*40
      span.style.left = x + 'px'
      span.style.top = y + 'px'
      root.appendChild(span)
    }
    const timer = setTimeout(()=> { if (root) root.innerHTML='' }, 1000)
    return ()=> clearTimeout(timer)
  }, [burst])
  return <div className="confetti"><div ref={ref}/></div>
}
