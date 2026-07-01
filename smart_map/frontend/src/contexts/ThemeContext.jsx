import { useEffect, useMemo, useState } from 'react'
import {
  ThemeContext,
  applyTheme,
  persistTheme,
  readInitialTheme,
} from './themeConstants'

/**
 * Provider cung cấp theme cho toàn app. Lưu preference vào localStorage
 * và đồng bộ lên <html> để Tailwind + CSS variables phản ứng.
 */
export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(readInitialTheme)

  useEffect(() => { applyTheme(theme) }, [theme])

  const value = useMemo(() => ({
    theme,
    isDark: theme === 'dark',
    setTheme: (next) => {
      if (next !== 'light' && next !== 'dark') return
      persistTheme(next)
      setTheme(next)
    },
    toggle: () => {
      setTheme((prev) => {
        const next = prev === 'dark' ? 'light' : 'dark'
        persistTheme(next)
        return next
      })
    },
  }), [theme])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}