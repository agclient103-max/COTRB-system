import { useAuth } from '../../hooks/useAuth.js'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'
import { ROLE_LABELS } from '../../data/roles.js'
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

function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
        isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
      ].join(' ')}
    >
      <span
        className={['h-1.5 w-1.5 rounded-full', isOnline ? 'bg-emerald-500' : 'bg-amber-500'].join(
          ' ',
        )}
      />
      {isOnline ? 'Online' : 'Offline'}
    </span>
  )
}

export default function Header({ onOpenSidebar }) {
  const { user, logout } = useAuth()

  return (
    <header className="flex h-16 flex-none items-center gap-3 border-b border-ink-100 bg-white px-4 sm:px-6">
      <button
        type="button"
        onClick={onOpenSidebar}
        aria-label="Open navigation"
        className="rounded-md p-1.5 text-ink-500 hover:bg-ink-50 hover:text-ink-900 lg:hidden"
      >
        <Icon name="menu" className="h-5 w-5" />
      </button>

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-ink-900 sm:hidden">COTRB</p>
      </div>

      <OfflineIndicator />

      <div className="hidden items-center gap-2 sm:flex">
        <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-ink-800 text-xs font-semibold text-white">
          {initialsOf(user.name)}
        </span>
        <span className="min-w-0">
          <span className="block max-w-[10rem] truncate text-sm font-medium text-ink-900">
            {user.name}
          </span>
          <span className="block truncate text-xs text-ink-500">{ROLE_LABELS[user.role]}</span>
        </span>
      </div>

      <button
        type="button"
        onClick={logout}
        className="flex-none rounded-lg border border-ink-100 px-3 py-1.5 text-sm font-medium text-ink-600 transition hover:border-ink-200 hover:bg-ink-50"
      >
        Sign out
      </button>
    </header>
  )
}
