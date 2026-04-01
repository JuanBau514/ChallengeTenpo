import { createContext, useLayoutEffect, useState } from 'react'
import type { ReactNode } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextValue {
  theme: Theme
  toggle: () => void
}

export const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): Theme {
  // 1. Preferencia guardada por el usuario
  const saved = localStorage.getItem('theme')
  if (saved === 'light' || saved === 'dark') return saved

  // 2. Preferencia del sistema operativo
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(getInitialTheme)

  // useLayoutEffect corre sincrónicamente antes del primer paint:
  // el atributo data-theme se aplica antes de que el browser pinte,
  // evitando el flash de tema incorrecto.
  useLayoutEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  function toggle() {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'))
  }

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  )
}
