import { useEffect, useRef, useState } from 'react'
import { api } from '../../api/client.js'
import { Icon } from './Icon.jsx'

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

/**
 * Backed by the real server-side audit log — not a mock notification feed. The badge dot
 * reflects actions logged in the last 24 hours, computed once when the log is fetched (not
 * derived from Date.now() during render, which React treats as impure).
 */
export default function NotificationsDropdown() {
  const [isOpen, setIsOpen] = useState(false)
  const [entries, setEntries] = useState([])
  const [recentCount, setRecentCount] = useState(0)
  const containerRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const body = await api.get('/api/audit-log?limit=8')
        if (cancelled) return
        const log = body.entries
        const cutoff = Date.now() - TWENTY_FOUR_HOURS_MS
        setEntries(log)
        setRecentCount(log.filter((e) => new Date(e.timestamp).getTime() > cutoff).length)
      } catch {
        if (!cancelled) {
          setEntries([])
          setRecentCount(0)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Notifications"
        className="relative rounded-md p-2 text-ink-500 hover:bg-ink-50 hover:text-ink-900"
      >
        <Icon name="bell" className="h-5 w-5" />
        {recentCount > 0 && (
          <span className="absolute right-1 top-1 flex h-2 w-2 rounded-full bg-brass-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[90vw] rounded-xl border border-ink-100 bg-white shadow-xl">
          <div className="border-b border-ink-100 px-4 py-3">
            <p className="text-sm font-semibold text-ink-900">Recent activity</p>
          </div>
          <div className="max-h-80 overflow-y-auto">
            {entries.length === 0 ? (
              <p className="px-4 py-6 text-center text-sm text-ink-400">No activity yet.</p>
            ) : (
              <ul className="divide-y divide-ink-50">
                {entries.map((entry) => (
                  <li key={entry.id} className="px-4 py-3 text-sm">
                    <p className="text-ink-800">
                      <span className="font-medium">{entry.user_name}</span>{' '}
                      <span className="text-ink-500">{entry.action}</span>{' '}
                      <span className="text-ink-700">{entry.record_label}</span>
                    </p>
                    <p className="mt-0.5 text-xs text-ink-400">
                      {entry.module_label} · {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
