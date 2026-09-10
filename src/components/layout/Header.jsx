import { useLocation } from 'react-router-dom'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'
import { NAV_ITEMS } from '../../data/navigation.js'
import { Icon } from './Icon.jsx'
import GlobalSearch from './GlobalSearch.jsx'
import NotificationsDropdown from './NotificationsDropdown.jsx'
import HelpPopover from './HelpPopover.jsx'

function OfflineIndicator() {
  const isOnline = useOnlineStatus()
  return (
    <span
      className={[
        'hidden items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium sm:inline-flex',
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

function usePageTitle() {
  const { pathname } = useLocation()
  if (pathname === '/') return 'Dashboard'
  const match = NAV_ITEMS.find((item) => item.path === pathname)
  return match?.label ?? ''
}

export default function Header({ onOpenSidebar }) {
  const pageTitle = usePageTitle()

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

      {pageTitle && (
        <p className="hidden flex-none font-display text-base font-semibold text-ink-900 md:block">
          {pageTitle}
        </p>
      )}

      <div className="flex flex-1 justify-center px-2 sm:px-6">
        <GlobalSearch />
      </div>

      <OfflineIndicator />
      <NotificationsDropdown />
      <HelpPopover />
    </header>
  )
}
