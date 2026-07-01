import { Toaster } from 'react-hot-toast'
import { useTheme } from '../contexts/useTheme'

/**
 * Toaster wrapper — tự đổi palette theo theme.
 * Đặt trong component riêng để dùng được useTheme (App.jsx đang là top-level).
 */
export default function ThemedToaster() {
  const { isDark } = useTheme()

  const palette = isDark
    ? { bg: '#182230', fg: '#e6edf6', border: '#1f2b3a' }
    : { bg: '#ffffff', fg: '#0f172a', border: '#e2e8f0' }

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        style: {
          background: palette.bg,
          color: palette.fg,
          border: `1px solid ${palette.border}`,
          borderRadius: 0,
          fontSize: '14px',
          padding: '12px 16px',
        },
        success: { iconTheme: { primary: '#10b981', secondary: palette.bg }, style: { borderLeft: '3px solid #10b981' } },
        error:   { iconTheme: { primary: '#ef4444', secondary: palette.bg }, style: { borderLeft: '3px solid #ef4444' } },
        loading: { iconTheme: { primary: '#3b82f6', secondary: palette.bg }, style: { borderLeft: '3px solid #3b82f6' } },
      }}
    />
  )
}