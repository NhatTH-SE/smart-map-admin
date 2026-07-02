import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import { mapApi } from '../api/mapApi'
import { stationApi } from '../api/stationApi'
import { resolveImageUrl } from '../api/imageUrl'
import StationModal from '../components/StationModal'
import ConfirmModal from '../components/ConfirmModal'
import RestoreRow from '../components/RestoreRow'
import ExportCodeModal from '../components/ExportCodeModal'
import { useNowTick } from '../hooks/useNowTick'

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
  const [pendingDeleteStation, setPendingDeleteStation] = useState(null)
  const [restoringStationId, setRestoringStationId] = useState(null)
  const [showDeletedStations, setShowDeletedStations] = useState(false)
  const [showExportCode, setShowExportCode] = useState(false)
  const [draggingId, setDraggingId] = useState(null)
  const isDragging = useRef(false)
  const canvasRef = useRef(null)
  const dragStationRef = useRef(null)

  // ===== Zoom & Pan state ===================================================
  // scale: 0.25 .. 5. translate: pixel offset (top-left trước khi scale).
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 })
  const viewportRef = useRef(null)
  const SPACE_PAN_THRESHOLD = 5 // px — nếu move vượt quá sau khi bấm canvas → pan

  // Luôn load cả record đã xóa để dải "Đã xóa gần đây" có dữ liệu
  const loadAll = useCallback(async () => {
    setLoading(true)
    try {
      const mapData = await mapApi.getById(id)
      setMap(mapData)
      const stationData = await stationApi.getByMapIncludingDeleted(id)
      setStations(stationData || [])
    } catch (err) {
      toast.error(err.message || 'Lỗi tải dữ liệu')
    } finally {
      setLoading(false)
    }
  }, [id])

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => { if (id) loadAll() }, [id, loadAll])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Phải đặt trước early-return để không vi phạm Rules of Hooks
  const activeStations = useMemo(() => stations.filter((s) => !s.deletedAt), [stations])

  // Tick mỗi giây để re-render khi countdown chạm 0 → station biến mất khỏi UI
  const now = useNowTick(1000)

  const deletedStations = useMemo(() => {
    const cutoff = now - 30 * 1000
    return stations
      .filter((s) => s.deletedAt && new Date(s.deletedAt).getTime() >= cutoff)
      .sort((a, b) => new Date(b.deletedAt) - new Date(a.deletedAt))
  }, [stations, now])
  const visibleDeletedStations = showDeletedStations ? deletedStations : deletedStations.slice(0, 3)

  // canvasW/canvasH cần dùng trong các handler drag → khai báo trước early-return.
  const canvasW = map?.width || 240
  const canvasH = map?.height || 180

  const handleCanvasClick = (e) => {
    if (draggingId) return
    if (isPanning) return
    if (e.target !== e.currentTarget && !e.target.closest('[data-marker]') && !e.target.closest('[data-canvas-bg]')) return
    const pt = clientToMap(e.clientX, e.clientY)
    setPendingCoord({ x: Math.round(pt.x), y: Math.round(pt.y) })
  }

  // Wheel zoom: zoom vào vị trí con trỏ, giữ nguyên tọa độ map-gốc dưới cursor.
  const handleWheel = (e) => {
    if (!viewportRef.current) return
    e.preventDefault()
    const rect = viewportRef.current.getBoundingClientRect()
    const cx = e.clientX - rect.left
    const cy = e.clientY - rect.top
    const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
    setScale((prev) => {
      const next = Math.min(5, Math.max(0.25, prev * factor))
      // bù translate để điểm dưới cursor không "bay"
      const ratio = next / prev
      setTranslate((t) => ({ x: cx - (cx - t.x) * ratio, y: cy - (cy - t.y) * ratio }))
      return next
    })
  }

  const zoomIn  = () => setScale((s) => Math.min(5, +(s * 1.25).toFixed(3)))
  const zoomOut = () => setScale((s) => Math.max(0.25, +(s / 1.25).toFixed(3)))
  const resetView = () => { setScale(1); setTranslate({ x: 0, y: 0 }) }

  // ===== Pan (chuột giữa, hoặc chuột trái vào vùng nền canvas) =============
  // Click trái trên nền ảnh (không phải marker) → bắt đầu có thể pan.
  // Click trái lên marker → drag marker. Click trái không move >5px → tạo station.
  const onCanvasBgMouseDown = (e) => {
    if (e.button !== 0) return
    setIsPanning(false)
    panStartRef.current = { x: e.clientX, y: e.clientY, tx: translate.x, ty: translate.y }
  }
  useEffect(() => {
    const onMove = (e) => {
      const ps = panStartRef.current
      if (!ps || ps.tx === undefined) return
      const dx = e.clientX - ps.x
      const dy = e.clientY - ps.y
      if (!isPanning && (Math.abs(dx) > SPACE_PAN_THRESHOLD || Math.abs(dy) > SPACE_PAN_THRESHOLD)) {
        setIsPanning(true)
      }
      if (isPanning || (Math.abs(dx) > SPACE_PAN_THRESHOLD || Math.abs(dy) > SPACE_PAN_THRESHOLD)) {
        setTranslate({ x: ps.tx + dx, y: ps.ty + dy })
      }
    }
    const onUp = () => { panStartRef.current = { x: 0, y: 0, tx: undefined, ty: undefined } }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [isPanning])

  /** Chuyển clientX/Y (tương đối với viewport) sang tọa độ trong ảnh gốc. */
  const clientToMap = (clientX, clientY) => {
    if (!viewportRef.current) return { x: 0, y: 0 }
    const rect = viewportRef.current.getBoundingClientRect()
    const px = clientX - rect.left
    const py = clientY - rect.top
    // undo: translate trước, rồi scale
    return { x: (px - translate.x) / scale, y: (py - translate.y) / scale }
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
      const pt = clientToMap(me.clientX, me.clientY)
      const px = Math.max(0, Math.min(canvasW, pt.x))
      const py = Math.max(0, Math.min(canvasH, pt.y))
      const st = dragStationRef.current
      setStations((prev) => prev.map((s) => s.id === st.id ? { ...s, _displayX: px, _displayY: py } : s))
    }

    const onUp = async (me) => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      if (isDragging.current) {
        const pt = clientToMap(me.clientX, me.clientY)
        const realX = Math.max(0, Math.min(canvasW, pt.x))
        const realY = Math.max(0, Math.min(canvasH, pt.y))
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
      const pt = clientToMap(t.clientX, t.clientY)
      const px = Math.max(0, Math.min(canvasW, pt.x))
      const py = Math.max(0, Math.min(canvasH, pt.y))
      const st = dragStationRef.current
      setStations((prev) => prev.map((s) => s.id === st.id ? { ...s, _displayX: px, _displayY: py } : s))
    }

    const onEnd = async (me) => {
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      if (isDragging.current) {
        const t = me.changedTouches[0]
        const pt = clientToMap(t.clientX, t.clientY)
        const realX = Math.max(0, Math.min(canvasW, pt.x))
        const realY = Math.max(0, Math.min(canvasH, pt.y))
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
    const target = pendingDeleteStation
    if (!target) return
    setPendingDeleteStation(null) // đóng modal NGAY
    try {
      await stationApi.remove(target.id)
      await loadAll()
      toast.success(`Đã xóa "${target.name}" — khôi phục trong 30s`)
    } catch (err) {
      toast.error('Xóa thất bại: ' + err.message)
    }
  }

  const handleRestoreStation = async (s) => {
    setRestoringStationId(s.id)
    try {
      await stationApi.restore(s.id)
      toast.success(`Đã khôi phục "${s.name}"`)
      await loadAll()
    } catch (err) {
      toast.error('Khôi phục thất bại: ' + err.message)
    } finally {
      setRestoringStationId(null)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg text-text-soft">
        <span className="inline-block w-5 h-5 border-2 border-border-strong border-t-accent-500 animate-spin mr-3" />
        Đang tải...
      </div>
    )
  }

  if (!map) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-bg text-text-soft">
        <p>Không tìm thấy bản đồ.</p>
        <button onClick={() => navigate('/admin/maps')} className="mt-3 text-accent-500 hover:text-accent-700 text-sm">
          ← Quay lại danh sách
        </button>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-bg">
      {/* Header */}
      <div className="flex items-center gap-4 px-5 py-3 bg-bg-soft border-b border-border shrink-0">
        <button onClick={() => navigate('/admin/maps')} className="btn-ghost text-sm">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5 M12 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Danh sách</span>
        </button>
        <div className="h-6 w-px bg-border-strong" />
        <div>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-accent-400">Map Editor</p>
          <h1 className="text-base font-semibold text-text leading-tight">{map.name}</h1>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-text-soft">
            <span className="font-mono text-text">{activeStations.length}</span> trạm
            {deletedStations.length > 0 && (
              <span className="ml-1.5 text-amber-600">
                (<span className="font-mono">{deletedStations.length}</span> đã xóa)
              </span>
            )}
          </span>
          <span className="text-[10px] text-text-soft font-mono uppercase tracking-widest px-2 py-1 border border-border-strong">
            {canvasW} × {canvasH}
          </span>
          <button
            onClick={() => setShowExportCode(true)}
            className="ml-2 inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold tracking-wider uppercase
                       bg-accent-900/20 text-accent-500 border border-accent-500/40
                       hover:bg-accent-500 hover:text-text-inverted hover:border-accent-500 transition-colors"
            title="Sinh code C++ cho ESP32"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            Export C++
          </button>
        </div>
      </div>

      {/* Body: canvas + sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div className="flex flex-col flex-1 overflow-hidden bg-bg">
          <div className="flex-1 relative overflow-hidden">
            <div className="absolute top-4 left-4 z-10 text-[10px] font-semibold tracking-widest uppercase text-text-soft bg-bg-soft border border-border px-2 py-1 pointer-events-none">
              Click để vẽ · Scroll để zoom · Kéo nền để pan
            </div>

            {/* Zoom controls */}
            <div className="absolute bottom-4 right-4 z-10 flex flex-col gap-1 bg-bg-soft border border-border-strong shadow-lg">
              <button
                onClick={zoomIn}
                title="Phóng to"
                className="w-8 h-8 flex items-center justify-center text-text hover:bg-border text-lg leading-none"
              >+</button>
              <div className="px-2 py-1 text-[10px] font-mono text-text-soft text-center border-y border-border">
                {Math.round(scale * 100)}%
              </div>
              <button
                onClick={zoomOut}
                title="Thu nhỏ"
                className="w-8 h-8 flex items-center justify-center text-text hover:bg-border text-lg leading-none"
              >−</button>
              <button
                onClick={resetView}
                title="Đặt lại 100%"
                className="w-8 h-7 flex items-center justify-center text-text hover:bg-border text-[10px] font-mono border-t border-border"
              >1:1</button>
            </div>

            {/* Viewport: nhận wheel + pan background */}
            <div
              ref={viewportRef}
              onWheel={handleWheel}
              onMouseDown={onCanvasBgMouseDown}
              onMouseUp={() => setIsPanning(false)}
              className="absolute inset-0 overflow-hidden cursor-grab active:cursor-grabbing"
              style={{ cursor: isPanning ? 'grabbing' : 'grab' }}
            >
              <div
                className="absolute top-0 left-0 origin-top-left"
                style={{
                  transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                }}
              >
                <div
                  ref={canvasRef}
                  data-canvas-bg
                  className="relative bg-bg-raised border border-border-strong shadow-2xl"
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
                  {activeStations.map((s) => {
                    const x = s._displayX !== undefined ? s._displayX : s.coordX
                    const y = s._displayY !== undefined ? s._displayY : s.coordY
                    const isDraggingThis = draggingId === s.id
                    return (
                      <div
                        key={s.id}
                        data-marker-container
                        style={{
                          position: 'absolute', left: x, top: y,
                          zIndex: isDraggingThis ? 20 : 10,
                        }}
                      >
                        <div
                          data-marker
                          onMouseDown={(e) => handleMarkerMouseDown(e, s)}
                          onTouchStart={(e) => handleMarkerTouchStart(e, s)}
                          className="map-marker w-4 h-4 shadow cursor-grab active:cursor-grabbing"
                          style={{
                            cursor: isDraggingThis ? 'grabbing' : 'grab',
                            backgroundColor: 'var(--text-inverted)',
                            border: `2px solid #94a3b8`,
                          }}
                          title={s.name}
                        />
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="w-80 bg-bg-soft border-l border-border overflow-y-auto shrink-0">
          <div className="px-5 py-4 border-b border-border flex items-center justify-between">
            <div>
              <p className="text-[10px] font-semibold tracking-widest uppercase text-accent-400">Stations</p>
              <h2 className="text-sm font-semibold text-text mt-0.5">Danh sách trạm</h2>
            </div>
            <span className="text-xs font-mono text-text-soft bg-bg-raised px-2 py-1">{activeStations.length}</span>
          </div>

          {/* Dải "Đã xóa gần đây" — hiện luôn nút Khôi phục */}
          {deletedStations.length > 0 && (
            <div className="border-b border-amber-300 bg-amber-500/5">
              <div className="flex items-center justify-between px-4 py-2 border-b border-amber-300/60">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold tracking-widest uppercase text-amber-700">
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-2 14a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2L5 6 M10 11v6 M14 11v6 M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
                  </svg>
                  Đã xóa <span className="font-mono opacity-70">({deletedStations.length})</span>
                </div>
                <label className="flex items-center gap-1.5 text-[10px] text-text-soft cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={showDeletedStations}
                    onChange={(e) => setShowDeletedStations(e.target.checked)}
                    className="w-3.5 h-3.5 accent-accent-500 cursor-pointer"
                  />
                  Tất cả
                </label>
              </div>
              <ul className="divide-y divide-amber-300/40">
                {visibleDeletedStations.map((s) => (
                  <RestoreRow
                    key={s.id}
                    item={s}
                    meta={`Xóa lúc ${new Date(s.deletedAt).toLocaleTimeString('vi-VN')}`}
                    isRestoring={restoringStationId === s.id}
                    onRestore={handleRestoreStation}
                  />
                ))}
              </ul>
              {!showDeletedStations && deletedStations.length > 3 && (
                <button
                  onClick={() => setShowDeletedStations(true)}
                  className="block w-full text-[10px] text-amber-700 hover:text-amber-900 py-1.5 border-t border-amber-300/40"
                >
                  Xem thêm {deletedStations.length - 3} trạm đã xóa...
                </button>
              )}
            </div>
          )}

          {/* Status legend */}
          <div className="px-5 py-3 border-b border-border">
            <p className="text-[10px] font-semibold tracking-widest uppercase text-text-soft mb-2">Trạng thái</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_LABEL).map(([k, label]) => {
                const count = activeStations.filter((s) => s.status === k).length
                return (
                  <div key={k} className="flex items-center gap-1.5 text-xs text-text-soft">
                    <span className="w-2 h-2" style={{ backgroundColor: STATUS_COLOR[k] }} />
                    <span>{label}</span>
                    <span className="text-text-muted font-mono">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {activeStations.length === 0 && deletedStations.length === 0 ? (
            <div className="p-10 text-center text-sm text-text-soft">
              <p className="font-medium text-text mb-1">Chưa có trạm nào</p>
              <p className="text-xs">Click lên ảnh để thêm trạm đầu tiên.</p>
            </div>
          ) : activeStations.length === 0 ? (
            <div className="p-6 text-center text-sm text-text-soft">
              Tất cả trạm trên bản đồ đã bị xóa.
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {activeStations.map((s) => (
                <li
                  key={s.id}
                  className="p-4 hover:bg-bg-raised cursor-pointer transition-colors group"
                  onClick={() => setEditingStation(s)}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2.5 h-2.5 mt-1.5 shrink-0"
                      style={{ backgroundColor: STATUS_COLOR[s.status] || '#94a3b8' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-text truncate">{s.name}</div>
                      <div className="text-xs text-text-soft font-mono truncate mt-0.5">{s.macAddress}</div>
                      <div className="text-[10px] text-text-muted mt-1 font-mono uppercase tracking-wider">
                        ({Math.round(s.coordX)}, {Math.round(s.coordY)}) · {STATUS_LABEL[s.status]}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setPendingDeleteStation({ id: s.id, name: s.name }) }}
                      className="text-text-muted hover:text-red-600 text-lg leading-none shrink-0 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 flex items-center justify-center hover:bg-border"
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
        key={pendingDeleteStation?.id ?? 'closed'}
        open={!!pendingDeleteStation}
        onClose={() => setPendingDeleteStation(null)}
        onConfirm={handleDeleteStation}
        title="Xóa trạm"
        message={`"${pendingDeleteStation?.name}" sẽ được ẩn khỏi bản đồ. Có thể khôi phục trong vòng 30 giây từ dải "Đã xóa" phía trên.`}
        confirmText="Xóa"
        cancelText="Hủy"
        tone="danger"
      />

      <ExportCodeModal
        open={showExportCode}
        onClose={() => setShowExportCode(false)}
        mapId={Number(id)}
        mapName={map?.name}
      />
    </div>
  )
}