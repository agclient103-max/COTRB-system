const TONE_CLASSES = {
  neutral: 'bg-ink-50 text-ink-600',
  brass: 'bg-brass-50 text-brass-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
}

export default function Badge({ children, tone = 'neutral', className = '' }) {
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        TONE_CLASSES[tone],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
