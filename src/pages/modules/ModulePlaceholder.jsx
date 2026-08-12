export default function ModulePlaceholder({ title, description, phase }) {
  return (
    <div className="px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-brass-600">
          {phase}
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">{title}</h1>
        <p className="mt-2 max-w-xl text-sm text-ink-500">{description}</p>

        <div className="mt-8 rounded-xl border border-dashed border-ink-200 bg-white px-6 py-10 text-center">
          <p className="text-sm text-ink-400">
            This module&rsquo;s full interface — header, search, table, add/edit — arrives in{' '}
            {phase}.
          </p>
        </div>
      </div>
    </div>
  )
}
