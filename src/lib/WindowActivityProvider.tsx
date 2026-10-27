import {
  useEffect,
  useState,
  type ReactNode,
} from 'react'
import {
  WindowActivityContext,
  type WindowActivityState,
  type WindowActivityContextValue,
} from './windowActivityContext'

export function WindowActivityProvider({ children }: { children: ReactNode }) {
  const [activity, setActivity] = useState<WindowActivityState>('active')

  useEffect(() => {
    let unlistenFocus: (() => void) | undefined
    let isMounted = true

    const determineState = async (): Promise<WindowActivityState> => {
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        return 'suspended'
      }

      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const win = getCurrentWindow()
        const minimized = await win.isMinimized()
        if (minimized) {
          return 'suspended'
        }
      } catch {
        // Not in Tauri
      }

      let hasFocus = true
      if (typeof document !== 'undefined') {
        hasFocus = document.hasFocus()
      }

      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const win = getCurrentWindow()
        hasFocus = await win.isFocused()
      } catch {
        // Fallback
      }

      return hasFocus ? 'active' : 'ambient'
    }

    const updateState = async () => {
      const nextState = await determineState()
      if (isMounted) {
        setActivity(nextState)
      }
    }

    const setupTauri = async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window')
        const win = getCurrentWindow()

        unlistenFocus = await win.onFocusChanged(({ payload: focused }) => {
          if (!isMounted) return
          if (document.visibilityState === 'hidden') {
            setActivity('suspended')
          } else {
            setActivity(focused ? 'active' : 'ambient')
          }
        })
      } catch {
        // Not running in Tauri shell
      }
    }

    void setupTauri()
    void updateState()

    const onFocus = () => {
      if (document.visibilityState === 'hidden') {
        setActivity('suspended')
      } else {
        setActivity('active')
      }
    }

    const onBlur = () => {
      if (document.visibilityState === 'hidden') {
        setActivity('suspended')
      } else {
        setActivity('ambient')
      }
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setActivity('suspended')
      } else {
        const hasFocus = typeof document !== 'undefined' ? document.hasFocus() : true
        setActivity(hasFocus ? 'active' : 'ambient')
      }
    }

    window.addEventListener('focus', onFocus)
    window.addEventListener('blur', onBlur)
    document.addEventListener('visibilitychange', onVisibilityChange)

    return () => {
      isMounted = false
      if (unlistenFocus) {
        unlistenFocus()
      }
      window.removeEventListener('focus', onFocus)
      window.removeEventListener('blur', onBlur)
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [])

  const value: WindowActivityContextValue = {
    activity,
    isActive: activity === 'active',
    isAmbient: activity === 'ambient',
    isSuspended: activity === 'suspended',
  }

  return (
    <WindowActivityContext.Provider value={value}>
      {children}
    </WindowActivityContext.Provider>
  )
}
