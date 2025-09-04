// src/components/DayCard.test.tsx
import React from 'react'
import { screen, fireEvent, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import DayCard from './DayCard'
import { Day } from '../types'
import { renderControlled } from '../test/utils'

// ✅ Stub ProgressRing so React doesn't try to render the real one during tests
vi.mock('./ProgressRing', () => ({
  default: (props: { value: number }) => <div data-testid="progress-ring" data-value={props.value} />
}))

const baseProps = {
  collapsible: false,
  day: 'Monday' as Day,
  date: new Date(2025, 8, 1), // Sep 1, 2025
  projects: ['Alpha', 'Beta'],
  activityColors: { Run: '#f00', Yoga: '#0f0' },
  projectEmojis: {},
  activityEmojis: {},
  onToast: () => {},
}

describe('DayCard (non-collapsible) with controlled re-render', () => {
  it('renders section headers, summary, and mocked ProgressRing', () => {
    renderControlled(DayCard, {
      ...baseProps,
      entry: {
        morningProject: 'Alpha', doneMorning: false,
        middayProject: 'Beta', doneMidday: true,
        activity: 'Run', doneActivity: false
      },
    })

    expect(screen.getByText('🖥️ Morning Work')).toBeInTheDocument()
    expect(screen.getByText('📚 Midday Work')).toBeInTheDocument()
    expect(screen.getByText('🏃 Activity')).toBeInTheDocument()

    // summary text appears at least once
    expect(screen.getAllByText(/of 3 completed/).length).toBeGreaterThan(0)
    // ProgressRing mocked:
    expect(screen.getByTestId('progress-ring')).toBeInTheDocument()
  })

  it('toggles morning "Completed" and updates state via onChange (auto re-render)', () => {
    renderControlled(DayCard, {
      ...baseProps,
      entry: { morningProject: 'Alpha', doneMorning: false },
    })

    // First "Completed" belongs to Morning section
    const morningCompleted = screen.getAllByLabelText('Completed')[0] as HTMLInputElement
    expect(morningCompleted.checked).toBe(false)

    fireEvent.click(morningCompleted)

    // after auto re-render, it should now be checked
    const morningCompletedAfter = screen.getAllByLabelText('Completed')[0] as HTMLInputElement
    expect(morningCompletedAfter.checked).toBe(true)
  })

  it('changes morning project via select (auto re-render keeps it selected)', () => {
    renderControlled(DayCard, {
      ...baseProps,
      entry: { morningProject: 'Alpha' },
    })

    const [morningSelect] = screen.getAllByRole('combobox') as HTMLSelectElement[]
    fireEvent.change(morningSelect, { target: { value: 'Beta' } })

    // After auto re-render, select should reflect the new value
    expect((screen.getAllByRole('combobox')[0] as HTMLSelectElement).value).toBe('Beta')
  })

  it('shows custom morning project input (already in custom state) and updates as you type', async () => {
    const user = userEvent.setup()

    renderControlled(DayCard, {
      ...baseProps,
      entry: { morningProject: '' }, // 👈 start in custom state to avoid select->empty brittleness
    })

    const morningSection = screen.getByText('🖥️ Morning Work').closest('.subcard') as HTMLElement
    expect(morningSection).toBeTruthy()

    // Find INPUT (not textarea) whose placeholder starts with "Custom project"
    const customProject = within(morningSection)
      .getAllByRole('textbox')
      .filter(el => el.tagName === 'INPUT')
      .find(el => (el.getAttribute('placeholder') || '').toLowerCase().startsWith('custom project')) as HTMLInputElement | undefined

    expect(customProject).toBeTruthy()

    await user.clear(customProject!)
    await user.type(customProject!, 'Custom A')

    // After auto re-render, input retains value
    const customProjectUpdated = within(morningSection)
      .getAllByRole('textbox')
      .filter(el => el.tagName === 'INPUT')
      .find(el => (el.getAttribute('placeholder') || '').toLowerCase().startsWith('custom project')) as HTMLInputElement
    expect(customProjectUpdated.value).toBe('Custom A')
  })

  it('shows custom activity input (already in custom state) and calls onEnsureActivity as you type', async () => {
    const user = userEvent.setup()
    const onEnsureActivity = vi.fn()

    renderControlled(DayCard, {
      ...baseProps,
      entry: { activity: '' }, // 👈 start in custom state
      onEnsureActivity,
    })

    const activitySection = screen.getByText('🏃 Activity').closest('.subcard') as HTMLElement
    expect(activitySection).toBeTruthy()

    const customActivity = within(activitySection)
      .getAllByRole('textbox')
      .filter(el => el.tagName === 'INPUT')
      .find(el => (el.getAttribute('placeholder') || '').toLowerCase().startsWith('custom activity')) as HTMLInputElement | undefined

    expect(customActivity).toBeTruthy()

    await user.clear(customActivity!)
    await user.type(customActivity!, 'Swim')

    const customActivityUpdated = within(activitySection)
      .getAllByRole('textbox')
      .filter(el => el.tagName === 'INPUT')
      .find(el => (el.getAttribute('placeholder') || '').toLowerCase().startsWith('custom activity')) as HTMLInputElement
    expect(customActivityUpdated.value).toBe('Swim')
    expect(onEnsureActivity).toHaveBeenCalledWith('Swim')
  })

  it('updates notes fields (morning/midday/activity) and keeps values after auto re-render', () => {
    renderControlled(DayCard, {
      ...baseProps,
      entry: { morningProject: 'Alpha', middayProject: 'Beta', activity: 'Run' },
    })

    fireEvent.change(screen.getByPlaceholderText(/Notes for Morning/i), { target: { value: 'A' } })
    fireEvent.change(screen.getByPlaceholderText(/Notes for Midday/i), { target: { value: 'B' } })
    fireEvent.change(screen.getByPlaceholderText(/Notes for Activity/i), { target: { value: 'C' } })

    expect((screen.getByPlaceholderText(/Notes for Morning/i) as HTMLInputElement).value).toBe('A')
    expect((screen.getByPlaceholderText(/Notes for Midday/i) as HTMLInputElement).value).toBe('B')
    expect((screen.getByPlaceholderText(/Notes for Activity/i) as HTMLInputElement).value).toBe('C')
  })

  it('accepts mood between 1–5 and sends null when cleared (auto re-render keeps input)', () => {
    renderControlled(DayCard, {
      ...baseProps,
      entry: { mood: 3 },
    })

    const mood = screen.getByPlaceholderText('1–5') as HTMLInputElement

    fireEvent.change(mood, { target: { value: '5' } })
    expect((screen.getByPlaceholderText('1–5') as HTMLInputElement).value).toBe('5')

    fireEvent.change(mood, { target: { value: '' } })
    expect((screen.getByPlaceholderText('1–5') as HTMLInputElement).value).toBe('')
  })
})
