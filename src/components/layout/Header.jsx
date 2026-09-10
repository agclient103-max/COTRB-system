import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useOnlineStatus } from '../../hooks/useOnlineStatus.js'
import { NAV_ITEMS } from '../../data/navigation.js'
import { getSyncSummary, onSyncEvent } from '../../utils/syncEngine.js'
import { Icon } from './Icon.jsx'
import GlobalSearch from './GlobalSearch.jsx'
import NotificationsDropdown from './NotificationsDropdown.jsx'
import HelpPopover from './HelpPopover.jsx'

function SyncStatusIndicator() {
  const isOnline = useOnlineStatus()
  const navigate = useNavigate()
  const [pendingCount, setPendingCount] = useState(0)
  const [conflictCount, setConflictCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    async function refresh() {
      const summary = await getSyncSummary()
      if (!cancelled) {
        setPendingCount(summary.pendingCount)
        setConflictCount(summary.conflicts.length)
      }
    }
    refresh()
    const unsubscribe = onSyncEvent(refresh)
    const interval = setInterval(refresh, 10000)
    return () => {
      cancelled = true
      unsubscribe()
      clearInterval(interval)
    }
  }, [])

  return (
    <div className="hidden items-center gap-2 sm:flex">
      <span
        className={[
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium',
          isOnline ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700',
        ].join(' ')}
      >
        <span
          className={[
            'h-1.5 w-1.5 rounded-full',
            isOnline ? 'bg-emerald-500' : 'bg-amber-500',
          ].join(' ')}
        />
        {isOnline ? 'Online' : 'Offline'}
      </span>

      {conflictCount > 0 && (
        <button
          type="button"
          onClick={() => navigate('/settings')}
          className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700 hover:bg-red-100"
        >
          {conflictCount} need{conflictCount === 1 ? 's' : ''} attention
        </button>
      )}
      {conflictCount === 0 && pendingCount > 0 && (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brass-50 px-2.5 py-1 text-xs font-medium text-brass-700">
          {pendingCount} pending sync
        </span>
      )}
    </div>
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

      <SyncStatusIndicator />
      <NotificationsDropdown />
      <HelpPopover />
    </header>
  )
}
