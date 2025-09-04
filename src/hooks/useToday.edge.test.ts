// src/hooks/useToday.edge.test.ts
import { renderHook } from '@testing-library/react'
import { useToday } from './useToday'
import { Day } from '../types'

it('handles sparse dates map gracefully', () => {
  const dates = { Monday: undefined, Tuesday: undefined } as unknown as Record<Day, Date | undefined>
  const { result } = renderHook(() => useToday(dates, 'Sunday'))
  expect(result.current).toBe('Sunday')
})
