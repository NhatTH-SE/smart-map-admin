import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { mapApi } from '../api/mapApi'
import { resolveImageUrl } from '../api/imageUrl'
import UploadMapModal from '../components/UploadMapModal'
import ConfirmModal from '../components/ConfirmModal'

export default function MapsPage() {
  const navigate = useNavigate()
  const [maps, setMaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [openUpload, setOpenUpload] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [deletingName, setDeletingName] = useState('')
  const [showDeleted, setShowDeleted] = useState(false)
  const [restoringId, setRestoringId] = useState(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = showDeleted
        ? await mapApi.getAllIncludingDeleted()
        : await mapApi.getAll()
      setMaps(data || [])
    } catch (err) {
      toast.error(err.message || 'Không tải được danh sách')
    } finally {
      setLoading(false)
    }
  }, [showDeleted])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { load() }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  const askDelete = (m) => {
    setDeletingId(m.id)
    setDeletingName(m.name)
  }

  const handleDelete = async () => {
    const id = deletingId
    const name = deletingName
    setDeletingId(null)
    setDeletingName('')
    try {
      await mapApi.remove(id)
      if (showDeleted) {
        // Đang hiện cả deleted: refresh để cập nhật flag
        load()
      } else {
        setMaps((prev) => prev.filter((m) => m.id !== id))
      }
      toast.success(`Đã xóa "${name}" (có thể khôi phục)`)
    } catch (err) {
      toast.error('Xóa thất bại: ' + (err.message || 'lỗi không xác định'))
    }
  }

  const handleRestore = async (m) => {
    setRestoringId(m.id)
    try {
      await mapApi.restore(m.id)
      toast.success(`Đã khôi phục "${m.name}"`)
      load()
    } catch (err) {
      toast.error('Khôi phục thất bại: ' + (err.message || 'lỗi không xác định'))
    } finally {
      setRestoringId(null)
    }
  }

  const deletedCount = maps.filter((m) => m.deletedAt).length

  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 pb-5 border-b border-border">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-accent-400 mb-1">Module 01</p>
          <h1 className="text-2xl font-semibold text-text tracking-tight">Quản lý Bản đồ</h1>
          <p className="text-sm text-text-soft mt-1.5">
            Upload sơ đồ mặt bằng và quản lý nhiều tầng/khu vực.
          </p>
        </div>
        <button onClick={() => setOpenUpload(true)} className="btn-primary">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14 M5 12h14" />
          </svg>
          Upload bản đồ
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs text-text-soft">
          Tổng cộng <span className="text-text font-mono">{maps.length}</span> bản đồ
          {showDeleted && deletedCount > 0 && (
            <span className="ml-2 text-amber-600">
              (đã xóa: <span className="font-mono">{deletedCount}</span>)
            </span>
          )}
        </p>
        <label className="flex items-center gap-2 text-xs text-text-soft cursor-pointer select-none">
          <input
            type="checkbox"
            checked={showDeleted}
            onChange={(e) => setShowDeleted(e.target.checked)}
            className="w-4 h-4 accent-accent-500 cursor-pointer"
          />
          Hiện cả bản đồ đã xóa
        </label>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-text-soft">
          <span className="inline-block w-5 h-5 border-2 border-border-strong border-t-accent-500 animate-spin mr-3" />
          Đang tải...
        </div>
      ) : maps.length === 0 ? (
        <div className="bg-bg-soft border border-dashed border-border-strong py-20 text-center">
          <div className="w-12 h-12 mx-auto bg-border flex items-center justify-center mb-4">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-text-muted" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6l9-3 9 3v12l-9 3-9-3V6z M12 3v18" />
            </svg>
          </div>
          <p className="text-text font-medium">Chưa có bản đồ nào</p>
          <p className="text-text-soft text-sm mt-1 mb-5">Upload sơ đồ đầu tiên để bắt đầu.</p>
          <button onClick={() => setOpenUpload(true)} className="btn-primary">
            Upload ngay
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {maps.map((m) => {
            const isDeleted = !!m.deletedAt
            return (
              <div
                key={m.id}
                className={`bg-bg-soft border transition-colors group ${
                  isDeleted
                    ? 'border-amber-300 opacity-60 grayscale'
                    : 'border-border hover:border-border-strong'
                }`}
              >
                <div className="aspect-video bg-bg-raised flex items-center justify-center overflow-hidden border-b border-border">
                  <img
                    src={resolveImageUrl(m.imageUrl)}
                    alt={m.name}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-4">
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <h3 className="font-semibold text-text truncate flex-1">{m.name}</h3>
                    {isDeleted ? (
                      <span className="badge-inactive">Đã xóa</span>
                    ) : m.isActive ? (
                      <span className="badge-active">Active</span>
                    ) : (
                      <span className="badge-inactive">Inactive</span>
                    )}
                  </div>
                  {m.description && (
                    <p className="text-sm text-text-soft mt-1.5 line-clamp-2">{m.description}</p>
                  )}
                  <div className="text-[11px] text-text-soft mt-2 font-mono uppercase tracking-wider">
                    {m.width} × {m.height} px
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    {isDeleted ? (
                      <button
                        onClick={() => handleRestore(m)}
                        disabled={restoringId === m.id}
                        className="flex-1 btn-primary py-1.5 disabled:opacity-50"
                      >
                        {restoringId === m.id ? 'Đang khôi phục...' : 'Khôi phục'}
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => navigate(`/admin/maps/${m.id}/edit`)}
                          className="flex-1 btn-primary py-1.5"
                        >
                          Mở Editor
                        </button>
                        <button
                          onClick={() => askDelete(m)}
                          className="px-3 py-1.5 text-xs font-medium text-red-600 bg-danger-soft/10 border border-danger-soft hover:bg-danger hover:text-white transition-colors"
                        >
                          Xóa
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <UploadMapModal
        open={openUpload}
        onClose={() => setOpenUpload(false)}
        onSuccess={() => { load(); toast.success('Đã upload bản đồ') }}
      />

      <ConfirmModal
        open={!!deletingId}
        onClose={() => { setDeletingId(null); setDeletingName('') }}
        onConfirm={handleDelete}
        title="Xóa bản đồ"
        message={`"${deletingName}" sẽ được ẩn khỏi hệ thống. Có thể khôi phục lại từ danh sách "Đã xóa".`}
        confirmText="Xóa"
        cancelText="Hủy"
        tone="danger"
      />
    </div>
  )
}