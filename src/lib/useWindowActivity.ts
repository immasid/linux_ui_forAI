import { useContext } from 'react'
import {
  WindowActivityContext,
  type WindowActivityContextValue,
} from './windowActivityContext'

export function useWindowActivity(): WindowActivityContextValue {
  return useContext(WindowActivityContext)
}
