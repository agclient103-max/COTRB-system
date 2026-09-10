import { requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { updateUserRole, deleteUser } from '../functions-lib/modules/users.js'
import { logAction } from '../functions-lib/auditLog.js'
import { getDb } from '../functions-lib/db.js'
import { ValidationError } from '../functions-lib/errors.js'

export default async (req) => {
  try {
    const segments = new URL(req.url).pathname.split('/').filter(Boolean)
    const userId = segments[segments.length - 1]
    if (!userId || userId === 'users') throw new ValidationError('Missing user id in the URL.')

    if (req.method === 'PUT') {
      const actingUser = await requireUserWithAccess('settings', 'update')
      const body = await req.json()
      const updated = await updateUserRole(userId, body.role)
      await logAction(getDb(), {
        user: actingUser,
        action: 'updated',
        moduleLabel: 'Settings',
        recordLabel: `User role: ${updated.email} → ${body.role}`,
      })
      return jsonResponse({ user: updated })
    }

    if (req.method === 'DELETE') {
      // Deleting an account, not just editing it, requires the module's D right —
      // per the §6.2 matrix, only SUPER_ADMIN has that on Settings (ADMIN has CRU,
      // not CRUD), so this naturally restricts account deletion to Super Admins.
      const actingUser = await requireUserWithAccess('settings', 'delete')
      await deleteUser(userId)
      await logAction(getDb(), {
        user: actingUser,
        action: 'deleted',
        moduleLabel: 'Settings',
        recordLabel: `User account: ${userId}`,
      })
      return jsonResponse({ success: true })
    }

    return jsonResponse({ error: 'Method not allowed' }, 405)
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/users/:id' }
