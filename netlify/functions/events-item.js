import { getDb } from '../functions-lib/db.js'
import { requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { updateEvent, deleteEvent } from '../functions-lib/modules/events.js'
import { ValidationError } from '../functions-lib/errors.js'

export default async (req) => {
  const db = getDb()
  try {
    const segments = new URL(req.url).pathname.split('/').filter(Boolean)
    const localId = segments[segments.length - 1]
    if (!localId || localId === 'events') throw new ValidationError('Missing event id in the URL.')

    if (req.method === 'PUT') {
      const user = await requireUserWithAccess('events', 'update')
      const body = await req.json()
      const record = await updateEvent(db, {
        localId,
        input: body.input,
        user,
        skipDuplicateCheck: Boolean(body.skipDuplicateCheck),
      })
      return jsonResponse({ event: record })
    }
    if (req.method === 'DELETE') {
      const user = await requireUserWithAccess('events', 'delete')
      await deleteEvent(db, { localId, user })
      return jsonResponse({ success: true })
    }
    return jsonResponse({ error: 'Method not allowed' }, 405)
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/events/:id' }
