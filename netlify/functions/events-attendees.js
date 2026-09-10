import { getDb } from '../functions-lib/db.js'
import { requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { addAttendee, removeAttendee } from '../functions-lib/modules/events.js'
import { ValidationError } from '../functions-lib/errors.js'

// POST   /api/events/:id/attendees              — add an attendee
// DELETE /api/events/:id/attendees/:attendeeId   — remove an attendee
export default async (req) => {
  const db = getDb()
  try {
    const segments = new URL(req.url).pathname.split('/').filter(Boolean)
    const attendeesIndex = segments.indexOf('attendees')
    const eventLocalId = attendeesIndex > 0 ? segments[attendeesIndex - 1] : null
    if (!eventLocalId) throw new ValidationError('Missing event id in the URL.')

    // update rights on events govern attendee/RSVP management too
    const user = await requireUserWithAccess('events', 'update')

    if (req.method === 'POST') {
      const body = await req.json()
      const record = await addAttendee(db, { eventLocalId, name: body.name, user })
      return jsonResponse({ event: record }, 201)
    }

    if (req.method === 'DELETE') {
      const attendeeId = segments[attendeesIndex + 1]
      if (!attendeeId) throw new ValidationError('Missing attendee id in the URL.')
      const record = await removeAttendee(db, { eventLocalId, attendeeId, user })
      return jsonResponse({ event: record })
    }

    return jsonResponse({ error: 'Method not allowed' }, 405)
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = {
  path: ['/api/events/:id/attendees', '/api/events/:id/attendees/:attendeeId'],
}
