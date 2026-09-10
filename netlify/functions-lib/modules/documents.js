import { nextSequenceNumber } from '../sequence.js'
import { logAction } from '../auditLog.js'
import { ValidationError, NotFoundError, ConflictError } from '../errors.js'

const MODULE_KEY = 'documents'
const MODULE_LABEL = 'Documents'

function validate(input) {
  if (!input.title || !input.title.trim()) return 'Title is required.'
  if (!input.category) return 'Category is required.'
  if (!input.ministry) return 'Ministry is required.'
  return null
}

function toRecord(row) {
  return {
    localId: row.local_id,
    sequenceNumber: row.sequence_number,
    title: row.title,
    category: row.category,
    ministry: row.ministry,
    status: row.status,
    fileName: row.file_name,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listDocuments(db, { search = '', category = 'all', status = 'all' } = {}) {
  const rows = await db.sql`
    SELECT * FROM documents
    WHERE (${search} = '' OR title ILIKE ${'%' + search + '%'})
      AND (${category} = 'all' OR category = ${category})
      AND (${status} = 'all' OR status = ${status})
    ORDER BY created_at DESC
  `
  return rows.map(toRecord)
}

async function findDuplicate(db, { title, ministry, excludeLocalId = null }) {
  const rows = await db.sql`
    SELECT * FROM documents
    WHERE lower(title) = lower(${title})
      AND ministry = ${ministry}
      AND (${excludeLocalId}::uuid IS NULL OR local_id != ${excludeLocalId}::uuid)
    LIMIT 1
  `
  return rows[0] ? toRecord(rows[0]) : null
}

export async function createDocument(db, { input, user, skipDuplicateCheck = false }) {
  const validationError = validate(input)
  if (validationError) throw new ValidationError(validationError)

  if (!skipDuplicateCheck) {
    const existing = await findDuplicate(db, { title: input.title, ministry: input.ministry })
    if (existing) {
      throw new ConflictError('A very similar document already exists.', { existing })
    }
  }

  const sequenceNumber = await nextSequenceNumber(db, MODULE_KEY)
  const rows = await db.sql`
    INSERT INTO documents (title, category, ministry, status, notes, sequence_number, created_by_id, created_by_name)
    VALUES (${input.title}, ${input.category}, ${input.ministry}, ${input.status ?? 'Draft'}, ${input.notes ?? ''}, ${sequenceNumber}, ${user.id}, ${user.name})
    RETURNING *
  `
  const record = toRecord(rows[0])
  await logAction(db, {
    user,
    action: 'created',
    moduleLabel: MODULE_LABEL,
    recordLabel: record.title,
  })
  return record
}

export async function updateDocument(db, { localId, input, user, skipDuplicateCheck = false }) {
  const validationError = validate(input)
  if (validationError) throw new ValidationError(validationError)

  const existingRows = await db.sql`SELECT * FROM documents WHERE local_id = ${localId}::uuid`
  if (!existingRows[0]) throw new NotFoundError()

  if (!skipDuplicateCheck) {
    const duplicate = await findDuplicate(db, {
      title: input.title,
      ministry: input.ministry,
      excludeLocalId: localId,
    })
    if (duplicate) {
      throw new ConflictError('A very similar document already exists.', { existing: duplicate })
    }
  }

  const rows = await db.sql`
    UPDATE documents
    SET title = ${input.title}, category = ${input.category}, ministry = ${input.ministry},
        status = ${input.status}, notes = ${input.notes ?? ''}
    WHERE local_id = ${localId}::uuid
    RETURNING *
  `
  const record = toRecord(rows[0])
  await logAction(db, {
    user,
    action: 'updated',
    moduleLabel: MODULE_LABEL,
    recordLabel: record.title,
  })
  return record
}

export async function mergeDocument(db, { existingLocalId, input, user }) {
  const rows = await db.sql`
    UPDATE documents
    SET title = ${input.title}, category = ${input.category}, ministry = ${input.ministry},
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
    recordLabel: record.title,
  })
  return record
}

export async function deleteDocument(db, { localId, user }) {
  const rows = await db.sql`DELETE FROM documents WHERE local_id = ${localId}::uuid RETURNING title`
  if (!rows[0]) throw new NotFoundError()
  await logAction(db, {
    user,
    action: 'deleted',
    moduleLabel: MODULE_LABEL,
    recordLabel: rows[0].title,
  })
}
