import { useAuth } from '../../hooks/useAuth.js'
import { canCreate } from '../../data/roles.js'
import Button from './Button.jsx'

/**
 * count must reflect what's currently filtered/visible on screen, never a silent global
 * total that disagrees with the list below it (§8.1).
 */
export default function PageHeader({
  title,
  count,
  countLabel = 'record',
  moduleKey,
  addLabel,
  onAdd,
}) {
  const { user } = useAuth()
  const canAdd = moduleKey ? canCreate(user.role, moduleKey) : false
  const plural = count === 1 ? countLabel : `${countLabel}s`

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink-900 sm:text-3xl">{title}</h1>
        {typeof count === 'number' && (
          <p className="mt-1 text-sm text-ink-500">
            {count} {plural}
          </p>
        )}
      </div>
      {canAdd && onAdd && (
        <Button variant="brass" onClick={onAdd}>
          {addLabel}
        </Button>
      )}
    </div>
  )
}
