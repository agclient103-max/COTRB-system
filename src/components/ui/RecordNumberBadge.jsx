import Badge from './Badge.jsx'
import { getDisplayNumber, isPendingSync } from '../../utils/recordId.js'

export default function RecordNumberBadge({ record }) {
  if (isPendingSync(record)) {
    return <Badge tone="warning">Pending sync</Badge>
  }
  return <Badge tone="neutral">{getDisplayNumber(record)}</Badge>
}
