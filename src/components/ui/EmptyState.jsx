export default function EmptyState({ title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-ink-50">
        <svg
          className="h-6 w-6 text-ink-300"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <path d="M8 10h8M8 14h5" />
        </svg>
      </div>
      <p className="text-sm font-medium text-ink-700">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-ink-400">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
