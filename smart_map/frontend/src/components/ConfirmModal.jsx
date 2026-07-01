import { useEffect, useState } from 'react'

/**
 * Modal xác nhận (thay thế window.confirm).
 * Props:
 *   - open, onClose, onConfirm, title, message, confirmText, cancelText
 *   - tone: 'danger' | 'primary' | 'warning'
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

  if (!open) return null

  const handleConfirm = async () => {
    if (submitting) return
    try {
      setSubmitting(true)
      // Quan trọng: KHÔNG gọi onClose ở đây. Parent chịu trách nhiệm đóng
      // sau khi await xong API. Gọi onClose ngay sẽ unmount modal nhưng
      // state `submitting` còn `true` — gây treo nút X ở lần mở sau.
      await onConfirm?.()
    } finally {
      setSubmitting(false)
    }
  }

  const toneStyles = {
    danger: {
      icon: '!',
      iconBg: 'bg-danger-soft/20',
      iconText: 'text-red-600',
      btn: 'btn-danger',
    },
    warning: {
      icon: '!',
      iconBg: 'bg-amber-500/15',
      iconText: 'text-amber-600',
      btn: 'bg-amber-600 text-white hover:bg-amber-700 border border-amber-700',
    },
    primary: {
      icon: '?',
      iconBg: 'bg-accent-900/20',
      iconText: 'text-accent-600',
      btn: 'btn-primary',
    },
  }
  const t = toneStyles[tone] || toneStyles.primary

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose?.() }}
    >
      <div className="bg-bg-soft border border-border-strong shadow-2xl w-full max-w-md">
        <div className="flex items-start gap-4 p-5 border-b border-border">
          <div className={`w-10 h-10 ${t.iconBg} ${t.iconText} flex items-center justify-center text-lg font-bold shrink-0`}>
            {t.icon}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-text">{title}</h3>
            {message && (
              <p className="text-sm text-text-soft mt-1.5 leading-relaxed">{message}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="text-text-muted hover:text-text shrink-0 w-7 h-7 flex items-center justify-center -mt-1 -mr-1"
            title="Đóng"
          >
            ×
          </button>
        </div>

        <div className="flex justify-end gap-2 px-5 py-4 bg-bg-raised">
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