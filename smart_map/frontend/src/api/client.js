import axios from 'axios'

/**
 * Axios client chung cho toàn bộ Frontend.
 * Mọi API call đều đi qua instance này để dễ config (interceptor, baseURL, ...).
 */
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
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

export default apiClient
