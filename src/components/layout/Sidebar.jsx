import { useEffect, useRef, useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { hasModuleAccess, ROLE_LABELS } from '../../data/roles.js'
import { NAV_GROUPS } from '../../data/navigation.js'
import { Icon } from './Icon.jsx'

function initialsOf(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function NavItem({ to, icon, label, onNavigate, indent = false }) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        [
          'flex items-center gap-3 rounded-lg py-2.5 text-sm font-medium transition',
          indent ? 'pl-11 pr-3' : 'px-3',
          isActive ? 'bg-ink-800 text-white' : 'text-ink-200 hover:bg-ink-800/60 hover:text-white',
        ].join(' ')
      }
    >
      {!indent && <Icon name={icon} className="h-5 w-5 flex-none" />}
      <span className="truncate">{label}</span>
    </NavLink>
  )
}

function NavGroup({ group, onNavigate, defaultOpen = true }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-expanded={isOpen}
        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-200 transition hover:bg-ink-800/60 hover:text-white"
      >
        <Icon name={group.icon} className="h-5 w-5 flex-none" />
        <span className="flex-1 truncate text-left">{group.label}</span>
        <Icon
          name={isOpen ? 'chevron-down' : 'chevron-right'}
          className="h-4 w-4 flex-none text-ink-400"
        />
      </button>
      {isOpen && (
        <div className="mt-0.5 space-y-0.5">
          {group.items.map((item) => (
            <NavItem
              key={item.key}
              to={item.path}
              icon={item.icon}
              label={item.label}
              onNavigate={onNavigate}
              indent
            />
          ))}
        </div>
      )}
    </div>
  )
}

function UserFooter() {
  const { user, logout } = useAuth()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative border-t border-ink-800 pt-3">
      {isMenuOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 rounded-lg border border-ink-700 bg-ink-800 p-1.5 shadow-xl">
          <button
            type="button"
            onClick={logout}
            className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-ink-100 hover:bg-ink-700"
          >
            <Icon name="logout" className="h-4 w-4 flex-none" />
            Sign out
          </button>
        </div>
      )}
      <button
        type="button"
        onClick={() => setIsMenuOpen((v) => !v)}
        className="flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left transition hover:bg-ink-800/60"
      >
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full bg-brass-500 text-xs font-semibold text-white">
          {initialsOf(user.name)}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium text-white">{user.name}</span>
          <span className="block truncate text-xs text-ink-400">{ROLE_LABELS[user.role]}</span>
        </span>
        <Icon name="chevron-down" className="h-4 w-4 flex-none text-ink-400" />
      </button>
    </div>
  )
}

export default function Sidebar({ isOpen, onClose }) {
  const { user } = useAuth()

  const visibleEntries = NAV_GROUPS.map((entry) => {
    if (entry.type === 'item') {
      return hasModuleAccess(user.role, entry.key) ? entry : null
    }
    const items = entry.items.filter((item) => hasModuleAccess(user.role, item.key))
    return items.length > 0 ? { ...entry, items } : null
  }).filter(Boolean)

  return (
    <>
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
          'fixed inset-y-0 left-0 z-40 flex w-72 flex-none flex-col bg-ink-900 px-3 py-4 transition-transform duration-200 lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
        ].join(' ')}
      >
        <div className="mb-5 flex items-center gap-3 px-2">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-brass-500 text-white">
            <Icon name="church" className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate font-display text-lg font-semibold leading-tight text-white">
              COTRB
            </p>
            <p className="truncate text-[11px] leading-tight text-ink-400">
              Church of the Resurrection Bugolobi
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
          {visibleEntries.map((entry) =>
            entry.type === 'group' ? (
              <NavGroup key={entry.key} group={entry} onNavigate={onClose} />
            ) : (
              <NavItem
                key={entry.key}
                to={entry.path}
                icon={entry.icon}
                label={entry.label}
                onNavigate={onClose}
              />
            ),
          )}
        </nav>

        <div className="mt-2 border-t border-ink-800 pt-2">
          <NavLink
            to="/ui-kit"
            onClick={onClose}
            className={({ isActive }) =>
              [
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-medium uppercase tracking-wide transition',
                isActive
                  ? 'bg-ink-800 text-brass-300'
                  : 'text-ink-500 hover:bg-ink-800/60 hover:text-brass-300',
              ].join(' ')
            }
          >
            UI Kit (dev preview)
          </NavLink>
        </div>

        <UserFooter />
      </aside>
    </>
  )
}
