import { nextSequenceNumber } from '../sequence.js'
import { logAction } from '../auditLog.js'
import { ValidationError, NotFoundError, ConflictError } from '../errors.js'

const MODULE_KEY = 'financial'
const MODULE_LABEL = 'Financial'

function validate(input) {
  if (!input.date) return 'Date is required.'
  if (!input.type) return 'Type is required.'
  if (!input.category) return 'Category is required.'
  if (!input.description || !input.description.trim()) return 'Description is required.'
  const amount = Number(input.amount)
  if (input.amount == null || Number.isNaN(amount) || amount <= 0) {
    return 'Amount must be a positive number.'
  }
  return null
}

function toRecord(row) {
  return {
    localId: row.local_id,
    sequenceNumber: row.sequence_number,
    date: row.date instanceof Date ? row.date.toISOString().slice(0, 10) : row.date,
    type: row.type,
    category: row.category,
    ministry: row.ministry,
    amount: Number(row.amount),
    description: row.description,
    status: row.status,
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export async function listTransactions(db, { search = '', type = 'all', status = 'all' } = {}) {
  const rows = await db.sql`
    SELECT * FROM financial_transactions
    WHERE (${search} = '' OR description ILIKE ${'%' + search + '%'})
      AND (${type} = 'all' OR type = ${type})
      AND (${status} = 'all' OR status = ${status})
    ORDER BY date DESC, created_at DESC
  `
  return rows.map(toRecord)
}

async function findDuplicate(db, { date, description, excludeLocalId = null }) {
  const rows = await db.sql`
    SELECT * FROM financial_transactions
    WHERE date = ${date}::date
      AND lower(description) = lower(${description})
      AND (${excludeLocalId}::uuid IS NULL OR local_id != ${excludeLocalId}::uuid)
    LIMIT 1
  `
  return rows[0] ? toRecord(rows[0]) : null
}

export async function createTransaction(db, { input, user, skipDuplicateCheck = false }) {
  const validationError = validate(input)
  if (validationError) throw new ValidationError(validationError)

  if (!skipDuplicateCheck) {
    const existing = await findDuplicate(db, { date: input.date, description: input.description })
    if (existing)
      throw new ConflictError('A very similar transaction already exists.', { existing })
  }

  const sequenceNumber = await nextSequenceNumber(db, MODULE_KEY)
  const rows = await db.sql`
    INSERT INTO financial_transactions (date, type, category, ministry, amount, description, status, notes, sequence_number, created_by_id, created_by_name)
    VALUES (${input.date}::date, ${input.type}, ${input.category}, ${input.ministry}, ${input.amount}, ${input.description}, ${input.status ?? 'Recorded'}, ${input.notes ?? ''}, ${sequenceNumber}, ${user.id}, ${user.name})
    RETURNING *
  `
  const record = toRecord(rows[0])
  await logAction(db, {
    user,
    action: 'created',
    moduleLabel: MODULE_LABEL,
    recordLabel: record.description,
  })
  return record
}

export async function updateTransaction(db, { localId, input, user, skipDuplicateCheck = false }) {
  const validationError = validate(input)
  if (validationError) throw new ValidationError(validationError)

  const existingRows =
    await db.sql`SELECT * FROM financial_transactions WHERE local_id = ${localId}::uuid`
  if (!existingRows[0]) throw new NotFoundError()

  if (!skipDuplicateCheck) {
    const duplicate = await findDuplicate(db, {
      date: input.date,
      description: input.description,
      excludeLocalId: localId,
    })
    if (duplicate)
      throw new ConflictError('A very similar transaction already exists.', { existing: duplicate })
  }

  const rows = await db.sql`
    UPDATE financial_transactions
    SET date = ${input.date}::date, type = ${input.type}, category = ${input.category},
        ministry = ${input.ministry}, amount = ${input.amount}, description = ${input.description},
        status = ${input.status}, notes = ${input.notes ?? ''}
    WHERE local_id = ${localId}::uuid
    RETURNING *
  `
  const record = toRecord(rows[0])
  await logAction(db, {
    user,
    action: 'updated',
    moduleLabel: MODULE_LABEL,
    recordLabel: record.description,
  })
  return record
}

export async function mergeTransaction(db, { existingLocalId, input, user }) {
  const rows = await db.sql`
    UPDATE financial_transactions
    SET date = ${input.date}::date, type = ${input.type}, category = ${input.category},
        ministry = ${input.ministry}, amount = ${input.amount}, description = ${input.description},
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
    recordLabel: record.description,
  })
  return record
}

export async function deleteTransaction(db, { localId, user }) {
  const rows =
    await db.sql`DELETE FROM financial_transactions WHERE local_id = ${localId}::uuid RETURNING description`
  if (!rows[0]) throw new NotFoundError()
  await logAction(db, {
    user,
    action: 'deleted',
    moduleLabel: MODULE_LABEL,
    recordLabel: rows[0].description,
  })
}

/** Aggregate totals, used by both the Financial page's stat cards and the Reports page. */
export async function getFinancialTotals(db) {
  const rows = await db.sql`
    SELECT type, COALESCE(SUM(amount), 0) AS total FROM financial_transactions GROUP BY type
  `
  const income = Number(rows.find((r) => r.type === 'Income')?.total ?? 0)
  const expenses = Number(rows.find((r) => r.type === 'Expense')?.total ?? 0)
  return { income, expenses, net: income - expenses }
}
