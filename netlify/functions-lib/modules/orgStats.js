import { logAction } from '../auditLog.js'
import { ValidationError } from '../errors.js'

function validate(input) {
  const fields = ['totalMembers', 'attendanceAvg', 'attendancePeak', 'annualBudget']
  for (const field of fields) {
    const value = input[field]
    if (value == null || Number.isNaN(Number(value)) || Number(value) < 0) {
      return `${field} must be a non-negative number.`
    }
  }
  if (Number(input.attendancePeak) < Number(input.attendanceAvg)) {
    return 'Peak attendance cannot be lower than average attendance.'
  }
  return null
}

function toRecord(row) {
  return {
    totalMembers: row.total_members,
    attendanceAvg: row.attendance_avg,
    attendancePeak: row.attendance_peak,
    annualBudget: Number(row.annual_budget),
    updatedByName: row.updated_by_name,
    updatedAt: row.updated_at,
  }
}

export async function getOrgStats(db) {
  const rows = await db.sql`SELECT * FROM org_stats WHERE id = 1`
  return rows[0] ? toRecord(rows[0]) : null
}

export async function updateOrgStats(db, { input, user }) {
  const validationError = validate(input)
  if (validationError) throw new ValidationError(validationError)

  const rows = await db.sql`
    UPDATE org_stats
    SET total_members = ${input.totalMembers}, attendance_avg = ${input.attendanceAvg},
        attendance_peak = ${input.attendancePeak}, annual_budget = ${input.annualBudget},
        updated_by_id = ${user.id}, updated_by_name = ${user.name}
    WHERE id = 1
    RETURNING *
  `
  const record = toRecord(rows[0])
  await logAction(db, {
    user,
    action: 'updated',
    moduleLabel: 'Settings',
    recordLabel: 'Organization statistics',
  })
  return record
}
