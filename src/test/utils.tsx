import React from 'react'
import { render } from '@testing-library/react'

export function renderControlled<P extends { entry: any; onChange: (p: any) => void }>(
  Component: React.ComponentType<P>,
  props: Omit<P, 'onChange'> & { onChange?: (p: any) => void }
) {
  let currentEntry = (props as any).entry
  const externalOnChange = props.onChange

  const AllProps = (patch?: any) => ({
    ...(props as any),
    entry: currentEntry,
    onChange: (p: any) => {
      currentEntry = { ...currentEntry, ...p }
      externalOnChange?.(p)
      api.rerender(<Component {...AllProps()} />)
    },
  })

  const api = render(<Component {...AllProps()} />)
  return { ...api }
}
