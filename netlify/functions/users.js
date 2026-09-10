import { requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { listUsers, createUser } from '../functions-lib/modules/users.js'
import { logAction } from '../functions-lib/auditLog.js'
import { getDb } from '../functions-lib/db.js'

export default async (req) => {
  try {
    if (req.method === 'GET') {
      await requireUserWithAccess('settings', 'read')
      const users = await listUsers()
      return jsonResponse({ users })
    }

    if (req.method === 'POST') {
      const actingUser = await requireUserWithAccess('settings', 'update')
      const body = await req.json()
      const created = await createUser(body)
      await logAction(getDb(), {
        user: actingUser,
        action: 'created',
        moduleLabel: 'Settings',
        recordLabel: `User account: ${created.email}`,
      })
      return jsonResponse({ user: created }, 201)
    }

    return jsonResponse({ error: 'Method not allowed' }, 405)
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/users' }
