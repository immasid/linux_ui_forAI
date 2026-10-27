import { describe, it, expect } from 'vitest'
import { render, screen, act } from '@testing-library/react'
import { WindowActivityProvider, useWindowActivity } from '../lib/windowActivity'

function ActivityTester() {
  const { activity, isActive, isAmbient, isSuspended } = useWindowActivity()
  return (
    <div>
      <span data-testid="activity">{activity}</span>
      <span data-testid="isActive">{String(isActive)}</span>
      <span data-testid="isAmbient">{String(isAmbient)}</span>
      <span data-testid="isSuspended">{String(isSuspended)}</span>
    </div>
  )
}

describe('WindowActivity', () => {
  it('transitions between active, ambient, and suspended states', async () => {
    render(
      <WindowActivityProvider>
        <ActivityTester />
      </WindowActivityProvider>,
    )

    // Initial state
    expect(screen.getByTestId('activity')).toHaveTextContent(/active|ambient/)

    // Trigger blur -> ambient
    act(() => {
      window.dispatchEvent(new Event('blur'))
    })
    expect(screen.getByTestId('activity')).toHaveTextContent('ambient')
    expect(screen.getByTestId('isAmbient')).toHaveTextContent('true')

    // Trigger focus -> active
    act(() => {
      window.dispatchEvent(new Event('focus'))
    })
    expect(screen.getByTestId('activity')).toHaveTextContent('active')
    expect(screen.getByTestId('isActive')).toHaveTextContent('true')

    // Trigger visibility hidden -> suspended
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'hidden',
    })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(screen.getByTestId('activity')).toHaveTextContent('suspended')
    expect(screen.getByTestId('isSuspended')).toHaveTextContent('true')

    // Restore visible
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'))
    })
    expect(screen.getByTestId('activity')).toHaveTextContent(/active|ambient/)
  })
})
