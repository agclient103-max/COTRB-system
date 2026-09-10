import { getDb } from '../functions-lib/db.js'
import { requireUser, requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { getOrgStats, updateOrgStats } from '../functions-lib/modules/orgStats.js'

// GET is available to any signed-in user — the Dashboard itself already
// decides per-widget whether a given role should see each figure (matching
// how these numbers were gated when they were a static import). Editing
// requires the same settings 'update' right as everything else in Settings.
export default async (req) => {
  const db = getDb()
  try {
    if (req.method === 'GET') {
      await requireUser()
      const stats = await getOrgStats(db)
      return jsonResponse({ stats })
    }
    if (req.method === 'PUT') {
      const user = await requireUserWithAccess('settings', 'update')
      const body = await req.json()
      const stats = await updateOrgStats(db, { input: body.input, user })
      return jsonResponse({ stats })
    }
    return jsonResponse({ error: 'Method not allowed' }, 405)
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/org-stats' }
