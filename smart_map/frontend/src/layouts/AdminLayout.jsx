import { NavLink, Outlet } from 'react-router-dom'

const navItems = [
  { to: '/admin/maps', label: 'Bản đồ', icon: 'M3 6l9-3 9 3v12l-9 3-9-3V6z M12 3v18', caption: 'Floorplans' },
  { to: '/admin/stations', label: 'Trạm phát', icon: 'M5 8a7 7 0 1114 0v6a7 7 0 11-14 0V8z M8 8v8 M16 8v8', caption: 'Beacons' },
  { to: '/admin/devices', label: 'Thiết bị', icon: 'M3 4h18v12H3z M7 20h10', disabled: true, caption: 'ESP32' },
  { to: '/admin/history', label: 'Lịch sử', icon: 'M3 12h4l3-9 4 18 3-9h4', disabled: true, caption: 'Check-in' },
  { to: '/admin/sos', label: 'SOS', icon: 'M12 2l10 18H2L12 2z M12 9v5 M12 17h.01', disabled: true, caption: 'Realtime' },
]

function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  )
}

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-ink-950 text-ink-200">
      {/* Sidebar */}
      <aside className="w-60 bg-ink-900 border-r border-ink-800 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-ink-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11l9-8 9 8 M5 10v10h14V10" />
              </svg>
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-bold tracking-wider uppercase text-white">Smart Map</h1>
              <p className="text-[10px] text-ink-400 tracking-widest uppercase">Admin Console</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end
              className={({ isActive }) =>
                [
                  'group flex items-center gap-3 px-3 py-2 text-sm transition-colors border-l-2',
                  isActive
                    ? 'bg-accent-900/30 text-white border-l-accent-500'
                    : 'text-ink-300 border-l-transparent hover:bg-ink-800 hover:text-white',
                  item.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
                ].join(' ')
              }
            >
              <Icon d={item.icon} />
              <span className="flex-1 font-medium">{item.label}</span>
              {!item.disabled && (
                <span className="text-[10px] uppercase tracking-wider text-ink-400 group-hover:text-ink-200">
                  {item.caption}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-3 border-t border-ink-800 flex items-center justify-between text-[10px] text-ink-400 uppercase tracking-widest">
          <span>v0.1.0</span>
          <span>Sprint 1</span>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-ink-950">
        <Outlet />
      </main>
    </div>
  )
}
