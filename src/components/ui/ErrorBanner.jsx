export default function ErrorBanner({ message, onDismiss, className = '' }) {
  if (!message) return null

  return (
    <div
      role="alert"
      className={[
        'flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700',
        className,
      ].join(' ')}
    >
      <svg
        className="mt-0.5 h-4 w-4 flex-none"
        viewBox="0 0 20 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="10" cy="10" r="7.5" />
        <path d="M10 6.5v4.5M10 13.5h.01" strokeLinecap="round" />
      </svg>
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss error"
          className="flex-none text-red-400 hover:text-red-600"
        >
          ✕
        </button>
      )}
    </div>
  )
}
