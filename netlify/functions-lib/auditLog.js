/**
 * Server-side audit log — the authoritative version of what the frontend's
 * IndexedDB-backed audit log stood in for. Called by every write path across
 * every module's Functions. Failures here are logged but never thrown —
 * a failed audit write shouldn't block or fail an action that itself already
 * succeeded, matching the same tradeoff the client-side version made.
 */
export async function logAction(db, { user, action, moduleLabel, recordLabel }) {
  try {
    await db.sql`
      INSERT INTO audit_log (user_id, user_name, user_role, action, module_label, record_label)
      VALUES (${user.id}, ${user.name}, ${user.role}, ${action}, ${moduleLabel}, ${recordLabel})
    `
  } catch (err) {
    console.error('Failed to write audit log entry', err)
  }
}

export async function getAuditLog(db, { limit = 50 } = {}) {
  const rows = await db.sql`
    SELECT id, user_id, user_name, user_role, action, module_label, record_label, "timestamp"
    FROM audit_log
    ORDER BY "timestamp" DESC
    LIMIT ${limit}
  `
  return rows
}
