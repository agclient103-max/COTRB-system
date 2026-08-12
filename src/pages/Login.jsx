import { useMemo } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import { MOCK_USERS } from '../data/mockUsers.js'
import { ROLE_LABELS } from '../data/roles.js'

function initialsOf(name) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function AccountCard({ account, onSelect }) {
  return (
    <button
      type="button"
      onClick={() => onSelect(account.id)}
      className="flex w-full items-center gap-3 rounded-xl border border-ink-100 bg-white p-4 text-left transition hover:border-brass-300 hover:bg-brass-50/40 hover:shadow-sm"
    >
      <span className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-ink-800 text-sm font-semibold text-white">
        {initialsOf(account.name)}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-ink-900">{account.name}</span>
        <span className="block truncate text-xs text-ink-500">{account.title}</span>
      </span>
      <span className="ml-auto flex-none rounded-full bg-ink-50 px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide text-ink-600">
        {ROLE_LABELS[account.role]}
      </span>
    </button>
  )
}

export default function Login() {
  const { isAuthenticated, authError, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = location.state?.from?.pathname || '/'

  const groups = useMemo(() => {
    const order = ['Leadership', 'Ministry & Staff', 'Congregation', 'System']
    return order
      .map((group) => ({
        group,
        accounts: MOCK_USERS.filter((u) => u.group === group),
      }))
      .filter((g) => g.accounts.length > 0)
  }, [])

  // Guard belt-and-braces: ProtectedRoute keeps authenticated users out of most of the
  // app's other routes, but a signed-in person landing on /login directly (e.g. a bookmark)
  // should bounce straight back in rather than see the account picker again.
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  function handleSelect(userId) {
    const success = login(userId)
    if (success) {
      navigate(redirectTo, { replace: true })
    }
  }

  return (
    <div className="min-h-screen bg-canvas px-6 py-12">
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brass-600">
            COTRB Church Management System
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink-900">Sign in</h1>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-500">
            This is a mock login for development — choose any account below to sign in as that role.
            No password is required yet.
          </p>
        </div>

        {authError && (
          <div
            role="alert"
            className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          >
            {authError}
          </div>
        )}

        <div className="space-y-8">
          {groups.map(({ group, accounts }) => (
            <section key={group}>
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400">
                {group}
              </h2>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {accounts.map((account) => (
                  <AccountCard key={account.id} account={account} onSelect={handleSelect} />
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  )
}
