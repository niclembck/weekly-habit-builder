import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import App from '../App'

/**
 * Guardrails:
 * - /day should NOT exist as its own page anymore.
 * - Hitting /day should render the Week view (redirect or wildcard).
 * - NavBar should NOT show a "Day" link.
 */

describe('Routes: no Day page', () => {
  it('renders Week view UI when navigating to /day', () => {
    render(
      <MemoryRouter initialEntries={['/day']}>
        <App />
      </MemoryRouter>
    )
    // Week header chips container has an ARIA tablist label we can rely on
    expect(
      screen.getByRole('tablist', { name: /week days/i })
    ).toBeInTheDocument()
  })

  it('does not show "Day" in the navigation', () => {
    render(
      <MemoryRouter initialEntries={['/week']}>
        <App />
      </MemoryRouter>
    )
    // There should be no link labeled "Day"
    expect(screen.queryByRole('link', { name: /day/i })).toBeNull()
  })

  it('falls back to Week view for unknown routes', () => {
    render(
      <MemoryRouter initialEntries={['/not-a-real-route']}>
        <App />
      </MemoryRouter>
    )
    expect(
      screen.getByRole('tablist', { name: /week days/i })
    ).toBeInTheDocument()
  })
})
