import { createContext } from 'react'

export type WindowActivityState = 'active' | 'ambient' | 'suspended'

export interface WindowActivityContextValue {
  activity: WindowActivityState
  isActive: boolean
  isAmbient: boolean
  isSuspended: boolean
}

export const WindowActivityContext = createContext<WindowActivityContextValue>({
  activity: 'active',
  isActive: true,
  isAmbient: false,
  isSuspended: false,
})
