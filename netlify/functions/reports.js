import { getDb } from '../functions-lib/db.js'
import { requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { listReports, createReport, getReportsSummary } from '../functions-lib/modules/reports.js'
import { canCreate } from '../../src/data/roles.js'

export default async (req) => {
  const db = getDb()
  try {
    if (req.method === 'GET') {
      const user = await requireUserWithAccess('reports', 'read')
      const [rows, summary] = await Promise.all([listReports(db), getReportsSummary(db)])
      return jsonResponse({ reports: rows, summary, canCreate: canCreate(user.role, 'reports') })
    }
    if (req.method === 'POST') {
      const user = await requireUserWithAccess('reports', 'create')
      const body = await req.json()
      const record = await createReport(db, {
        input: body.input,
        user,
        skipDuplicateCheck: Boolean(body.skipDuplicateCheck),
      })
      return jsonResponse({ report: record }, 201)
    }
    return jsonResponse({ error: 'Method not allowed' }, 405)
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/reports' }
