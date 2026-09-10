// §5.3's numbering strategy, made real: one Postgres SEQUENCE per module,
// assigned atomically at insert time. This is the authoritative source the
// frontend's local-only "Pending sync" badge was always a placeholder for.
const SEQUENCES = {
  documents: { seq: 'documents_seq', prefix: 'DOC' },
  personnel: { seq: 'personnel_seq', prefix: 'PER' },
  ministries: { seq: 'ministries_seq', prefix: 'MIN' },
  events: { seq: 'events_seq', prefix: 'EVT' },
  financial: { seq: 'financial_seq', prefix: 'FIN' },
  reports: { seq: 'reports_seq', prefix: 'RPT' },
}

/**
 * Returns a formatted sequence number like "DOC-2026-001". The sequence name
 * is always drawn from the fixed whitelist above — never from request input —
 * so building the query string with it is safe; Postgres does not allow a
 * sequence name to be passed as a bound parameter to nextval() the way a
 * column value can be.
 */
export async function nextSequenceNumber(db, moduleKey) {
  const config = SEQUENCES[moduleKey]
  if (!config) {
    throw new Error(`Unknown sequence module "${moduleKey}"`)
  }
  const year = new Date().getFullYear()
  const { rows } = await db.pool.query(`SELECT nextval('${config.seq}') AS n`)
  const n = Number(rows[0].n)
  return `${config.prefix}-${year}-${String(n).padStart(3, '0')}`
}
