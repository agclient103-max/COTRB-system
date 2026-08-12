export default function SearchFilterBar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search…',
  filters,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-300"
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <circle cx="8.5" cy="8.5" r="5.5" />
          <path d="M16.5 16.5 13 13" strokeLinecap="round" />
        </svg>
        <input
          type="search"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full rounded-lg border border-ink-200 bg-white py-2 pl-9 pr-3 text-sm text-ink-900 placeholder:text-ink-300 focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
        />
      </div>

      {filters && filters.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row">
          {filters.map((filter) => (
            <select
              key={filter.key}
              value={filter.value}
              onChange={(e) => filter.onChange(e.target.value)}
              className="rounded-lg border border-ink-200 bg-white py-2 pl-3 pr-8 text-sm text-ink-700 focus:border-brass-400 focus:outline-none focus:ring-1 focus:ring-brass-400"
            >
              {filter.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          ))}
        </div>
      )}
    </div>
  )
}
