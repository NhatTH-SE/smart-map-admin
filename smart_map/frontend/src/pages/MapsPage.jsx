import { useCallback, useEffect, useMemo, useState } from 'react'
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
  const [pendingDelete, setPendingDelete] = useState(null) // {id,name}
  const [showDeleted, setShowDeleted] = useState(false)
  const [restoringId, setRestoringId] = useState(null)

  // Load cả record đã xóa để dải "Đã xóa gần đây" luôn có dữ liệu
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await mapApi.getAllIncludingDeleted()
      setMaps(data || [])
    } catch (err) {
      toast.error(err.message || 'Không tải được danh sách')
    } finally {
      setLoading(false)
    }
  }, [])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { load() }, [load])
  /* eslint-enable react-hooks/set-state-in-effect */

  const askDelete = (m) => {
    setPendingDelete({ id: m.id, name: m.name })
  }

  const cancelDelete = () => {
    setPendingDelete(null)
  }

  const handleDelete = async () => {
    const target = pendingDelete
    if (!target) return
    setPendingDelete(null) // đóng modal NGAY (synchronous), parent re-render
    try {
      await mapApi.remove(target.id)
      // Reload toàn bộ để cập nhật deletedAt
      await load()
      toast.success(`Đã xóa "${target.name}" (có thể khôi phục)`)
    } catch (err) {
      toast.error('Xóa thất bại: ' + (err.message || 'lỗi không xác định'))
    }
  }

  const handleRestore = async (m) => {
    setRestoringId(m.id)
    try {
      await mapApi.restore(m.id)
      toast.success(`Đã khôi phục "${m.name}"`)
      await load()
    } catch (err) {
      toast.error('Khôi phục thất bại: ' + (err.message || 'lỗi không xác định'))
    } finally {
      setRestoringId(null)
    }
  }

  const activeMaps = useMemo(() => maps.filter((m) => !m.deletedAt), [maps])
  const deletedMaps = useMemo(
    () => maps
      .filter((m) => m.deletedAt)
      .sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt)),
    [maps]
  )
  const visibleDeleted = showDeleted ? deletedMaps : deletedMaps.slice(0, 3)

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
          Tổng cộng <span className="text-text font-mono">{activeMaps.length}</span> bản đồ
          {deletedMaps.length > 0 && (
            <span className="ml-2 text-amber-600">
              (đã xóa: <span className="font-mono">{deletedMaps.length}</span>)
            </span>
          )}
        </p>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-text-soft">
          <span className="inline-block w-5 h-5 border-2 border-border-strong border-t-accent-500 animate-spin mr-3" />
          Đang tải...
        </div>
      ) : activeMaps.length === 0 && deletedMaps.length === 0 ? (
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
        <>
          {/* ============ Dải "Đã xóa gần đây" — hiện luôn nút Khôi phục ============ */}
          {deletedMaps.length > 0 && (
            <div className="mb-6 border border-amber-300 bg-amber-500/5">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-amber-300/60">
                <div className="flex items-center gap-2 text-xs font-semibold tracking-widest uppercase text-amber-700">
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6 M10 11v6 M14 11v6 M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  Đã xóa gần đây
                  <span className="font-mono text-amber-600/70">({deletedMaps.length})</span>
                </div>
                <label className="flex items-center gap-2 text-xs text-text-soft cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showDeleted}
                    onChange={(e) => setShowDeleted(e.target.checked)}
                    className="w-4 h-4 accent-accent-500 cursor-pointer"
                  />
                  Hiện tất cả
                </label>
              </div>
              <ul className="divide-y divide-amber-300/40">
                {visibleDeleted.map((m) => (
                  <li key={m.id} className="flex items-center gap-3 px-4 py-2.5">
                    <div
                      className="w-10 h-10 bg-bg-raised border border-border shrink-0 bg-cover bg-center"
                      style={{ backgroundImage: `url(${resolveImageUrl(m.imageUrl)})` }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-text truncate">{m.name}</div>
                      <div className="text-[11px] text-text-soft font-mono">
                        ID #{m.id} · Xóa lúc {new Date(m.deletedAt).toLocaleString('vi-VN')}
                      </div>
                    </div>
                    <button
                      onClick={() => handleRestore(m)}
                      disabled={restoringId === m.id}
                      className="btn-primary py-1.5 px-4 text-xs disabled:opacity-50"
                    >
                      {restoringId === m.id ? 'Đang khôi phục...' : 'Khôi phục'}
                    </button>
                  </li>
                ))}
              </ul>
              {!showDeleted && deletedMaps.length > 3 && (
                <button
                  onClick={() => setShowDeleted(true)}
                  className="block w-full text-xs text-amber-700 hover:text-amber-900 py-2 border-t border-amber-300/40"
                >
                  Xem thêm {deletedMaps.length - 3} bản đồ đã xóa...
                </button>
              )}
            </div>
          )}

          {/* ============ Grid bản đồ đang hoạt động ============ */}
          {activeMaps.length === 0 ? (
            <div className="bg-bg-soft border border-dashed border-border-strong py-16 text-center text-text-soft text-sm">
              Không còn bản đồ nào đang hoạt động.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {activeMaps.map((m) => (
                <div
                  key={m.id}
                  className="bg-bg-soft border border-border hover:border-border-strong transition-colors group"
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
                      {m.isActive ? (
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
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      <UploadMapModal
        open={openUpload}
        onClose={() => setOpenUpload(false)}
        onSuccess={() => { load(); toast.success('Đã upload bản đồ') }}
      />

      {/* key=pendingDelete.id đảm bảo modal remount mỗi lần mở → state `submitting` luôn sạch */}
      <ConfirmModal
        key={pendingDelete?.id ?? 'closed'}
        open={!!pendingDelete}
        onClose={cancelDelete}
        onConfirm={handleDelete}
        title="Xóa bản đồ"
        message={`"${pendingDelete?.name}" sẽ được ẩn khỏi hệ thống. Có thể khôi phục lại từ dải "Đã xóa gần đây" phía trên.`}
        confirmText="Xóa"
        cancelText="Hủy"
        tone="danger"
      />
    </div>
  )
}