import { createContext } from 'react'

export const STORAGE_KEY = 'smartmap.theme'

/**
 * Đọc theme từ localStorage. Nếu chưa có thì mặc định 'dark' (giữ nguyên UI cũ).
 * @returns {'light' | 'dark'}
 */
export function readInitialTheme() {
  if (typeof window === 'undefined') return 'dark'
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* localStorage có thể bị block (private mode); bỏ qua */
  }
  return 'dark'
}

/**
 * Áp class .dark lên <html> để Tailwind phản ứng và CSS variables đổi giá trị.
 */
export function applyTheme(theme) {
  if (typeof document === 'undefined') return
  const root = document.documentElement
  if (theme === 'dark') root.classList.add('dark')
  else root.classList.remove('dark')
}

/**
 * Lưu theme vào localStorage (chịu lỗi nếu bị block).
 */
export function persistTheme(theme) {
  try { window.localStorage.setItem(STORAGE_KEY, theme) } catch { /* ignore */ }
}

export const ThemeContext = createContext(null)