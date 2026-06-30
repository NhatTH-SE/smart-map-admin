import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { mapApi } from '../api/mapApi'
import { stationApi } from '../api/stationApi'
import { resolveImageUrl } from '../api/imageUrl'
import StationModal from '../components/StationModal'
import ConfirmModal from '../components/ConfirmModal'

const STATUS_COLOR = {
  ACTIVE: '#10b981',
  MAINTENANCE: '#f59e0b',
  LOST: '#ef4444',
}

const STATUS_LABEL = {
  ACTIVE: 'Hoạt động',
  MAINTENANCE: 'Bảo trì',
  LOST: 'Mất tín hiệu',
}

export default function MapEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const imgRef = useRef(null)

  const [map, setMap] = useState(null)
  const [stations, setStations] = useState([])
  const [loading, setLoading] = useState(true)

  const [pendingCoord, setPendingCoord] = useState(null)
  const [editingStation, setEditingStation] = useState(null)
  const [deletingStation, setDeletingStation] = useState(null)
  const [draggingId, setDraggingId] = useState(null)
  const isDragging = useRef(false)
  const canvasRef = useRef(null)
  const dragStationRef = useRef(null)

  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const mapData = await mapApi.getById(id)
      setMap(mapData)
      const stationData = await stationApi.getByMap(id)
      setStations(stationData || [])
    } catch (err) {
      toast.error(err.message || 'Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [id])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { if (id) loadAll() }, [id, loadAll])

  const handleCanvasClick = (e) => {
    if (draggingId) return
    if (e.target !== e.currentTarget && !e.target.closest('[data-marker]')) return
    const rect = e.currentTarget.getBoundingClientRect()
    const px = e.clientX - rect.left
    const py = e.clientY - rect.top
    setPendingCoord({ x: Math.round(px), y: Math.round(py) })
  }

  const handleMarkerMouseDown = (e, station) => {
    e.preventDefault(); e.stopPropagation()
    isDragging.current = false
    dragStationRef.current = station
    setDraggingId(station.id)
    const startX = e.clientX; const startY = e.clientY

    const onMove = (me) => {
      const dx = Math.abs(me.clientX - startX); const dy = Math.abs(me.clientY - startY)
      if (dx > 3 || dy > 3) isDragging.current = true
      if (!isDragging.current) return
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const px = Math.max(0, Math.min(rect.width, me.clientX - rect.left))
      const py = Math.max(0, Math.min(rect.height, me.clientY - rect.top))
      const st = dragStationRef.current
      setStations((prev) => prev.map((s) => s.id === st.id ? { ...s, _displayX: px, _displayY: py } : s))
    }

    const onUp = async (me) => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (isDragging.current && canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        const realX = Math.max(0, Math.min(rect.width, me.clientX - rect.left))
        const realY = Math.max(0, Math.min(rect.height, me.clientY - rect.top))
        const st = dragStationRef.current
        try {
          await stationApi.update(st.id, {
            mapId: st.mapId, name: st.name, macAddress: st.macAddress,
            coordX: Math.round(realX), coordY: Math.round(realY),
            status: st.status, notes: st.notes,
          })
          setStations((prev) => prev.map((s) => s.id === st.id ? { ...s, coordX: realX, coordY: realY } : s))
          toast.success(`Đã cập nhật vị trí "${st.name}"`)
        } catch (err) {
          toast.error('Không lưu được vị trí: ' + err.message)
        }
      } else if (!isDragging.current) {
        setEditingStation(dragStationRef.current)
      }
      setDraggingId(null); dragStationRef.current = null
    }

    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  const handleMarkerTouchStart = (e, station) => {
    e.preventDefault(); e.stopPropagation()
    const touch = e.touches[0]
    isDragging.current = false
    dragStationRef.current = station
    setDraggingId(station.id)
    const startX = touch.clientX; const startY = touch.clientY

    const onMove = (me) => {
      me.preventDefault()
      const t = me.touches[0]
      const dx = Math.abs(t.clientX - startX); const dy = Math.abs(t.clientY - startY)
      if (dx > 3 || dy > 3) isDragging.current = true
      if (!isDragging.current) return
      if (!canvasRef.current) return
      const rect = canvasRef.current.getBoundingClientRect()
      const px = Math.max(0, Math.min(rect.width, t.clientX - rect.left))
      const py = Math.max(0, Math.min(rect.height, t.clientY - rect.top))
      const st = dragStationRef.current
      setStations((prev) => prev.map((s) => s.id === st.id ? { ...s, _displayX: px, _displayY: py } : s))
    }

    const onEnd = async (me) => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      if (isDragging.current && canvasRef.current) {
        const t = me.changedTouches[0]
        const rect = canvasRef.current.getBoundingClientRect()
        const realX = Math.max(0, Math.min(rect.width, t.clientX - rect.left))
        const realY = Math.max(0, Math.min(rect.height, t.clientY - rect.top))
        const st = dragStationRef.current
        try {
          await stationApi.update(st.id, {
            mapId: st.mapId, name: st.name, macAddress: st.macAddress,
            coordX: Math.round(realX), coordY: Math.round(realY),
            status: st.status, notes: st.notes,
          })
          setStations((prev) => prev.map((s) => s.id === st.id ? { ...s, coordX: realX, coordY: realY } : s))
        } catch { /* lỗi kéo thả không cảnh báo — UX chấp nhận được */ }
      }
      setDraggingId(null); dragStationRef.current = null
    }

    window.addEventListener('touchmove', onMove, { passive: false })
    window.addEventListener('touchend', onEnd)
  }

  const handleDeleteStation = async () => {
    const s = deletingStation
    try {
      await stationApi.remove(s.id)
      setStations((prev) => prev.filter((x) => x.id !== s.id))
      toast.success(`Đã xóa "${s.name}"`)
    } catch (err) {
      toast.error('Xóa thất bại: ' + err.message)
      throw err
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-ink-950 text-ink-400">
        <span className="inline-block w-5 h-5 border-2 border-ink-700 border-t-accent-500 animate-spin mr-3" />
        Đang tải...
      </div>
    )
  }

  if (!map) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-ink-950 text-ink-400">
        <p>Không tìm thấy bản đồ.</p>
        <button onClick={() => navigate('/admin/maps')} className="mt-3 text-accent-400 hover:text-accent-300 text-sm">
          ← Quay lại danh sách
        </button>
      </div>
    )
  }

  const canvasW = map.width || 240
  const canvasH = map.height || 180

  return (
    <div className="flex flex-col h-screen bg-ink-950">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-3 bg-ink-900 border-b border-ink-800 shrink-0">
        <button onClick={() => navigate('/admin/maps')} className="btn-ghost text-sm">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5 M12 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Danh sách</span>
        </button>
        <div className="h-6 w-px bg-ink-700" />
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-accent-400">Map Editor</p>
          <h1 className="text-base font-semibold text-white leading-tight">{map.name}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-ink-400">
            <span className="font-mono text-ink-200">{stations.length}</span> trạm
          </span>
          <span className="text-[10px] text-ink-400 font-mono uppercase tracking-widest px-2 py-1 border border-ink-700">
            {canvasW} × {canvasH}
          </span>
        </div>
      </div>

      {/* Body: canvas + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex flex-col flex-1 overflow-auto bg-ink-950">
          <div className="flex-1 flex items-center justify-center p-6 relative">
            <div className="absolute top-4 left-4 text-[10px] font-semibold tracking-widest uppercase text-ink-400 bg-ink-900 border border-ink-800 px-2 py-1">
              Click vào ảnh để đặt trạm
            </div>
            <div
              ref={canvasRef}
              className="relative bg-ink-850 border border-ink-800 shadow-2xl"
              style={{ width: canvasW, height: canvasH }}
              onClick={handleCanvasClick}
            >
              <img
                ref={imgRef}
                src={resolveImageUrl(map.imageUrl)}
                alt={map.name}
                draggable={false}
                className="absolute inset-0 w-full h-full select-none pointer-events-none"
              />
              {stations.map((s) => {
                const x = s._displayX !== undefined ? s._displayX : s.coordX
                const y = s._displayY !== undefined ? s._displayY : s.coordY
                const isDraggingThis = draggingId === s.id
                return (
                  <div
                    key={s.id}
                    data-marker-container
                    style={{
                      position: 'absolute', left: x, top: y,
                      transform: 'translate(-50%, -50%)',
                      zIndex: isDraggingThis ? 20 : 10,
                    }}
                  >
                    <div
                      data-marker
                      onMouseDown={(e) => handleMarkerMouseDown(e, s)}
                      onTouchStart={(e) => handleMarkerTouchStart(e, s)}
                      className="map-marker w-3 h-3 bg-slate-400 border border-white shadow cursor-grab active:cursor-grabbing"
                      style={{ cursor: isDraggingThis ? 'grabbing' : 'grab' }}
                      title={s.name}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-80 bg-ink-900 border-l border-ink-800 overflow-y-auto shrink-0">
          <div className="px-5 py-4 border-b border-ink-800 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-accent-400">Stations</p>
              <h2 className="text-sm font-semibold text-white mt-0.5">Danh sách trạm</h2>
            </div>
            <span className="text-xs font-mono text-ink-300 bg-ink-800 px-2 py-1">{stations.length}</span>
          </div>

          {/* Filter theo status (tự nhiên hiển thị) */}
          <div className="px-5 py-3 border-b border-ink-800">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-ink-400 mb-2">Trạng thái</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_LABEL).map(([k, label]) => {
                const count = stations.filter((s) => s.status === k).length
                return (
                  <div key={k} className="flex items-center gap-1.5 text-xs text-ink-300">
                    <span className="w-2 h-2" style={{ backgroundColor: STATUS_COLOR[k] }} />
                    <span>{label}</span>
                    <span className="text-ink-400 font-mono">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {stations.length === 0 ? (
            <div className="p-10 text-center text-sm text-ink-400">
              <p className="font-medium text-ink-300 mb-1">Chưa có trạm nào</p>
              <p className="text-xs">Click lên ảnh để thêm trạm đầu tiên.</p>
            </div>
          ) : (
            <ul className="divide-y divide-ink-800">
              {stations.map((s) => (
                <li
                  key={s.id}
                  className="p-4 hover:bg-ink-850 cursor-pointer transition-colors group"
                  onClick={() => setEditingStation(s)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2.5 h-2.5 mt-1.5 shrink-0"
                      style={{ backgroundColor: STATUS_COLOR[s.status] || '#94a3b8' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white truncate">{s.name}</div>
                      <div className="text-xs text-ink-400 font-mono truncate mt-0.5">{s.macAddress}</div>
                      <div className="text-[10px] text-ink-500 mt-1 font-mono uppercase tracking-wider">
                        ({Math.round(s.coordX)}, {Math.round(s.coordY)}) · {STATUS_LABEL[s.status]}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeletingStation(s) }}
                      className="text-ink-500 hover:text-red-400 text-lg leading-none shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center hover:bg-ink-800"
                      title="Xóa trạm"
                    >×</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </aside>
      </div>

      {/* Modal tạo */}
      {pendingCoord && (
        <StationModal
          open={!!pendingCoord}
          mapId={Number(id)}
          coordX={pendingCoord.x}
          coordY={pendingCoord.y}
          onClose={() => setPendingCoord(null)}
          onSuccess={() => { setPendingCoord(null); loadAll(); toast.success('Đã tạo trạm') }}
        />
      )}

      {/* Modal sửa */}
      {editingStation && (
        <StationModal
          open={!!editingStation}
          station={editingStation}
          onClose={() => setEditingStation(null)}
          onSuccess={() => { setEditingStation(null); loadAll(); toast.success('Đã cập nhật') }}
        />
      )}

      <ConfirmModal
        open={!!deletingStation}
        onClose={() => setDeletingStation(null)}
        onConfirm={handleDeleteStation}
        title="Xóa trạm"
        message={`Bạn có chắc muốn xóa trạm "${deletingStation?.name}"? Hành động không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        tone="danger"
      />
    </div>
  )
}
