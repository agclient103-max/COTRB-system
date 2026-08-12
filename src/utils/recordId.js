/**
 * THE NUMBERING STRATEGY — decided once here, per §5.3, before any module is built.
 *
 * Every record gets a `localId` (a UUID) the instant it's created client-side. That UUID is
 * permanent and collision-safe even if two offline clients create records at the same moment —
 * it never changes.
 *
 * A record's human-facing sequential number (e.g. "DOC-2026-004") is a SEPARATE field,
 * `sequenceNumber`, which starts as `null` for anything created in this UI. It is never
 * generated client-side. Once there's a real backend, the server assigns it atomically at sync
 * time (a Postgres sequence or equivalent) — that's the only place two records can't end up
 * sharing a number.
 *
 * Until a record has a real `sequenceNumber`, the UI must show "Pending sync" — never a
 * confirmed-looking number that isn't actually confirmed. `getDisplayNumber` below is the one
 * place that decision is made, so every module renders it identically.
 *
 * Seed/mock data below (pre-existing "already synced" records) ships with real sequenceNumbers
 * already assigned, standing in for what the server would have assigned. Anything a user adds
 * through the UI in this phase gets `sequenceNumber: null` and shows "Pending sync", exactly as
 * it would in production before a backend exists to confirm it.
 */

export function generateLocalId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID()
  }
  // Fallback for environments without crypto.randomUUID (older browsers).
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function getDisplayNumber(record) {
  return record.sequenceNumber ?? 'Pending sync'
}

export function isPendingSync(record) {
  return record.sequenceNumber == null
}
