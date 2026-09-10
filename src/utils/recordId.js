export function generateLocalId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function getDisplayNumber(record) {
  return record.sequenceNumber ?? 'Pending sync'
}

export function isPendingSync(record) {
  return record.sequenceNumber == null
}

/** Returns an ISO timestamp N days before now — used to stagger seed data's createdAt so
 * "recently added" widgets sort sensibly even before anyone adds a real record. */
export function daysAgoIso(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString()
}
