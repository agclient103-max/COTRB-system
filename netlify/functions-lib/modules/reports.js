import { nextSequenceNumber } from '../sequence.js'
import { logAction } from '../auditLog.js'
import { ValidationError, NotFoundError, ConflictError } from '../errors.js'
import { getFinancialTotals } from './financial.js'

const MODULE_KEY = 'reports'
const MODULE_LABEL = 'Reports & Analytics'

function validate(input) {
  if (!input.name || !input.name.trim()) return 'Report name is required.'
  if (!input.type) return 'Report type is required.'
  return null
}

function toRecord(row) {
  return {
    localId: row.local_id,
    sequenceNumber: row.sequence_number,
    name: row.name,
    type: row.type,
    createdBy: row.created_by_name,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listReports(db) {
  const rows = await db.sql`SELECT * FROM saved_reports ORDER BY created_at DESC`
  return rows.map(toRecord)
}

async function findDuplicate(db, { name, excludeLocalId = null }) {
  const rows = await db.sql`
    SELECT * FROM saved_reports
    WHERE lower(name) = lower(${name})
      AND (${excludeLocalId}::uuid IS NULL OR local_id != ${excludeLocalId}::uuid)
    LIMIT 1
  `
  return rows[0] ? toRecord(rows[0]) : null
}

export async function createReport(db, { input, user, skipDuplicateCheck = false }) {
  const validationError = validate(input)
  if (validationError) throw new ValidationError(validationError)

  if (!skipDuplicateCheck) {
    const existing = await findDuplicate(db, { name: input.name })
    if (existing)
      throw new ConflictError('A very similar saved report already exists.', { existing })
  }

  const sequenceNumber = await nextSequenceNumber(db, MODULE_KEY)
  const rows = await db.sql`
    INSERT INTO saved_reports (name, type, notes, sequence_number, created_by_id, created_by_name)
    VALUES (${input.name}, ${input.type}, ${input.notes ?? ''}, ${sequenceNumber}, ${user.id}, ${user.name})
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

export async function updateReport(db, { localId, input, user, skipDuplicateCheck = false }) {
  const validationError = validate(input)
  if (validationError) throw new ValidationError(validationError)

  const existingRows = await db.sql`SELECT * FROM saved_reports WHERE local_id = ${localId}::uuid`
  if (!existingRows[0]) throw new NotFoundError()

  if (!skipDuplicateCheck) {
    const duplicate = await findDuplicate(db, { name: input.name, excludeLocalId: localId })
    if (duplicate)
      throw new ConflictError('A very similar saved report already exists.', {
        existing: duplicate,
      })
  }

  const rows = await db.sql`
    UPDATE saved_reports SET name = ${input.name}, type = ${input.type}, notes = ${input.notes ?? ''}
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

export async function mergeReport(db, { existingLocalId, input, user }) {
  const rows = await db.sql`
    UPDATE saved_reports SET name = ${input.name}, type = ${input.type}, notes = ${input.notes ?? ''}
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

export async function deleteReport(db, { localId, user }) {
  const rows =
    await db.sql`DELETE FROM saved_reports WHERE local_id = ${localId}::uuid RETURNING name`
  if (!rows[0]) throw new NotFoundError()
  await logAction(db, {
    user,
    action: 'deleted',
    moduleLabel: MODULE_LABEL,
    recordLabel: rows[0].name,
  })
}

/** Cross-module aggregates for the Reports & Analytics dashboard section. */
export async function getReportsSummary(db) {
  const [personnelByCategory, topMinistries, financialTotals, personnelCount, ministryCount] =
    await Promise.all([
      db.sql`SELECT category, COUNT(*)::int AS count FROM personnel GROUP BY category ORDER BY category`,
      db.sql`
      SELECT name, member_count AS "memberCount" FROM ministries
      WHERE member_count IS NOT NULL
      ORDER BY member_count DESC
      LIMIT 6
    `,
      getFinancialTotals(db),
      db.sql`SELECT COUNT(*)::int AS count FROM personnel`,
      db.sql`SELECT COUNT(*)::int AS count FROM ministries`,
    ])

  return {
    personnelByCategory,
    topMinistries,
    financialTotals,
    personnelCount: personnelCount[0].count,
    ministryCount: ministryCount[0].count,
  }
}
