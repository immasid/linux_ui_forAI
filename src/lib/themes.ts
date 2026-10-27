export type AccentThemeId =
  | 'blue'
  | 'green'
  | 'red'
  | 'yellow'
  | 'silver'
  | 'purple'

export type AccentTheme = {
  id: AccentThemeId
  name: string
  primary: string
  border: string
  soft: string
  glow: string
  glowStrong: string
}

export const accentThemes: AccentTheme[] = [
  {
    id: 'blue',
    name: 'Neon Blue',
    primary: '#67e8f9',
    border: 'rgba(103, 232, 249, 0.30)',
    soft: 'rgba(103, 232, 249, 0.06)',
    glow: 'rgba(103, 232, 249, 0.10)',
    glowStrong: 'rgba(103, 232, 249, 0.55)',
  },
  {
    id: 'green',
    name: 'Neon Green',
    primary: '#86efac',
    border: 'rgba(134, 239, 172, 0.30)',
    soft: 'rgba(134, 239, 172, 0.06)',
    glow: 'rgba(134, 239, 172, 0.10)',
    glowStrong: 'rgba(134, 239, 172, 0.55)',
  },
  {
    id: 'red',
    name: 'Neon Red',
    primary: '#fb7185',
    border: 'rgba(251, 113, 133, 0.30)',
    soft: 'rgba(251, 113, 133, 0.06)',
    glow: 'rgba(251, 113, 133, 0.10)',
    glowStrong: 'rgba(251, 113, 133, 0.55)',
  },
  {
    id: 'yellow',
    name: 'Neon Yellow',
    primary: '#fde047',
    border: 'rgba(253, 224, 71, 0.30)',
    soft: 'rgba(253, 224, 71, 0.06)',
    glow: 'rgba(253, 224, 71, 0.10)',
    glowStrong: 'rgba(253, 224, 71, 0.55)',
  },
  {
    id: 'silver',
    name: 'Silver',
    primary: '#e2e8f0',
    border: 'rgba(226, 232, 240, 0.30)',
    soft: 'rgba(226, 232, 240, 0.05)',
    glow: 'rgba(226, 232, 240, 0.09)',
    glowStrong: 'rgba(226, 232, 240, 0.46)',
  },
  {
    id: 'purple',
    name: 'Neon Purple',
    primary: '#c084fc',
    border: 'rgba(192, 132, 252, 0.30)',
    soft: 'rgba(192, 132, 252, 0.06)',
    glow: 'rgba(192, 132, 252, 0.10)',
    glowStrong: 'rgba(192, 132, 252, 0.55)',
  },
]

export const defaultAccentTheme: AccentThemeId = 'blue'

export function isValidAccentThemeId(id: unknown): id is AccentThemeId {
  return typeof id === 'string' && accentThemes.some((theme) => theme.id === id)
}

export function getAccentTheme(id?: string | null): AccentTheme {
  return (
    accentThemes.find((theme) => theme.id === id) ??
    accentThemes[0]
  )
}
