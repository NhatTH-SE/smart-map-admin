import { useEffect, useState } from 'react'

/**
 * Modal xác nhận (thay thế window.confirm).
 * Props:
 *   - open: boolean
 *   - onClose: () => void
 *   - onConfirm: () => void | Promise<void>
 *   - title: string
 *   - message: string | ReactNode
 *   - confirmText: string
 *   - cancelText: string
 *   - tone: 'danger' | 'primary' | 'warning'
 *   - loading: do component cha điều khiển (nếu cần)
 */
export default function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Xác nhận',
  message,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  tone = 'danger',
}) {
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape' && !submitting) onClose?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, submitting, onClose])

  // Đóng = unmount nhờ parent quản lý `open`. Submitting chỉ tồn tại khi modal mở.
  if (!open) return null

  const handleConfirm = async () => {
    if (submitting) return
    try {
      setSubmitting(true)
      await onConfirm?.()
    } finally {
      setSubmitting(false)
    }
  }

  const toneStyles = {
    danger: {
      icon: '!',
      iconBg: 'bg-danger-soft/40',
      iconText: 'text-red-300',
      btn: 'btn-danger',
    },
    warning: {
      icon: '!',
      iconBg: 'bg-amber-900/40',
      iconText: 'text-amber-300',
      btn: 'bg-amber-600 text-white hover:bg-amber-700 border border-amber-700',
    },
    primary: {
      icon: '?',
      iconBg: 'bg-accent-900/40',
      iconText: 'text-accent-300',
      btn: 'btn-primary',
    },
  }
  const t = toneStyles[tone] || toneStyles.primary

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-ink-900 border border-ink-700 shadow-2xl w-full max-w-md">
        <div className="flex items-start gap-4 p-5 border-b border-ink-800">
          <div className={`w-10 h-10 ${t.iconBg} ${t.iconText} flex items-center justify-center text-lg font-bold shrink-0`}>
            {t.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-white">{title}</h3>
            {message && (
              <p className="text-sm text-ink-300 mt-1.5 leading-relaxed">{message}</p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 bg-ink-850">
          <button type="button" onClick={onClose} disabled={submitting} className="btn-secondary">
            {cancelText}
          </button>
          <button type="button" onClick={handleConfirm} disabled={submitting} className={t.btn}>
            {submitting && (
              <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />
            )}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  )
}
