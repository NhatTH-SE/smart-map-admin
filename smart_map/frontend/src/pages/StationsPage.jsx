import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { stationApi } from '../api/stationApi'
import { mapApi } from '../api/mapApi'
import StationModal from '../components/StationModal'
import ConfirmModal from '../components/ConfirmModal'

const STATUS_LABELS = {
  ACTIVE: 'Hoạt động',
  MAINTENANCE: 'Bảo trì',
  LOST: 'Mất tín hiệu',
}

const STATUS_BADGE = {
  ACTIVE: 'badge-active',
  MAINTENANCE: 'badge-maint',
  LOST: 'badge-lost',
}

const STATUSES = ['ALL', 'ACTIVE', 'MAINTENANCE', 'LOST']

export default function StationsPage() {
  const navigate = useNavigate()
  const [stations, setStations] = useState([])
  const [maps, setMaps] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [mapFilter, setMapFilter] = useState('ALL')
  const [stats, setStats] = useState({ ACTIVE: 0, MAINTENANCE: 0, LOST: 0 })

  const [creating, setCreating] = useState(false)
  const [editing, setEditing] = useState(null)
  const [deleting, setDeleting] = useState(null)

  // ----- Load data ---------------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [list, mp, st] = await Promise.all([
        stationApi.getAll(),
        mapApi.getAll(),
        stationApi.getStats().catch(() => ({})),
      ])
      setStations(list || [])
      setMaps(mp || [])
      setStats(st || { ACTIVE: 0, MAINTENANCE: 0, LOST: 0 })
    } catch (err) {
      toast.error(err.message || 'Không tải được danh sách trạm')
    } finally {
      setLoading(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { load() }, [load])

  // ----- Filtering ---------------------------------------------------------
  const mapOptions = useMemo(() => {
    const ids = new Set()
    maps.forEach((m) => ids.add(m.id))
    return [{ id: 'ALL', name: 'Tất cả bản đồ' }, ...maps]
  }, [maps])

  const filteredStations = useMemo(() => {
    return stations.filter((s) => {
      if (statusFilter !== 'ALL' && s.status !== statusFilter) return false
      if (mapFilter !== 'ALL' && String(s.mapId) !== String(mapFilter)) return false
      if (search.trim()) {
        const q = search.trim().toLowerCase()
        return (
          (s.name || '').toLowerCase().includes(q) ||
          (s.macAddress || '').toLowerCase().includes(q) ||
          (s.mapName || '').toLowerCase().includes(q)
        )
      }
      return true
    })
  }, [stations, search, statusFilter, mapFilter])

  // ----- Handlers ----------------------------------------------------------
  const openCreate = () => setCreating(true)

  const handleDelete = async () => {
    const st = deleting
    try {
      await stationApi.remove(st.id)
      setStations((prev) => prev.filter((x) => x.id !== st.id))
      setStats((s) => ({ ...s, [st.status]: Math.max(0, (s[st.status] || 1) - 1) }))
      toast.success(`Đã xóa trạm "${st.name}"`)
    } catch (err) {
      toast.error('Xóa thất bại: ' + err.message)
      throw err
    }
  }

  const handleQuickStatus = async (st, nextStatus) => {
    if (st.status === nextStatus) return
    const prevStatus = st.status
    setStations((prev) => prev.map((x) => x.id === st.id ? { ...x, status: nextStatus } : x))
    setStats((s) => ({
      ...s,
      [prevStatus]: Math.max(0, (s[prevStatus] || 1) - 1),
      [nextStatus]: (s[nextStatus] || 0) + 1,
    }))
    try {
      await stationApi.updateStatus(st.id, nextStatus)
      toast.success(`Đã đổi "${st.name}" → ${STATUS_LABELS[nextStatus]}`)
    } catch (err) {
      setStations((prev) => prev.map((x) => x.id === st.id ? { ...x, status: prevStatus } : x))
      setStats((s) => ({
        ...s,
        [nextStatus]: Math.max(0, (s[nextStatus] || 1) - 1),
        [prevStatus]: (s[prevStatus] || 0) + 1,
      }))
      toast.error('Đổi trạng thái thất bại: ' + err.message)
    }
  }

  const handleCreatedOrUpdated = async () => {
    await load()
    toast.success('Đã cập nhật danh sách')
  }

  // ----- Render ------------------------------------------------------------
  return (
    <div className="p-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 pb-5 border-b border-ink-800">
        <div>
          <p className="text-[11px] font-semibold tracking-widest uppercase text-accent-400 mb-1">Module 02</p>
          <h1 className="text-2xl font-semibold text-white tracking-tight">Quản lý Trạm phát</h1>
          <p className="text-sm text-ink-400 mt-1.5">
            Danh sách các trạm phát BLE/iTag đã gắn trên các bản đồ.
          </p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14 M5 12h14" />
          </svg>
          Thêm trạm
        </button>
      </div>

      {/* Stat row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-ink-800 border border-ink-800 mb-6">
        <StatTile label="Tổng trạm" value={stations.length} accent="text-white" />
        {Object.entries(STATUS_LABELS).map(([k, label]) => (
          <StatTile
            key={k}
            label={label}
            value={stats[k] || 0}
            accent={
              k === 'ACTIVE' ? 'text-emerald-300'
                : k === 'MAINTENANCE' ? 'text-amber-300'
                : 'text-red-300'
            }
          />
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm theo tên trạm, MAC hoặc tên bản đồ…"
            className="input"
          />
        </div>
        <select value={mapFilter} onChange={(e) => setMapFilter(e.target.value)} className="input md:w-60">
          {mapOptions.map((m) => (
            <option key={m.id} value={m.id}>{m.name}</option>
          ))}
        </select>
      </div>

      {/* Status segmented control */}
      <div className="flex items-center gap-1 border border-ink-800 mb-4 w-fit">
        {STATUSES.map((s) => {
          const active = statusFilter === s
          const label = s === 'ALL' ? 'Tất cả' : STATUS_LABELS[s]
          const count = s === 'ALL' ? stations.length : (stats[s] || 0)
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={
                'px-3 py-1.5 text-xs font-medium tracking-wider uppercase transition-colors ' +
                (active
                  ? 'bg-accent-600 text-white'
                  : 'text-ink-300 hover:bg-ink-800 hover:text-white')
              }
            >
              {label} <span className="ml-1 font-mono text-[10px] opacity-70">{count}</span>
            </button>
          )
        })}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-ink-400">
          <span className="inline-block w-5 h-5 border-2 border-ink-700 border-t-accent-500 animate-spin mr-3" />
          Đang tải...
        </div>
      ) : filteredStations.length === 0 ? (
        <div className="bg-ink-900 border border-dashed border-ink-700 py-16 text-center">
          <p className="text-white font-medium">
            {stations.length === 0 ? 'Chưa có trạm nào trong hệ thống' : 'Không có trạm nào khớp bộ lọc'}
          </p>
          <p className="text-ink-400 text-sm mt-1 mb-4">
            {stations.length === 0
              ? 'Tạo trạm trực tiếp ở đây hoặc vào Editor của một bản đồ.'
              : 'Thử điều chỉnh từ khóa hoặc bộ lọc.'}
          </p>
          {stations.length === 0 && (
            <button onClick={openCreate} className="btn-primary">Tạo trạm đầu tiên</button>
          )}
        </div>
      ) : (
        <div className="bg-ink-900 border border-ink-800 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-ink-850 border-b border-ink-800">
              <tr className="text-left">
                <Th className="w-16">#</Th>
                <Th>Tên trạm</Th>
                <Th className="hidden md:table-cell">Bản đồ</Th>
                <Th>MAC Address</Th>
                <Th className="hidden lg:table-cell">Tọa độ</Th>
                <Th>Trạng thái</Th>
                <Th className="w-40 text-right">Hành động</Th>
              </tr>
            </thead>
            <tbody>
              {filteredStations.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-ink-800 last:border-b-0 hover:bg-ink-850 transition-colors"
                >
                  <Td className="font-mono text-ink-400">{s.id}</Td>
                  <Td>
                    <button
                      onClick={() => navigate(`/admin/maps/${s.mapId}/edit`)}
                      className="text-white font-medium hover:text-accent-300 transition-colors text-left"
                    >
                      {s.name}
                    </button>
                    {s.notes && (
                      <div className="text-xs text-ink-400 mt-0.5 line-clamp-1">{s.notes}</div>
                    )}
                  </Td>
                  <Td className="hidden md:table-cell text-ink-300">{s.mapName || '—'}</Td>
                  <Td className="font-mono text-xs text-ink-200">{s.macAddress}</Td>
                  <Td className="hidden lg:table-cell font-mono text-xs text-ink-400">
                    ({Math.round(s.coordX)}, {Math.round(s.coordY)})
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <span className={STATUS_BADGE[s.status]}>{STATUS_LABELS[s.status]}</span>
                      <select
                        value={s.status}
                        onChange={(e) => handleQuickStatus(s, e.target.value)}
                        className="hidden md:block bg-ink-850 border border-ink-700 text-[11px] text-ink-200 px-1.5 py-0.5 cursor-pointer focus:outline-none focus:border-accent-500"
                        title="Đổi trạng thái nhanh"
                      >
                        {Object.entries(STATUS_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </div>
                  </Td>
                  <Td>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => setEditing(s)}
                        className="px-3 py-1 text-xs font-medium bg-ink-800 border border-ink-700 text-ink-200 hover:bg-ink-700 hover:text-white transition-colors"
                      >
                        Sửa
                      </button>
                      <button
                        onClick={() => setDeleting(s)}
                        className="px-3 py-1 text-xs font-medium bg-danger-soft/40 border border-danger text-red-300 hover:bg-danger hover:text-white transition-colors"
                      >
                        Xóa
                      </button>
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal: tạo */}
      <StationModal
        open={creating}
        onClose={() => setCreating(false)}
        onSuccess={handleCreatedOrUpdated}
      />

      {/* Modal: sửa */}
      <StationModal
        open={!!editing}
        station={editing}
        onClose={() => setEditing(null)}
        onSuccess={handleCreatedOrUpdated}
      />

      {/* Confirm xóa */}
      <ConfirmModal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Xóa trạm"
        message={`Bạn có chắc muốn xóa trạm "${deleting?.name}"? Hành động không thể hoàn tác.`}
        confirmText="Xóa"
        cancelText="Hủy"
        tone="danger"
      />
    </div>
  )
}

// ----- Sub-components ------------------------------------------------------

function StatTile({ label, value, accent }) {
  return (
    <div className="bg-ink-900 px-5 py-4">
      <p className="text-[10px] font-semibold tracking-widest uppercase text-ink-400 mb-1">{label}</p>
      <p className={`text-2xl font-semibold tabular-nums ${accent || 'text-white'}`}>{value}</p>
    </div>
  )
}

function Th({ children, className = '' }) {
  return (
    <th className={`px-4 py-2.5 text-[10px] font-semibold tracking-widest uppercase text-ink-400 ${className}`}>
      {children}
    </th>
  )
}

function Td({ children, className = '' }) {
  return (
    <td className={`px-4 py-3 text-sm text-ink-200 ${className}`}>{children}</td>
  )
}
