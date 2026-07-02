import { useEffect, useState } from 'react'
import { stationApi } from '../api/stationApi'
import { mapApi } from '../api/mapApi'

const STATUS_LABELS = {
  ACTIVE: 'Hoạt động',
  MAINTENANCE: 'Bảo trì',
  LOST: 'Mất tín hiệu',
}

/**
 * Modal tạo/sửa trạm. Hỗ trợ 2 chế độ:
 *   - 'minimal' (mặc định cho Map Editor): chỉ nhập tên, hiển thị tọa độ.
 *   - 'full' (cho Stations Page): chọn bản đồ → chọn station đã vẽ trên map
 *       (auto-fill name + X, Y) → nhập MAC + trạng thái.
 *
 * Props:
 *   - open, onClose, onSuccess
 *   - mode: 'minimal' | 'full' (mặc định 'minimal')
 *   - mapId, coordX, coordY: pre-fill vị trí khi mở từ Map Editor
 *   - station: nếu sửa, truyền station hiện tại
 *   - maps: optional, danh sách map cho mode 'full' (không truyền → tự load)
 *   - prefillMac: gợi ý MAC khi tạo mới ở mode 'full'
 */
export default function StationModal({
  open, onClose, onSuccess,
  mode = 'minimal',
  mapId,
  station,
  coordX,
  coordY,
  maps: mapsProp,
  prefillMac,
}) {
  const isEdit = !!station
  const isFull = mode === 'full'

  const [maps, setMaps] = useState([])
  const [stationsOnMap, setStationsOnMap] = useState([])
  const [pickedMapId, setPickedMapId] = useState('')
  const [pickedStationId, setPickedStationId] = useState('')
  const [name, setName] = useState('')
  const [macAddress, setMacAddress] = useState('')
  const [pickedCoordX, setPickedCoordX] = useState('')
  const [pickedCoordY, setPickedCoordY] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [loadingStations, setLoadingStations] = useState(false)

  // Load danh sách map (mode full, không phải edit, không có sẵn mapsProp)
  useEffect(() => {
    if (!open || !isFull || isEdit || mapsProp) return
    let alive = true
    mapApi.getAll()
      .then((data) => { if (alive) setMaps(data || []) })
      .catch(() => { if (alive) setMaps([]) })
    return () => { alive = false }
  }, [open, isFull, isEdit, mapsProp])

  // Khi đổi map ở mode full (create) → load danh sách station đã vẽ trên map đó
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open || !isFull || isEdit) return
    if (!pickedMapId) { setStationsOnMap([]); setLoadingStations(false); return }
    let alive = true
    setLoadingStations(true)
    stationApi.getByMap(Number(pickedMapId))
      .then((data) => {
        if (!alive) return
        setStationsOnMap((data || []).filter((s) => !s.deletedAt))
      })
      .catch(() => { if (alive) setStationsOnMap([]) })
      .finally(() => { if (alive) setLoadingStations(false) })
    return () => { alive = false }
  }, [open, isFull, isEdit, pickedMapId])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Reset form khi mở
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (!open) return
    if (isEdit) {
      setName(station.name || '')
      setMacAddress(station.macAddress || '')
      setPickedMapId(station.mapId ? String(station.mapId) : '')
      setPickedCoordX(station.coordX != null ? String(Math.round(station.coordX)) : '')
      setPickedCoordY(station.coordY != null ? String(Math.round(station.coordY)) : '')
      setStatus(station.status || 'ACTIVE')
      setNotes(station.notes || '')
      setPickedStationId('')
    } else {
      setName(''); setMacAddress(prefillMac || '')
      setPickedMapId(mapId ? String(mapId) : '')
      setPickedCoordX(coordX != null ? String(Math.round(coordX)) : '')
      setPickedCoordY(coordY != null ? String(Math.round(coordY)) : '')
      setStatus('ACTIVE'); setNotes('')
      setPickedStationId('')
    }
    setError('')
  }, [open, isEdit, station, mapId, coordX, coordY, prefillMac])
  /* eslint-enable react-hooks/set-state-in-effect */

  // Auto-clear error khi user gõ lại
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (error) setError('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [macAddress, name])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && open && !submitting) onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, submitting, onClose])

  if (!open) return null

  const handlePickStation = (stationId) => {
    setPickedStationId(stationId)
    if (!stationId) return
    const found = stationsOnMap.find((s) => String(s.id) === String(stationId))
    if (!found) return
    setName(found.name || '')
    setPickedCoordX(found.coordX != null ? String(Math.round(found.coordX)) : '')
    setPickedCoordY(found.coordY != null ? String(Math.round(found.coordY)) : '')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) return setError('Vui lòng nhập tên trạm')

    let finalMapId, finalX, finalY
    if (isEdit) {
      finalMapId = station.mapId
      finalX = isFull ? Number(pickedCoordX || station.coordX) : station.coordX
      finalY = isFull ? Number(pickedCoordY || station.coordY) : station.coordY
    } else {
      if (isFull) {
        finalMapId = pickedMapId ? Number(pickedMapId) : null
      } else {
        finalMapId = mapId ?? (pickedMapId ? Number(pickedMapId) : null)
      }
      finalX = coordX ?? Number(pickedCoordX)
      finalY = coordY ?? Number(pickedCoordY)
    }
    if (!finalMapId) return setError('Vui lòng chọn bản đồ')
    if (finalX == null || Number.isNaN(finalX)) return setError('Vui lòng nhập tọa độ X')
    if (finalY == null || Number.isNaN(finalY)) return setError('Vui lòng nhập tọa độ Y')

    // mode full yêu cầu MAC + status (chọn từ dropdown station chỉ khi create)
    if (isFull && !isEdit && !pickedStationId) {
      return setError('Vui lòng chọn trạm đã vẽ trên bản đồ')
    }
    if (isFull && !macAddress.trim()) {
      return setError('Vui lòng nhập MAC address')
    }

    setSubmitting(true)
    try {
      const payload = {
        mapId: finalMapId,
        name: name.trim(),
        macAddress: (macAddress || '').trim().toUpperCase() || '00:00:00:00:00:00',
        coordX: finalX,
        coordY: finalY,
        status,
        notes: notes.trim() || null,
      }
      if (isEdit) {
        await stationApi.update(station.id, payload)
      } else {
        await stationApi.create(payload)
      }
      onSuccess?.()
      onClose?.()
    } catch (err) {
      setError(err.message || 'Lưu thất bại')
    } finally {
      setSubmitting(false)
    }
  }

  const mapsList = mapsProp || maps
  const hasMapOptions = mapsList.length > 0
  const hasStationOptions = stationsOnMap.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-bg-soft border border-border-strong shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-accent-400 mb-1">
              {isEdit ? 'Chỉnh sửa' : 'Tạo mới'}
            </p>
            <h2 className="text-base font-semibold text-text">
              {isEdit ? 'Sửa trạm' : (isFull ? 'Thêm trạm phát' : 'Tạo trạm mới')}
            </h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text text-2xl leading-none w-8 h-8 flex items-center justify-center hover:bg-border" aria-label="Đóng">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* ===== Mode full + create: chọn map trước ===== */}
          {isFull && !isEdit && !mapId && (
            <div>
              <label className="label">Bản đồ <span className="text-red-600 normal-case">*</span></label>
              {hasMapOptions ? (
                <select
                  value={pickedMapId}
                  onChange={(e) => { setPickedMapId(e.target.value); setPickedStationId('') }}
                  className="input"
                  required
                >
                  <option value="">-- Chọn bản đồ --</option>
                  {mapsList.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-amber-500/15 border border-amber-500/40 text-amber-700 text-sm">
                  Chưa có bản đồ nào. Hãy tạo bản đồ trước ở module Bản đồ.
                </div>
              )}
            </div>
          )}

          {/* ===== Mode full + create: chọn station đã vẽ ===== */}
          {isFull && !isEdit && pickedMapId && (
            <div>
              <label className="label">Trạm đã vẽ trên bản đồ <span className="text-red-600 normal-case">*</span></label>
              {loadingStations ? (
                <div className="px-3 py-2 text-xs text-text-soft">Đang tải danh sách…</div>
              ) : hasStationOptions ? (
                <>
                  <select
                    value={pickedStationId}
                    onChange={(e) => handlePickStation(e.target.value)}
                    className="input"
                    required
                  >
                    <option value="">-- Chọn trạm đã vẽ --</option>
                    {stationsOnMap.map((s) => (
                      <option key={s.id} value={s.id}>
                        #{s.id} · {s.name} ({Math.round(s.coordX)}, {Math.round(s.coordY)})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-text-soft mt-1.5">
                    Chọn 1 dot đã đặt ở Map Editor. Tên và tọa độ sẽ tự điền — bạn chỉ cần nhập MAC.
                  </p>
                </>
              ) : (
                <div className="px-3 py-2 bg-amber-500/15 border border-amber-500/40 text-amber-700 text-sm">
                  Bản đồ này chưa có trạm nào. Hãy vào Map Editor để vẽ dot trước.
                </div>
              )}
            </div>
          )}

          {/* ===== Mode full + edit: hiển thị map + tọa độ readonly ===== */}
          {isFull && isEdit && (
            <>
              <div>
                <label className="label">Bản đồ</label>
                <input type="text" value={station.mapName || ''} readOnly
                  className="input bg-bg-raised text-text-soft cursor-not-allowed" />
              </div>
            </>
          )}

          {/* ===== Tên + tọa độ ===== */}
          <div>
            <label className="label">Tên trạm <span className="text-red-600 normal-case">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100}
              placeholder="VD: Cửa Số 1, Phòng IT..." className="input" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Tọa độ X</label>
              <input
                type="text"
                value={isFull
                  ? pickedCoordX
                  : (isEdit ? Math.round(station.coordX) : pickedCoordX)}
                readOnly={!isFull}
                onChange={(e) => setPickedCoordX(e.target.value)}
                className={`input font-mono ${!isFull ? 'bg-bg-raised text-text-soft cursor-not-allowed' : ''}`}
                placeholder="0"
              />
            </div>
            <div>
              <label className="label">Tọa độ Y</label>
              <input
                type="text"
                value={isFull
                  ? pickedCoordY
                  : (isEdit ? Math.round(station.coordY) : pickedCoordY)}
                readOnly={!isFull}
                onChange={(e) => setPickedCoordY(e.target.value)}
                className={`input font-mono ${!isFull ? 'bg-bg-raised text-text-soft cursor-not-allowed' : ''}`}
                placeholder="0"
              />
            </div>
          </div>
          {!isFull && (
            <p className="text-xs text-text-soft -mt-3">
              Tọa độ lấy từ vị trí click trên bản đồ (Map Editor).
            </p>
          )}

          {/* ===== Mode full: MAC + status ===== */}
          {isFull && (
            <>
              <div>
                <label className="label">MAC Address <span className="text-red-600 normal-case">*</span></label>
                <input type="text" value={macAddress} onChange={(e) => setMacAddress(e.target.value)} maxLength={50}
                  placeholder="AA:BB:CC:DD:EE:FF" className="input font-mono" />
                <p className="text-xs text-text-soft mt-1.5">
                  Định dạng: 6 cặp hex phân cách bởi <code className="bg-bg-raised px-1 py-0.5 font-mono">:</code> hoặc <code className="bg-bg-raised px-1 py-0.5 font-mono">-</code>
                </p>
              </div>
              <div>
                <label className="label">Trạng thái</label>
                <select value={status} onChange={(e) => setStatus(e.target.value)} className="input">
                  <option value="ACTIVE">{STATUS_LABELS.ACTIVE}</option>
                  <option value="MAINTENANCE">{STATUS_LABELS.MAINTENANCE}</option>
                  <option value="LOST">{STATUS_LABELS.LOST}</option>
                </select>
              </div>
            </>
          )}

          {error && (
            <div className="px-3 py-2.5 bg-danger-soft/15 border border-danger text-red-600 text-sm">{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <button type="button" onClick={onClose} disabled={submitting} className="btn-secondary">Hủy</button>
            <button
              type="submit"
              disabled={submitting || (isFull && !isEdit && !hasStationOptions)}
              className="btn-primary"
            >
              {submitting && <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />}
              {isEdit ? 'Cập nhật' : (isFull ? 'Thêm trạm phát' : 'Tạo trạm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}