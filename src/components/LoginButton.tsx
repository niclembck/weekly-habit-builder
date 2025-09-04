import * as React from 'react'
import { supabase } from '../lib/supabaseClient'

export default function LoginButton() {
  const [email, setEmail] = React.useState('')
  const [sent, setSent] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function sendMagicLink(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin, // http://localhost:5173
      },
    })
    if (error) setError(error.message)
    else setSent(true)
  }

  return (
    <div className="flex items-center gap-2">
      {!sent ? (
        <form onSubmit={sendMagicLink} className="flex items-center gap-2">
          <input
            type="email"
            required
            className="input"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn" type="submit">Sign in</button>
        </form>
      ) : (
        <span className="muted text-sm">Check your email for the magic link.</span>
      )}
      {error && <span className="muted text-sm">• {error}</span>}
    </div>
  )
}
