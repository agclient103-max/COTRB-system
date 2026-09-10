import { nextSequenceNumber } from '../sequence.js'
import { logAction } from '../auditLog.js'
import { ValidationError, NotFoundError, ConflictError } from '../errors.js'

const MODULE_KEY = 'ministries'
const MODULE_LABEL = 'Ministry'

function validate(input) {
  if (!input.name || !input.name.trim()) return 'Ministry name is required.'
  if (!input.category) return 'Category is required.'
  return null
}

function toRecord(row) {
  return {
    localId: row.local_id,
    sequenceNumber: row.sequence_number,
    name: row.name,
    category: row.category,
    lead: row.lead,
    memberCount: row.member_count,
    schedule: row.schedule,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listMinistries(db, { search = '', category = 'all', status = 'all' } = {}) {
  const rows = await db.sql`
    SELECT * FROM ministries
    WHERE (${search} = '' OR name ILIKE ${'%' + search + '%'})
      AND (${category} = 'all' OR category = ${category})
      AND (${status} = 'all' OR status = ${status})
    ORDER BY created_at DESC
  `
  return rows.map(toRecord)
}

async function findDuplicate(db, { name, excludeLocalId = null }) {
  const rows = await db.sql`
    SELECT * FROM ministries
    WHERE lower(name) = lower(${name})
      AND (${excludeLocalId}::uuid IS NULL OR local_id != ${excludeLocalId}::uuid)
    LIMIT 1
  `
  return rows[0] ? toRecord(rows[0]) : null
}

export async function createMinistry(db, { input, user, skipDuplicateCheck = false }) {
  const validationError = validate(input)
  if (validationError) throw new ValidationError(validationError)

  if (!skipDuplicateCheck) {
    const existing = await findDuplicate(db, { name: input.name })
    if (existing) throw new ConflictError('A very similar ministry already exists.', { existing })
  }

  const sequenceNumber = await nextSequenceNumber(db, MODULE_KEY)
  const rows = await db.sql`
    INSERT INTO ministries (name, category, lead, member_count, schedule, status, notes, sequence_number, created_by_id, created_by_name)
    VALUES (${input.name}, ${input.category}, ${input.lead || '— Not yet assigned —'}, ${input.memberCount ?? null}, ${input.schedule ?? ''}, ${input.status ?? 'Active'}, ${input.notes ?? ''}, ${sequenceNumber}, ${user.id}, ${user.name})
    RETURNING *
  `
  const record = toRecord(rows[0])
  await logAction(db, {
    user,
    action: 'created',
    moduleLabel: MODULE_LABEL,
    recordLabel: record.name,
  })
  return record
}

export async function updateMinistry(db, { localId, input, user, skipDuplicateCheck = false }) {
  const validationError = validate(input)
  if (validationError) throw new ValidationError(validationError)

  const existingRows = await db.sql`SELECT * FROM ministries WHERE local_id = ${localId}::uuid`
  if (!existingRows[0]) throw new NotFoundError()

  if (!skipDuplicateCheck) {
    const duplicate = await findDuplicate(db, { name: input.name, excludeLocalId: localId })
    if (duplicate)
      throw new ConflictError('A very similar ministry already exists.', { existing: duplicate })
  }

  const rows = await db.sql`
    UPDATE ministries
    SET name = ${input.name}, category = ${input.category}, lead = ${input.lead || '— Not yet assigned —'},
        member_count = ${input.memberCount ?? null}, schedule = ${input.schedule ?? ''},
        status = ${input.status}, notes = ${input.notes ?? ''}
    WHERE local_id = ${localId}::uuid
    RETURNING *
  `
  const record = toRecord(rows[0])
  await logAction(db, {
    user,
    action: 'updated',
    moduleLabel: MODULE_LABEL,
    recordLabel: record.name,
  })
  return record
}

export async function mergeMinistry(db, { existingLocalId, input, user }) {
  const rows = await db.sql`
    UPDATE ministries
    SET name = ${input.name}, category = ${input.category}, lead = ${input.lead || '— Not yet assigned —'},
        member_count = ${input.memberCount ?? null}, schedule = ${input.schedule ?? ''},
        status = ${input.status}, notes = ${input.notes ?? ''}
    WHERE local_id = ${existingLocalId}::uuid
    RETURNING *
  `
  if (!rows[0]) throw new NotFoundError()
  const record = toRecord(rows[0])
  await logAction(db, {
    user,
    action: 'merged',
    moduleLabel: MODULE_LABEL,
    recordLabel: record.name,
  })
  return record
}

export async function deleteMinistry(db, { localId, user }) {
  const rows = await db.sql`DELETE FROM ministries WHERE local_id = ${localId}::uuid RETURNING name`
  if (!rows[0]) throw new NotFoundError()
  await logAction(db, {
    user,
    action: 'deleted',
    moduleLabel: MODULE_LABEL,
    recordLabel: rows[0].name,
  })
}
