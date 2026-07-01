import { useContext } from 'react'
import { ThemeContext } from './themeConstants'

/**
 * Hook đọc theme hiện tại. Trả null nếu nằm ngoài Provider (an toàn cho unit test).
 */
export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    return { theme: 'dark', isDark: true, setTheme: () => {}, toggle: () => {} }
  }
  return ctx
}