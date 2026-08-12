import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { hasModuleAccess } from '../../data/roles.js'
import { NAV_ITEMS } from '../../data/navigation.js'
import { Icon } from './Icon.jsx'

function NavItem({ to, icon, label, onNavigate }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition',
          isActive ? 'bg-ink-800 text-white' : 'text-ink-200 hover:bg-ink-800/60 hover:text-white',
        ].join(' ')
      }
    >
      <Icon name={icon} className="h-5 w-5 flex-none" />
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()
  const visibleItems = NAV_ITEMS.filter((item) => hasModuleAccess(user.role, item.key))

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <button
          type="button"
          aria-label="Dismiss navigation overlay"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-ink-950/40 lg:hidden"
        />
      )}

      <aside
        className={[
          'fixed inset-y-0 left-0 z-40 flex w-64 flex-none flex-col bg-ink-900 px-3 py-4 transition-transform duration-200 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="mb-4 flex items-center justify-between px-2">
          <div className="min-w-0">
            <p className="truncate font-display text-lg font-semibold text-white">COTRB</p>
            <p className="truncate text-[11px] uppercase tracking-wide text-ink-400">
              Church Management
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close navigation"
            className="rounded-md p-1.5 text-ink-300 hover:bg-ink-800 hover:text-white lg:hidden"
          >
            <Icon name="close" className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 space-y-1 overflow-y-auto">
          <NavItem to="/" icon="dashboard" label="Dashboard" onNavigate={onClose} />
          {visibleItems.map((item) => (
            <NavItem
              key={item.key}
              to={item.path}
              icon={item.key}
              label={item.label}
              onNavigate={onClose}
            />
          ))}
        </nav>
      </aside>
    </>
  )
}
