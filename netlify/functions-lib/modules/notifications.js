const DEFAULT_PREFS = {
  documentApproval: true,
  eventRsvp: true,
  budgetWarning: true,
  newPersonnel: true,
  weeklyDigest: true,
}

export async function getPreferences(db, userId) {
  const rows = await db.sql`SELECT prefs FROM notification_preferences WHERE user_id = ${userId}`
  return rows[0] ? { ...DEFAULT_PREFS, ...rows[0].prefs } : DEFAULT_PREFS
}

export async function savePreferences(db, userId, prefs) {
  const current = await getPreferences(db, userId)
  const merged = { ...current, ...prefs }
  await db.sql`
    INSERT INTO notification_preferences (user_id, prefs)
    VALUES (${userId}, ${JSON.stringify(merged)}::jsonb)
    ON CONFLICT (user_id) DO UPDATE SET prefs = ${JSON.stringify(merged)}::jsonb
  `
  return merged
}
