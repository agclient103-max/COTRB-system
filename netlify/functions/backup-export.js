import { getDb } from '../functions-lib/db.js'
import { requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { exportAllData } from '../functions-lib/modules/backup.js'

export default async (req) => {
  const db = getDb()
  try {
    if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405)
    // Exporting your own data is a read, not a write — gated on settings 'read'.
    await requireUserWithAccess('settings', 'read')
    const payload = await exportAllData(db)
    return jsonResponse(payload)
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/backup/export' }
