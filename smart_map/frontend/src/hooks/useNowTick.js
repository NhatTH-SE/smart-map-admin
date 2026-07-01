import { useEffect, useState } from 'react'

/**
 * Trả về timestamp hiện tại (ms) được cập nhật mỗi `intervalMs` (mặc định 1000ms).
 * Dùng để trigger re-render khi cần tính lại trạng thái theo thời gian thực
 * (vd: lọc các record soft-delete đã hết hạn).
 *
 * @param {number} intervalMs
 * @returns {number} Date.now()
 */
export function useNowTick(intervalMs = 1000) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return now
}