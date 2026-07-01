import apiClient from './client'

/**
 * API cho Module 2: Quản lý Trạm phát (Beacon/iTag).
 */
export const stationApi = {
  // Lấy tất cả (cho admin list, ẩn record đã soft-delete)
  getAll: () => apiClient.get('/stations'),

  // Lấy tất cả bao gồm cả record đã soft-delete
  getAllIncludingDeleted: () => apiClient.get('/stations?includeDeleted=true'),

  // Lấy danh sách trạm theo bản đồ
  getByMap: (mapId) => apiClient.get(`/stations?mapId=${mapId}`),

  // Lấy danh sách trạm theo bản đồ, bao gồm cả đã xóa
  getByMapIncludingDeleted: (mapId) => apiClient.get(`/stations?mapId=${mapId}&includeDeleted=true`),

  // Lọc theo trạng thái
  getByStatus: (status) => apiClient.get(`/stations?status=${status}`),

  // Tìm theo tên / MAC
  search: (q) => apiClient.get(`/stations?q=${encodeURIComponent(q)}`),

  // Đếm theo status (cho header summary)
  getStats: () => apiClient.get('/stations/stats'),

  // Chi tiết
  getById: (id) => apiClient.get(`/stations/${id}`),

  // Tạo mới
  create: (payload) => apiClient.post('/stations', payload),

  // Cập nhật
  update: (id, payload) => apiClient.put(`/stations/${id}`, payload),

  // Đổi trạng thái nhanh
  updateStatus: (id, status) =>
    apiClient.patch(`/stations/${id}/status`, { status }),

  // Xóa (soft delete — có thể khôi phục)
  remove: (id) => apiClient.delete(`/stations/${id}`),

  // Khôi phục trạm đã soft-delete
  restore: (id) => apiClient.post(`/stations/${id}/restore`),
}
