import { getDb } from '../functions-lib/db.js'
import { requireUser } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { getPreferences, savePreferences } from '../functions-lib/modules/notifications.js'

// Every signed-in user manages their own notification preferences — not gated
// by the settings module's RBAC, since these are personal, not administrative.
export default async (req) => {
  const db = getDb()
  try {
    const user = await requireUser()

    if (req.method === 'GET') {
      const prefs = await getPreferences(db, user.id)
      return jsonResponse({ prefs })
    }

    if (req.method === 'PUT') {
      const body = await req.json()
      const prefs = await savePreferences(db, user.id, body.prefs ?? {})
      return jsonResponse({ prefs })
    }

    return jsonResponse({ error: 'Method not allowed' }, 405)
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/notification-preferences' }
