import { useEffect, useState } from 'react'
import { stationApi } from '../api/stationApi'
import { mapApi } from '../api/mapApi'

const STATUS_LABELS = {
  ACTIVE: 'Hoạt động',
  MAINTENANCE: 'Bảo trì',
  LOST: 'Mất tín hiệu',
}

/**
 * Modal tạo/sửa trạm. Hỗ trợ 2 flow:
 *   - Từ Map Editor: truyền mapId/coordX/coordY sẵn (click-to-add).
 *   - Từ Stations list: truyền station để sửa hoặc không có gì (modal tự load danh sách map để chọn).
 */
export default function StationModal({
  open, onClose, onSuccess,
  mapId,         // bắt buộc nếu tạo từ editor và không truyền station
  station,       // có nếu sửa
  coordX,        // tùy chọn
  coordY,        // tùy chọn
}) {
  const isEdit = !!station
  const [maps, setMaps] = useState([])
  const [name, setName] = useState('')
  const [macAddress, setMacAddress] = useState('')
  const [pickedMapId, setPickedMapId] = useState('')
  const [pickedCoordX, setPickedCoordX] = useState('')
  const [pickedCoordY, setPickedCoordY] = useState('')
  const [status, setStatus] = useState('ACTIVE')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Load danh sách bản đồ khi mở ở chế độ "tạo" mà chưa có mapId
  useEffect(() => {
    if (!open || isEdit || mapId) return
    let alive = true
    mapApi.getAll()
      .then((data) => { if (alive) setMaps(data || []) })
      .catch(() => { if (alive) setMaps([]) })
    return () => { alive = false }
  }, [open, isEdit, mapId])

  // Đồng bộ form state khi mở / đổi station
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
    } else {
      setName(''); setMacAddress('')
      setPickedMapId(mapId ? String(mapId) : '')
      setPickedCoordX(coordX != null ? String(Math.round(coordX)) : '')
      setPickedCoordY(coordY != null ? String(Math.round(coordY)) : '')
      setStatus('ACTIVE'); setNotes('')
    }
    setError('')
  }, [open, isEdit, station, mapId, coordX, coordY])
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape' && open && !submitting) onClose?.() }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, submitting, onClose])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!name.trim()) return setError('Vui lòng nhập tên trạm')
    if (!macAddress.trim()) return setError('Vui lòng nhập MAC address')

    const finalMapId = isEdit
      ? station.mapId
      : (mapId ?? (pickedMapId ? Number(pickedMapId) : null))
    if (!finalMapId) return setError('Vui lòng chọn bản đồ')

    const finalX = isEdit
      ? station.coordX
      : (coordX ?? Number(pickedCoordX))
    const finalY = isEdit
      ? station.coordY
      : (coordY ?? Number(pickedCoordY))
    if (finalX == null || Number.isNaN(finalX)) return setError('Vui lòng nhập tọa độ X')
    if (finalY == null || Number.isNaN(finalY)) return setError('Vui lòng nhập tọa độ Y')

    setSubmitting(true)
    try {
      const payload = {
        mapId: finalMapId,
        name: name.trim(),
        macAddress: macAddress.trim().toUpperCase(),
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

  // Đã chọn map sẵn (từ editor) → ẩn dropdown
  const hideMapPicker = !!mapId && !isEdit
  const hideCoordPicker = (coordX != null && coordY != null) && !isEdit
  const hasMapOptions = maps.length > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="bg-ink-900 border border-ink-700 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-ink-800">
          <div>
            <p className="text-[10px] font-semibold tracking-widest uppercase text-accent-400 mb-1">
              {isEdit ? 'Chỉnh sửa' : 'Tạo mới'}
            </p>
            <h2 className="text-base font-semibold text-white">
              {isEdit ? 'Sửa trạm' : 'Tạo trạm mới'}
            </h2>
          </div>
          <button onClick={onClose} className="text-ink-400 hover:text-white text-2xl leading-none w-8 h-8 flex items-center justify-center hover:bg-ink-800" aria-label="Đóng">×</button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Map picker (chỉ hiện khi tạo từ list, không có mapId truyền sẵn) */}
          {!hideMapPicker && (
            <div>
              <label className="label">Bản đồ <span className="text-red-400 normal-case">*</span></label>
              {isEdit ? (
                <input
                  type="text"
                  value={station.mapName || ''}
                  readOnly
                  className="input bg-ink-850 text-ink-300 cursor-not-allowed"
                />
              ) : hasMapOptions ? (
                <select
                  value={pickedMapId}
                  onChange={(e) => setPickedMapId(e.target.value)}
                  className="input"
                  required
                >
                  <option value="">-- Chọn bản đồ --</option>
                  {maps.map((m) => (
                    <option key={m.id} value={m.id}>{m.name}</option>
                  ))}
                </select>
              ) : (
                <div className="px-3 py-2 bg-amber-900/30 border border-amber-700 text-amber-200 text-sm">
                  Chưa có bản đồ nào. Hãy tạo bản đồ trước ở module Bản đồ.
                </div>
              )}
            </div>
          )}

          {/* Tọa độ (nếu đã có sẵn, hiển thị read-only; nếu tạo từ list, cho nhập) */}
          {!hideCoordPicker && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Tọa độ X <span className="text-red-400 normal-case">*</span></label>
                <input
                  type="number"
                  value={isEdit ? Math.round(station.coordX) : pickedCoordX}
                  onChange={(e) => setPickedCoordX(e.target.value)}
                  readOnly={isEdit}
                  className={`input font-mono ${isEdit ? 'bg-ink-850 text-ink-300 cursor-not-allowed' : ''}`}
                  placeholder="0"
                  step="1"
                />
              </div>
              <div>
                <label className="label">Tọa độ Y <span className="text-red-400 normal-case">*</span></label>
                <input
                  type="number"
                  value={isEdit ? Math.round(station.coordY) : pickedCoordY}
                  onChange={(e) => setPickedCoordY(e.target.value)}
                  readOnly={isEdit}
                  className={`input font-mono ${isEdit ? 'bg-ink-850 text-ink-300 cursor-not-allowed' : ''}`}
                  placeholder="0"
                  step="1"
                />
              </div>
            </div>
          )}

          <div>
            <label className="label">Tên trạm <span className="text-red-400 normal-case">*</span></label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={100}
              placeholder="VD: Phòng IT, Cửa số 1, Thư viện..." className="input" />
          </div>

          <div>
            <label className="label">MAC Address <span className="text-red-400 normal-case">*</span></label>
            <input type="text" value={macAddress} onChange={(e) => setMacAddress(e.target.value)} maxLength={50}
              placeholder="AA:BB:CC:DD:EE:FF" className="input font-mono" />
            <p className="text-xs text-ink-400 mt-1.5">
              Định dạng: 6 cặp hex phân cách bởi <code className="bg-ink-800 px-1 py-0.5 font-mono">:</code> hoặc <code className="bg-ink-800 px-1 py-0.5 font-mono">-</code>
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

          <div>
            <label className="label">Ghi chú</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} maxLength={500} rows={2}
              placeholder="Ghi chú về vị trí lắp đặt..." className="input resize-none" />
          </div>

          {error && (
            <div className="px-3 py-2.5 bg-danger-soft/40 border border-danger text-red-300 text-sm">{error}</div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t border-ink-800">
            <button type="button" onClick={onClose} disabled={submitting} className="btn-secondary">Hủy</button>
            <button type="submit" disabled={submitting || (!isEdit && !hasMapOptions && !mapId)} className="btn-primary">
              {submitting && <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white animate-spin" />}
              {isEdit ? 'Cập nhật' : 'Tạo trạm'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
