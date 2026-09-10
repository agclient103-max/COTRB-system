import { useState } from 'react'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'

export default function Login() {
  const { isAuthenticated, authError, login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const redirectTo = location.state?.from?.pathname || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setIsSubmitting(true)
    const success = await login(email, password)
    setIsSubmitting(false)
    if (success) {
      navigate(redirectTo, { replace: true })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-canvas px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brass-600">
            COTRB Church Management System
          </p>
          <h1 className="font-display text-3xl font-semibold text-ink-900">Sign in</h1>
          <p className="mx-auto mt-2 max-w-xs text-sm text-ink-500">
            Use the email and password your administrator gave you.
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

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-xl border border-ink-100 bg-white p-6"
        >
          <div>
            <label htmlFor="login-email" className="mb-1 block text-sm font-medium text-ink-700">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label htmlFor="login-password" className="mb-1 block text-sm font-medium text-ink-700">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-ink-200 px-3 py-2 text-sm focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-ink-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ink-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSubmitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="mt-6 text-center text-xs text-ink-400">
          Don&rsquo;t have an account? Ask an administrator to create one for you from Settings →
          Users &amp; Roles.
        </p>
      </div>
    </div>
  )
}
