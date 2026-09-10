import Spinner from './Spinner.jsx'
import EmptyState from './EmptyState.jsx'

const HIDE_CLASSES = {
  sm: 'hidden sm:table-cell',
  md: 'hidden md:table-cell',
  lg: 'hidden lg:table-cell',
}

export default function Table({
  columns,
  rows,
  rowKey = (row) => row.id,
  isLoading = false,
  emptyTitle = 'No records yet',
  emptyDescription = 'Nothing to show here yet.',
  onRowClick,
}) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center rounded-xl border border-ink-100 bg-white py-16">
        <Spinner className="h-6 w-6 text-ink-300" />
      </div>
    )
  }

  if (!rows || rows.length === 0) {
    return (
      <div className="rounded-xl border border-ink-100 bg-white">
        <EmptyState title={emptyTitle} description={emptyDescription} />
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-ink-100 bg-white">
      <table className="w-full min-w-[640px] divide-y divide-ink-100 text-sm">
        <thead className="bg-ink-50/60">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key}
                className={[
                  'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-ink-500',
                  col.hideBelow ? HIDE_CLASSES[col.hideBelow] : '',
                ].join(' ')}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ink-100">
          {rows.map((row) => (
            <tr
              key={rowKey(row)}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={onRowClick ? 'cursor-pointer hover:bg-ink-50/60' : undefined}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  className={[
                    'px-4 py-3 text-ink-700',
                    col.hideBelow ? HIDE_CLASSES[col.hideBelow] : '',
                  ].join(' ')}
                >
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
