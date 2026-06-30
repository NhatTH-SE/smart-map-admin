const BACKEND_ORIGIN =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api$/, '') ||
  'http://localhost:8080'

/**
 * Convert đường dẫn /files/... trả về từ backend -> URL đầy đủ truy cập được.
 * Ví dụ: "/files/maps/abc.png" -> "http://localhost:8080/files/maps/abc.png"
 */
export function resolveImageUrl(path) {
  if (!path) return ''
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  return `${BACKEND_ORIGIN}${path}`
}
