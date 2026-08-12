import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-6 text-center">
      <p className="font-display text-6xl font-semibold text-ink-200">404</p>
      <h1 className="mt-2 text-lg font-semibold text-ink-900">Page not found</h1>
      <p className="mt-1 text-sm text-ink-500">
        The page you&rsquo;re looking for doesn&rsquo;t exist.
      </p>
      <Link
        to="/"
        className="mt-6 rounded-lg bg-ink-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-ink-700"
      >
        Back to home
      </Link>
    </div>
  )
}
