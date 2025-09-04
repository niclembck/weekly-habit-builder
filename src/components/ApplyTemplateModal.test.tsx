import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import ApplyTemplateModal from './ApplyTemplateModal'

describe('ApplyTemplateModal', () => {
  const tpl = { id: 'tpl-1', name: 'My Template' }

  it('renders when open and shows template name + controls', () => {
    render(
      <ApplyTemplateModal
        open
        template={tpl}
        onApply={() => {}}
        onClose={() => {}}
      />
    )

    expect(screen.getByText('Apply Template')).toBeInTheDocument()
    expect(screen.getByText('My Template')).toBeInTheDocument()
    expect(
      screen.getByText('Overwrite existing selections (otherwise only blanks are filled)')
    ).toBeInTheDocument()

    // Scope radios present
    expect(screen.getByLabelText(/Entire week/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Weekdays/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Weekends/i)).toBeInTheDocument()
  })

  it('invokes onApply with chosen options', () => {
    const onApply = vi.fn()

    render(
      <ApplyTemplateModal
        open
        template={tpl}
        onApply={onApply}
        onClose={() => {}}
      />
    )

    // Toggle overwrite
    fireEvent.click(screen.getByRole('checkbox'))

    // Choose "Weekdays"
    fireEvent.click(screen.getByLabelText(/Weekdays/i))

    // Click Apply
    fireEvent.click(screen.getByRole('button', { name: /Apply/i }))

    expect(onApply).toHaveBeenCalledTimes(1)
    expect(onApply).toHaveBeenCalledWith({ overwrite: true, scope: 'weekdays' })
  })

  it('invokes onClose when Cancel is clicked', () => {
    const onClose = vi.fn()

    render(
      <ApplyTemplateModal
        open
        template={tpl}
        onApply={() => {}}
        onClose={onClose}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /Cancel/i }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('returns null when closed or when template is null', () => {
    const { rerender, container } = render(
      <ApplyTemplateModal open={false} template={tpl} onApply={() => {}} onClose={() => {}} />
    )
    expect(container.firstChild).toBeNull()

    rerender(<ApplyTemplateModal open template={null} onApply={() => {}} onClose={() => {}} />)
    expect(container.firstChild).toBeNull()
  })

  it('resets internal options when reopened or template changes', () => {
    const { rerender } = render(
      <ApplyTemplateModal open template={tpl} onApply={() => {}} onClose={() => {}} />
    )

    // change some options away from defaults
    fireEvent.click(screen.getByRole('checkbox')) // overwrite -> true
    fireEvent.click(screen.getByLabelText(/Weekends/i)) // scope -> weekends

    // close
    rerender(<ApplyTemplateModal open={false} template={tpl} onApply={() => {}} onClose={() => {}} />)

    // reopen (same template)
    rerender(<ApplyTemplateModal open template={tpl} onApply={() => {}} onClose={() => {}} />)

    // defaults should be restored
    const overwrite = screen.getByRole('checkbox') as HTMLInputElement
    expect(overwrite.checked).toBe(false)
    const entire = screen.getByLabelText(/Entire week/i) as HTMLInputElement
    expect(entire.checked).toBe(true)

    // also resets when template changes
    rerender(
      <ApplyTemplateModal
        open
        template={{ id: 'tpl-2', name: 'Other' }}
        onApply={() => {}}
        onClose={() => {}}
      />
    )
    expect((screen.getByRole('checkbox') as HTMLInputElement).checked).toBe(false)
    expect((screen.getByLabelText(/Entire week/i) as HTMLInputElement).checked).toBe(true)
  })
})
