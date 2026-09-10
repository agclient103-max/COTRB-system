import { nextSequenceNumber } from '../sequence.js'
import { logAction } from '../auditLog.js'
import { ValidationError, NotFoundError, ConflictError } from '../errors.js'

const MODULE_KEY = 'events'
const MODULE_LABEL = 'Events & Calendar'

function validate(input) {
  if (!input.title || !input.title.trim()) return 'Title is required.'
  if (!input.type) return 'Type is required.'
  if (!input.ministry) return 'Ministry is required.'
  return null
}

function toRecord(row, attendees = []) {
  return {
    localId: row.local_id,
    sequenceNumber: row.sequence_number,
    title: row.title,
    type: row.type,
    ministry: row.ministry,
    when: row.when_text,
    status: row.status,
    capacity: row.capacity,
    notes: row.notes,
    attendees,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

async function attachAttendees(db, eventRows) {
  if (eventRows.length === 0) return []
  const ids = eventRows.map((r) => r.id)
  const attendeeRows = await db.sql`
    SELECT id, event_id, name FROM event_attendees WHERE event_id = ANY(${ids}) ORDER BY added_at
  `
  const byEvent = {}
  for (const a of attendeeRows) {
    ;(byEvent[a.event_id] ??= []).push({ id: a.id, name: a.name })
  }
  return eventRows.map((r) => toRecord(r, byEvent[r.id] ?? []))
}

export async function listEvents(db, { search = '', type = 'all', status = 'all' } = {}) {
  const rows = await db.sql`
    SELECT * FROM events
    WHERE (${search} = '' OR title ILIKE ${'%' + search + '%'})
      AND (${type} = 'all' OR type = ${type})
      AND (${status} = 'all' OR status = ${status})
    ORDER BY created_at DESC
  `
  return attachAttendees(db, rows)
}

export async function getEventByLocalId(db, localId) {
  const rows = await db.sql`SELECT * FROM events WHERE local_id = ${localId}::uuid`
  if (!rows[0]) throw new NotFoundError()
  const [record] = await attachAttendees(db, rows)
  return record
}

async function findDuplicate(db, { title, excludeLocalId = null }) {
  const rows = await db.sql`
    SELECT * FROM events
    WHERE lower(title) = lower(${title})
      AND (${excludeLocalId}::uuid IS NULL OR local_id != ${excludeLocalId}::uuid)
    LIMIT 1
  `
  if (!rows[0]) return null
  const [record] = await attachAttendees(db, rows)
  return record
}

export async function createEvent(db, { input, user, skipDuplicateCheck = false }) {
  const validationError = validate(input)
  if (validationError) throw new ValidationError(validationError)

  if (!skipDuplicateCheck) {
    const existing = await findDuplicate(db, { title: input.title })
    if (existing) throw new ConflictError('A very similar event already exists.', { existing })
  }

  const sequenceNumber = await nextSequenceNumber(db, MODULE_KEY)
  const rows = await db.sql`
    INSERT INTO events (title, type, ministry, when_text, status, capacity, notes, sequence_number, created_by_id, created_by_name)
    VALUES (${input.title}, ${input.type}, ${input.ministry}, ${input.when ?? ''}, ${input.status ?? 'Upcoming'}, ${input.capacity ?? null}, ${input.notes ?? ''}, ${sequenceNumber}, ${user.id}, ${user.name})
    RETURNING *
  `
  const [record] = await attachAttendees(db, rows)
  await logAction(db, {
    user,
    action: 'created',
    moduleLabel: MODULE_LABEL,
    recordLabel: record.title,
  })
  return record
}

export async function updateEvent(db, { localId, input, user, skipDuplicateCheck = false }) {
  const validationError = validate(input)
  if (validationError) throw new ValidationError(validationError)

  const existingRows = await db.sql`SELECT * FROM events WHERE local_id = ${localId}::uuid`
  if (!existingRows[0]) throw new NotFoundError()

  if (!skipDuplicateCheck) {
    const duplicate = await findDuplicate(db, { title: input.title, excludeLocalId: localId })
    if (duplicate)
      throw new ConflictError('A very similar event already exists.', { existing: duplicate })
  }

  const rows = await db.sql`
    UPDATE events
    SET title = ${input.title}, type = ${input.type}, ministry = ${input.ministry},
        when_text = ${input.when ?? ''}, status = ${input.status}, capacity = ${input.capacity ?? null},
        notes = ${input.notes ?? ''}
    WHERE local_id = ${localId}::uuid
    RETURNING *
  `
  const [record] = await attachAttendees(db, rows)
  await logAction(db, {
    user,
    action: 'updated',
    moduleLabel: MODULE_LABEL,
    recordLabel: record.title,
  })
  return record
}

export async function mergeEvent(db, { existingLocalId, input, user }) {
  const rows = await db.sql`
    UPDATE events
    SET title = ${input.title}, type = ${input.type}, ministry = ${input.ministry},
        when_text = ${input.when ?? ''}, status = ${input.status}, capacity = ${input.capacity ?? null},
        notes = ${input.notes ?? ''}
    WHERE local_id = ${existingLocalId}::uuid
    RETURNING *
  `
  if (!rows[0]) throw new NotFoundError()
  const [record] = await attachAttendees(db, rows)
  await logAction(db, {
    user,
    action: 'merged',
    moduleLabel: MODULE_LABEL,
    recordLabel: record.title,
  })
  return record
}

export async function deleteEvent(db, { localId, user }) {
  const rows = await db.sql`DELETE FROM events WHERE local_id = ${localId}::uuid RETURNING title`
  if (!rows[0]) throw new NotFoundError()
  await logAction(db, {
    user,
    action: 'deleted',
    moduleLabel: MODULE_LABEL,
    recordLabel: rows[0].title,
  })
}

export async function addAttendee(db, { eventLocalId, name, user }) {
  if (!name || !name.trim()) throw new ValidationError('Attendee name is required.')
  const eventRows =
    await db.sql`SELECT id, title FROM events WHERE local_id = ${eventLocalId}::uuid`
  if (!eventRows[0]) throw new NotFoundError('Event not found.')

  await db.sql`INSERT INTO event_attendees (event_id, name) VALUES (${eventRows[0].id}, ${name.trim()})`
  await logAction(db, {
    user,
    action: 'updated',
    moduleLabel: MODULE_LABEL,
    recordLabel: `${eventRows[0].title} (attendee added)`,
  })
  return getEventByLocalId(db, eventLocalId)
}

export async function removeAttendee(db, { eventLocalId, attendeeId, user }) {
  const eventRows =
    await db.sql`SELECT id, title FROM events WHERE local_id = ${eventLocalId}::uuid`
  if (!eventRows[0]) throw new NotFoundError('Event not found.')

  const deleted = await db.sql`
    DELETE FROM event_attendees WHERE id = ${attendeeId} AND event_id = ${eventRows[0].id} RETURNING id
  `
  if (!deleted[0]) throw new NotFoundError('Attendee not found on this event.')

  await logAction(db, {
    user,
    action: 'updated',
    moduleLabel: MODULE_LABEL,
    recordLabel: `${eventRows[0].title} (attendee removed)`,
  })
  return getEventByLocalId(db, eventLocalId)
}
