import { Link } from 'react-router-dom'

const modules = [
  { to: '/admin/maps', code: '01', title: 'Bản đồ', desc: 'Upload & quản lý sơ đồ mặt bằng nhiều tầng/khu vực.', status: 'Sprint 1', enabled: true },
  { to: '/admin/stations', code: '02', title: 'Trạm phát (Beacon)', desc: 'Đặt trạm phát BLE/iTag trên sơ đồ và quản lý trạng thái.', status: 'Sprint 1', enabled: true },
  { code: '03', title: 'Thiết bị ESP32', desc: 'Quản lý thiết bị phát cố định và cấu hình firmware.', status: 'Sprint 2', enabled: false },
  { code: '04', title: 'Lịch sử Check-in', desc: 'Tra cứu lịch sử check-in theo thời gian, bản đồ và thiết bị.', status: 'Sprint 3', enabled: false },
  { code: '05', title: 'SOS Real-time', desc: 'Giám sát cảnh báo khẩn cấp trên bản đồ theo thời gian thực.', status: 'Sprint 3', enabled: false },
  { code: '06', title: 'C++ Code Generator', desc: 'Sinh mã C++ cho ESP32 cấu hình theo bản đồ.', status: 'Sprint 2', enabled: false },
]

export default function DashboardHome() {
  return (
    <div className="p-8 max-w-7xl">
      {/* Page header */}
      <div className="mb-8 pb-5 border-b border-border">
        <p className="text-[11px] font-semibold tracking-widest uppercase text-accent-400 mb-1">Dashboard</p>
        <h1 className="text-2xl font-semibold text-text tracking-tight">Tổng quan hệ thống</h1>
        <p className="text-sm text-text-soft mt-1.5">
          Quản lý bản đồ, trạm phát và thiết bị ESP32 trong hệ thống Smart Map.
        </p>
      </div>

      {/* Modules grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-border border border-border">
        {modules.map((m) => {
          const Inner = (
            <div className={`h-full bg-bg-soft p-6 transition-colors ${m.enabled ? 'hover:bg-bg-raised' : ''}`}>
              <div className="flex items-start justify-between mb-4">
                <span className="font-mono text-xs text-text-soft tracking-widest">{m.code}</span>
                <span className={`text-[10px] font-semibold tracking-widest uppercase ${m.enabled ? 'text-emerald-500' : 'text-text-muted'}`}>
                  {m.status}
                </span>
              </div>
              <h3 className={`text-base font-semibold mb-2 ${m.enabled ? 'text-text' : 'text-text-soft'}`}>
                {m.title}
              </h3>
              <p className="text-sm text-text-soft leading-relaxed">{m.desc}</p>
              {!m.enabled && (
                <div className="mt-4 pt-4 border-t border-border text-[11px] text-text-muted uppercase tracking-widest">
                  Chưa triển khai
                </div>
              )}
            </div>
          )
          return m.enabled ? (
            <Link key={m.code} to={m.to} className="block">{Inner}</Link>
          ) : (
            <div key={m.code} className="opacity-60 cursor-not-allowed">{Inner}</div>
          )
        })}
      </div>
    </div>
  )
}