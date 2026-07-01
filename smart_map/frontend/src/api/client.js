import axios from 'axios'

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

/**
 * Axios client chính, có interceptor tự unwrap envelope ApiResponse.
 * Phù hợp cho JSON responses.
 */
const apiClient = axios.create({
  baseURL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Interceptor response: parse ApiResponse chuẩn -> throw error nếu success=false
apiClient.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === 'object' && 'success' in data) {
      if (!data.success) {
        const err = new Error(data.message || 'API error')
        err.code = data.code
        err.payload = data
        return Promise.reject(err)
      }
      return data.data
    }
    return data
  },
  (error) => {
    const msg =
      error.response?.data?.message ||
      error.message ||
      'Lỗi kết nối tới máy chủ'
    return Promise.reject(new Error(msg))
  }
)

/**
 * Raw client, không qua interceptor — dùng cho endpoints trả về text/plain
 * hoặc blob (VD: file export). Lỗi vẫn được parse từ response body nếu là JSON.
 */
const rawClient = axios.create({
  baseURL,
  timeout: 30000,
})

rawClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const data = error.response?.data
    if (typeof data === 'string' && data) {
      return Promise.reject(new Error(data))
    }
    if (data && typeof data === 'object' && data.message) {
      return Promise.reject(new Error(data.message))
    }
    return Promise.reject(new Error(error.message || 'Lỗi kết nối tới máy chủ'))
  }
)

export default apiClient
export { rawClient }
