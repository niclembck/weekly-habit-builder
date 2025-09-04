import React from 'react'
import { useLocation, Link } from 'react-router-dom'
import { useWeek } from '../hooks/useWeek'
import StorageBadge from './StorageBadge'
import LoginButton from './LoginButton'
import { useSupabaseAuth } from '../hooks/useSupabaseAuth'
import { supabase } from '../lib/supabaseClient'

function IconBtn({ to, label, children }: { to: string; label: string; children: React.ReactNode }) {
  const { pathname, hash } = useLocation()
  const active = (to === '/week' && hash.includes('/week')) || pathname === to
  return (
    <Link
      to={to}
      aria-label={label}
      className={`whb-topnav__icon ${active ? 'is-active' : ''}`}
      title={label}
    >
      {children}
    </Link>
  )
}

export default function TopNav() {
  const auth = useSupabaseAuth()
  return (
    <header className="whb-topnav" role="banner">
      <div className="whb-topnav__inner">
        <div className="whb-topnav__brand">Weekly Habit Builder</div>

        <div className="whb-topnav__center">
          <StorageBadge />
        </div>

        <div>
          {auth.ready && auth.userId ? (
            <button
              className="btn"
              onClick={() => supabase.auth.signOut()}
              title={auth.userId}
            >
              Sign out
            </button>
          ) : (
            <LoginButton />
          )}
        </div>

        <nav className="whb-topnav__actions" aria-label="Primary">
          <IconBtn to="/week" label="Week">
            🗓️
          </IconBtn>
          <IconBtn to="/insights" label="Insights">
            📈
          </IconBtn>
          <IconBtn to="/library" label="Library">
            📚
          </IconBtn>
          <IconBtn to="/settings" label="Settings">
            ⚙️
          </IconBtn>

          <details className="whb-topnav__more">
            <summary aria-label="More">⋯</summary>
            <div className="whb-topnav__menu">
              <a href="#/week">Week</a>
              <a href="#/insights">Insights</a>
              <a href="#/library">Library</a>
              <a href="#/settings">Settings</a>
            </div>
          </details>
        </nav>
      </div>
    </header>
  )
}
