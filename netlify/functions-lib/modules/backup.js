/**
 * Exports every table's raw rows — a genuine server-side backup, not a client-only one.
 * Deliberately uses one explicit query per table (via the already-verified sql tag) rather
 * than building a dynamic "SELECT * FROM <tableName>" string — avoids any doubt about how
 * a raw/unsafe query API handles row shaping, and keeps every query fully typed and testable.
 */
export async function exportAllData(db) {
  const [
    documents,
    personnel,
    ministries,
    events,
    eventAttendees,
    financialTransactions,
    savedReports,
  ] = await Promise.all([
    db.sql`SELECT * FROM documents`,
    db.sql`SELECT * FROM personnel`,
    db.sql`SELECT * FROM ministries`,
    db.sql`SELECT * FROM events`,
    db.sql`SELECT * FROM event_attendees`,
    db.sql`SELECT * FROM financial_transactions`,
    db.sql`SELECT * FROM saved_reports`,
  ])

  return {
    exportedAt: new Date().toISOString(),
    version: 1,
    data: {
      documents,
      personnel,
      ministries,
      events,
      event_attendees: eventAttendees,
      financial_transactions: financialTransactions,
      saved_reports: savedReports,
    },
  }
}
