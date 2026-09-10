import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../../api/client.js'
import { hasModuleAccess } from '../../data/roles.js'
import { useAuth } from '../../hooks/useAuth.js'
import { Icon } from './Icon.jsx'

const SEARCHABLE = [
  {
    apiPath: '/api/documents',
    listKey: 'documents',
    moduleKey: 'documents',
    path: '/documents',
    label: 'Documents',
    getLabel: (r) => r.title,
  },
  {
    apiPath: '/api/personnel',
    listKey: 'personnel',
    moduleKey: 'personnel',
    path: '/personnel',
    label: 'Personnel',
    getLabel: (r) => r.name,
  },
  {
    apiPath: '/api/ministries',
    listKey: 'ministries',
    moduleKey: 'ministry',
    path: '/ministry',
    label: 'Ministry',
    getLabel: (r) => r.name,
  },
  {
    apiPath: '/api/events',
    listKey: 'events',
    moduleKey: 'events',
    path: '/events',
    label: 'Events',
    getLabel: (r) => r.title,
  },
]

/**
 * A real cross-module search — not a decorative input. Queries each module's live API
 * (respecting the same RBAC matrix as everywhere else, so a search never surfaces a record
 * the signed-in role couldn't otherwise see — the client-side filter here is a courtesy that
 * avoids doomed requests; the server enforces the same matrix independently either way).
 * Results link to that module's list — there's no per-record detail route yet, so a result
 * opens the module page rather than a specific record, honest given what exists today.
 */
export default function GlobalSearch() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [results, setResults] = useState([])
  const [isSearching, setIsSearching] = useState(false)
  const containerRef = useRef(null)
  const debounceRef = useRef(null)

  useEffect(() => {
    function markSearching() {
      setIsSearching(Boolean(query.trim()))
    }
    markSearching()
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      const normalized = query.trim().toLowerCase()
      if (!normalized) {
        setResults([])
        setIsSearching(false)
        return
      }
      const accessible = SEARCHABLE.filter((s) => hasModuleAccess(user.role, s.moduleKey))
      try {
        const grouped = await Promise.all(
          accessible.map(async (source) => {
            const body = await api.get(source.apiPath)
            const records = body[source.listKey] ?? []
            const matches = records
              .filter((r) => source.getLabel(r)?.toLowerCase().includes(normalized))
              .slice(0, 4)
              .map((r) => ({ id: r.localId, label: source.getLabel(r), source }))
            return matches
          }),
        )
        setResults(grouped.flat())
      } catch {
        setResults([])
      }
      setIsSearching(false)
    }, 200)
    return () => clearTimeout(debounceRef.current)
  }, [query, user.role])

  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false)
      }
    }
    function handleEscape(e) {
      if (e.key === 'Escape') setIsOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [])

  function goTo(path) {
    setIsOpen(false)
    setQuery('')
    navigate(path)
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-sm">
      <div className="relative">
        <Icon
          name="search"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
        />
        <input
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          placeholder="Search people, documents, ministries…"
          aria-label="Search across the system"
          className="w-full rounded-lg border border-ink-200 bg-ink-50/60 py-2 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-400 focus:border-brass-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brass-400"
        />
      </div>

      {isOpen && query.trim() && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-96 overflow-y-auto rounded-xl border border-ink-100 bg-white shadow-xl">
          {isSearching ? (
            <p className="px-4 py-6 text-center text-sm text-ink-400">Searching…</p>
          ) : results.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-400">
              No results for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <ul className="py-2">
              {results.map((result) => (
                <li key={`${result.source.store}-${result.id}`}>
                  <button
                    type="button"
                    onClick={() => goTo(result.source.path)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-ink-50"
                  >
                    <Icon
                      name={result.source.moduleKey}
                      className="h-4 w-4 flex-none text-ink-400"
                    />
                    <span className="min-w-0 flex-1 truncate text-ink-800">{result.label}</span>
                    <span className="flex-none text-xs text-ink-400">{result.source.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
