import { useEffect, useState } from 'react'

const calc = (deletedAt, windowSeconds) => {
  if (!deletedAt) return { secondsLeft: 0, isExpired: true }
  const deletedAtMs = new Date(deletedAt).getTime()
  if (Number.isNaN(deletedAtMs)) return { secondsLeft: 0, isExpired: true }
  const elapsed = Math.floor((Date.now() - deletedAtMs) / 1000)
  const left = Math.max(0, windowSeconds - elapsed)
  return { secondsLeft: left, isExpired: left <= 0 }
}

/**
 * Đếm ngược thời gian còn lại có thể khôi phục một record đã xóa mềm.
 * Sau khi hết hạn, trả về `secondsLeft = 0` và `isExpired = true`.
 *
 * @param {string|null|undefined} deletedAt - ISO timestamp khi record bị xóa
 * @param {number} windowSeconds - Cửa sổ khôi phục (mặc định 30s)
 * @returns {{ secondsLeft: number, isExpired: boolean }}
 */
export function useRestoreWindow(deletedAt, windowSeconds = 30) {
  // Reset state mỗi khi deletedAt đổi bằng cách dùng `key` ở parent hoặc
  // dùng pattern derived state: lưu snapshot deletedAt trong state.
  const [snapshot, setSnapshot] = useState(() => ({
    deletedAt,
    windowSeconds,
    value: calc(deletedAt, windowSeconds),
  }))

  // Nếu props thay đổi, cập nhật snapshot qua reducer (không setState trong effect)
  if (snapshot.deletedAt !== deletedAt || snapshot.windowSeconds !== windowSeconds) {
    setSnapshot({ deletedAt, windowSeconds, value: calc(deletedAt, windowSeconds) })
  }

  useEffect(() => {
    if (snapshot.value.isExpired) return undefined
    const id = setInterval(() => {
      setSnapshot((prev) => {
        const next = calc(prev.deletedAt, prev.windowSeconds)
        if (next.isExpired) clearInterval(id)
        return { ...prev, value: next }
      })
    }, 1000)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapshot.deletedAt, snapshot.windowSeconds])

  return snapshot.value
}
