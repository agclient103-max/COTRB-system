import { useAuth } from '../hooks/useAuth.js'
import { ROLE_LABELS } from '../data/roles.js'

export default function Dashboard() {
  const { user } = useAuth()

  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brass-600">
          Phase 2 — Layout & Navigation
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">
          Welcome, {user.name}
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

        <div className="mt-8 rounded-xl border border-ink-100 bg-white px-6 py-6">
          <p className="text-sm text-ink-500">
            The sidebar on the left shows only the modules your role has access to, per the §6.2
            access matrix. Try signing in as different roles to see it change — a Member or Guest
            account, for example, sees a much shorter list than an Admin or Clergy account.
          </p>
        </div>

        <div className="mt-4 rounded-xl border border-dashed border-ink-200 bg-white px-6 py-6">
          <p className="text-sm text-ink-400">
            Role-aware summary widgets (membership, attendance, giving snapshot, upcoming events)
            arrive in Phase 4.
          </p>
        </div>
      </div>
    </div>
  )
}
