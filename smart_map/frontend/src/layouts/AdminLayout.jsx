import { NavLink, Outlet } from 'react-router-dom'
import { useTheme } from '../contexts/useTheme'

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

function ThemeToggle() {
  const { isDark, toggle } = useTheme()
  return (
    <button
      onClick={toggle}
      title={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
      aria-label="Toggle theme"
      className="p-1.5 text-text-soft hover:text-text hover:bg-border transition-colors"
    >
      {isDark ? (
        // Sun icon (đang ở dark → click để sang light)
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2 M12 20v2 M4.93 4.93l1.41 1.41 M17.66 17.66l1.41 1.41 M2 12h2 M20 12h2 M4.93 19.07l1.41-1.41 M17.66 6.34l1.41-1.41" />
        </svg>
      ) : (
        // Moon icon (đang ở light → click để sang dark)
        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
        </svg>
      )}
    </button>
  )
}

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-bg text-text-soft">
      {/* Sidebar */}
      <aside className="w-60 bg-bg-soft border-r border-border flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-accent-600 flex items-center justify-center">
              <svg viewBox="0 0 24 24" className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 11l9-8 9 8 M5 10v10h14V10" />
              </svg>
            </div>
            <div className="leading-tight">
              <h1 className="text-sm font-bold tracking-wider uppercase text-text">Smart Map</h1>
              <p className="text-[10px] text-text-muted tracking-widest uppercase">Admin Console</p>
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
                    ? 'bg-accent-900/30 text-text border-l-accent-500'
                    : 'text-text-soft border-l-transparent hover:bg-border hover:text-text',
                  item.disabled ? 'opacity-40 cursor-not-allowed pointer-events-none' : '',
                ].join(' ')
              }
            >
              <Icon d={item.icon} />
              <span className="flex-1 font-medium">{item.label}</span>
              {!item.disabled && (
                <span className="text-[10px] uppercase tracking-wider text-text-muted group-hover:text-text-soft">
                  {item.caption}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="px-5 py-3 border-t border-border flex items-center justify-between text-[10px] text-text-muted uppercase tracking-widest">
          <span>v0.1.0</span>
          <div className="flex items-center gap-3">
            <span>Sprint 1</span>
            <ThemeToggle />
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto bg-bg">
        <Outlet />
      </main>
    </div>
  )
}