const VARIANT_CLASSES = {
  primary: 'bg-ink-900 text-white hover:bg-ink-700 focus-visible:outline-brass-500',
  brass: 'bg-brass-500 text-white hover:bg-brass-600 focus-visible:outline-ink-700',
  secondary:
    'border border-ink-200 bg-white text-ink-700 hover:border-ink-300 hover:bg-ink-50 focus-visible:outline-brass-500',
  ghost: 'text-ink-600 hover:bg-ink-50 focus-visible:outline-brass-500',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus-visible:outline-red-700',
}

const SIZE_CLASSES = {
  sm: 'px-2.5 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-5 py-2.5 text-base',
}

function Spinner({ className }) {
  return (
    <svg className={['animate-spin', className].join(' ')} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M4 12a8 8 0 0 1 8-8V0C5.4 0 0 5.4 0 12h4Z"
      />
    </svg>
  )
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  type = 'button',
  className = '',
  ...rest
}) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={[
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition',
        'disabled:cursor-not-allowed disabled:opacity-50',
        VARIANT_CLASSES[variant],
        SIZE_CLASSES[size],
        className,
      ].join(' ')}
      {...rest}
    >
      {isLoading && <Spinner className="h-4 w-4" />}
      {children}
    </button>
  )
}
