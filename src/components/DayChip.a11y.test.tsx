// src/components/DayChip.a11y.test.tsx
import React from 'react'
import { render, screen } from '@testing-library/react'
import DayChip from './DayChip'
import { Day } from '../types'

it('exposes correct ARIA tab semantics', () => {
  render(<DayChip day={'Friday' as Day} counts={{ completed:0, total:0, pct:0 }} selected tabId="whb-tab-Fri" panelId="whb-tabpanel-Fri" />)
  const tab = screen.getByRole('tab')
  expect(tab).toHaveAttribute('id', 'whb-tab-Fri')
  expect(tab).toHaveAttribute('aria-controls', 'whb-tabpanel-Fri')
  expect(tab).toHaveAttribute('aria-selected', 'true')
})
