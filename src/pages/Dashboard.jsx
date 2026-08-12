import { useAuth } from '../hooks/useAuth.js'
import { ROLE_LABELS } from '../data/roles.js'

export default function Dashboard() {
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 py-16">
      <div className="w-full max-w-xl rounded-2xl border border-ink-100 bg-white p-10 shadow-[0_1px_2px_rgba(20,29,43,0.04),0_12px_32px_-16px_rgba(20,29,43,0.18)]">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brass-600">
          Phase 1 — Auth Shell
        </p>
        <h1 className="font-display text-3xl font-semibold text-ink-900">
          Signed in as {user.name}
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          Role: <span className="font-medium text-ink-700">{ROLE_LABELS[user.role]}</span>
          {user.ministry && (
            <>
              {' '}
              · Ministry: <span className="font-medium text-ink-700">{user.ministry}</span>
            </>
          )}
        </p>

        <div className="mt-8 rounded-lg bg-ink-50 px-4 py-3 text-xs text-ink-500">
          This placeholder confirms the protected route and session are working. Phase 2 replaces it
          with the real header, sidebar, and role-aware navigation to all seven modules.
        </div>

        <button
          type="button"
          onClick={logout}
          className="mt-6 rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-700"
        >
          Sign out
        </button>
      </div>
    </div>
  )
}
