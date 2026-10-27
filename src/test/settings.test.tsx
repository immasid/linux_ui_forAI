import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SettingsPanel } from '../components/SettingsPanel'
import { defaultSettings } from '../lib/uiSounds'

describe('SettingsPanel', () => {
  it('closes on Escape key press', () => {
    const onClose = vi.fn()
    const onChange = vi.fn()
    const onAccentChange = vi.fn()

    render(
      <SettingsPanel
        settings={defaultSettings}
        onChange={onChange}
        accentThemeId="blue"
        onAccentChange={onAccentChange}
        onClose={onClose}
      />,
    )

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('triggers onAccentChange when theme option clicked', () => {
    const onClose = vi.fn()
    const onChange = vi.fn()
    const onAccentChange = vi.fn()

    render(
      <SettingsPanel
        settings={defaultSettings}
        onChange={onChange}
        accentThemeId="blue"
        onAccentChange={onAccentChange}
        onClose={onClose}
      />,
    )

    const purpleThemeButton = screen.getByText('Neon Purple')
    fireEvent.click(purpleThemeButton)

    expect(onAccentChange).toHaveBeenCalledWith('purple')
  })

  it('toggles sound channels', () => {
    const onClose = vi.fn()
    const onChange = vi.fn()
    const onAccentChange = vi.fn()

    render(
      <SettingsPanel
        settings={defaultSettings}
        onChange={onChange}
        accentThemeId="blue"
        onAccentChange={onAccentChange}
        onClose={onClose}
      />,
    )

    const masterSwitch = screen.getByRole('switch', { name: 'Master sounds' })
    fireEvent.click(masterSwitch)

    expect(onChange).toHaveBeenCalledWith({
      ...defaultSettings,
      master: false,
    })
  })
})
