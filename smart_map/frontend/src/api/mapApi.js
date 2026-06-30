import apiClient from './client'

/**
 * API cho Module 1: Quản lý Bản đồ.
 * Mỗi hàm trả về Promise resolve với data (đã unwrap ApiResponse).
 */
export const mapApi = {
  // Lấy danh sách tất cả
  getAll: () => apiClient.get('/maps'),

  // Lấy danh sách đang active
  getActive: () => apiClient.get('/maps/active'),

  // Chi tiết
  getById: (id) => apiClient.get(`/maps/${id}`),

  // Upload bản đồ mới
  create: (file, name, description) => {
    const form = new FormData()
    form.append('file', file)
    form.append('name', name)
    if (description) form.append('description', description)
    return apiClient.post('/maps', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Cập nhật thông tin
  update: (id, payload) => apiClient.put(`/maps/${id}`, payload),

  // Thay ảnh
  updateImage: (id, file) => {
    const form = new FormData()
    form.append('file', file)
    return apiClient.patch(`/maps/${id}/image`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },

  // Xóa
  remove: (id) => apiClient.delete(`/maps/${id}`),
}
