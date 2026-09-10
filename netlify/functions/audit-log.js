import { getDb } from '../functions-lib/db.js'
import { requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { getAuditLog } from '../functions-lib/auditLog.js'

export default async (req) => {
  const db = getDb()
  try {
    if (req.method !== 'GET') return jsonResponse({ error: 'Method not allowed' }, 405)
    await requireUserWithAccess('settings', 'read')
    const url = new URL(req.url)
    const limit = Math.min(Number(url.searchParams.get('limit')) || 50, 200)
    const entries = await getAuditLog(db, { limit })
    return jsonResponse({ entries })
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/audit-log' }
