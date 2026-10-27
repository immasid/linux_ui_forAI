import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { Composer } from '../components/Composer'
import { accentThemes } from '../lib/themes'

describe('Composer', () => {
  const theme = accentThemes[0]

  it('does not send on empty input', () => {
    const onSend = vi.fn()
    const onStop = vi.fn()

    render(
      <Composer
        onSend={onSend}
        onStop={onStop}
        isStreaming={false}
        theme={theme}
      />,
    )

    const textarea = screen.getByLabelText('Message prompt')
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })

    expect(onSend).not.toHaveBeenCalled()
  })

  it('sends on Enter and inserts newline on Shift+Enter', () => {
    const onSend = vi.fn()
    const onStop = vi.fn()

    render(
      <Composer
        onSend={onSend}
        onStop={onStop}
        isStreaming={false}
        theme={theme}
      />,
    )

    const textarea = screen.getByLabelText('Message prompt') as HTMLTextAreaElement

    // Type text
    fireEvent.change(textarea, { target: { value: 'Line 1' } })

    // Shift+Enter should NOT send
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: true })
    expect(onSend).not.toHaveBeenCalled()

    // Plain Enter SHOULD send
    fireEvent.keyDown(textarea, { key: 'Enter', shiftKey: false })
    expect(onSend).toHaveBeenCalledWith('Line 1')
  })

  it('renders Stop button when isStreaming is true', () => {
    const onSend = vi.fn()
    const onStop = vi.fn()

    render(
      <Composer
        onSend={onSend}
        onStop={onStop}
        isStreaming={true}
        theme={theme}
      />,
    )

    const stopButton = screen.getByLabelText('Stop generating response')
    expect(stopButton).toBeInTheDocument()

    fireEvent.click(stopButton)
    expect(onStop).toHaveBeenCalledTimes(1)
  })
})
