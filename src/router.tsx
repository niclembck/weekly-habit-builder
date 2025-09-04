import React, { useEffect, useState } from 'react'

export type Route = { path: string; query: Record<string,string> }

function parse(): Route {
  const raw = window.location.hash || '#/week'
  const s = raw.startsWith('#') ? raw.slice(1) : raw
  const [path, qs] = s.split('?')
  const query: Record<string,string> = {}
  if (qs) {
    qs.split('&').forEach(p=>{
      const [k,v] = p.split('=')
      if (k) query[decodeURIComponent(k)] = decodeURIComponent(v||'')
    })
  }
  return { path: path || '/week', query }
}

export function useHashRoute(): [Route, (to: string)=>void] {
  const [route, setRoute] = useState<Route>(parse())
  useEffect(()=>{
    const on = () => setRoute(parse())
    window.addEventListener('hashchange', on)
    return () => window.removeEventListener('hashchange', on)
  }, [])
  const nav = (to: string) => { window.location.hash = to.startsWith('#') ? to : '#' + to }
  return [route, nav]
}

export function Link(props: { to: string, className?: string, children: React.ReactNode }) {
  const target = '#' + props.to.replace(/^#/, '')
  const isActive = typeof window !== 'undefined' && window.location.hash.startsWith(target)
  const cls = (props.className || '') + (isActive ? ' btn--active' : '')
  return <a className={cls} href={target}>{props.children}</a>
}
