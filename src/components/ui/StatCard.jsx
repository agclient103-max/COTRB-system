export default function StatCard({ label, value, sublabel, tone = 'neutral' }) {
  const toneClasses = {
    neutral: 'text-ink-900',
    brass: 'text-brass-600',
  }

  return (
    <div className="rounded-xl border border-ink-100 bg-white p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-400">{label}</p>
      <p className={['mt-2 font-display text-2xl font-semibold', toneClasses[tone]].join(' ')}>
        {value}
      </p>
      {sublabel && <p className="mt-1 text-xs text-ink-400">{sublabel}</p>}
    </div>
  )
}
