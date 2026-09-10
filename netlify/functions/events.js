import { getDb } from '../functions-lib/db.js'
import { requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { listEvents, createEvent } from '../functions-lib/modules/events.js'
import { canCreate } from '../../src/data/roles.js'

export default async (req) => {
  const db = getDb()
  try {
    if (req.method === 'GET') {
      const user = await requireUserWithAccess('events', 'read')
      const url = new URL(req.url)
      const rows = await listEvents(db, {
        search: url.searchParams.get('search') ?? '',
        type: url.searchParams.get('type') ?? 'all',
        status: url.searchParams.get('status') ?? 'all',
      })
      return jsonResponse({ events: rows, canCreate: canCreate(user.role, 'events') })
    }
    if (req.method === 'POST') {
      const user = await requireUserWithAccess('events', 'create')
      const body = await req.json()
      const record = await createEvent(db, {
        input: body.input,
        user,
        skipDuplicateCheck: Boolean(body.skipDuplicateCheck),
      })
      return jsonResponse({ event: record }, 201)
    }
    return jsonResponse({ error: 'Method not allowed' }, 405)
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/events' }
