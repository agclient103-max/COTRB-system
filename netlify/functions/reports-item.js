import { getDb } from '../functions-lib/db.js'
import { requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { updateReport, deleteReport } from '../functions-lib/modules/reports.js'
import { ValidationError } from '../functions-lib/errors.js'

export default async (req) => {
  const db = getDb()
  try {
    const segments = new URL(req.url).pathname.split('/').filter(Boolean)
    const localId = segments[segments.length - 1]
    if (!localId || localId === 'reports')
      throw new ValidationError('Missing report id in the URL.')

    if (req.method === 'PUT') {
      const user = await requireUserWithAccess('reports', 'update')
      const body = await req.json()
      const record = await updateReport(db, {
        localId,
        input: body.input,
        user,
        skipDuplicateCheck: Boolean(body.skipDuplicateCheck),
      })
      return jsonResponse({ report: record })
    }
    if (req.method === 'DELETE') {
      const user = await requireUserWithAccess('reports', 'delete')
      await deleteReport(db, { localId, user })
      return jsonResponse({ success: true })
    }
    return jsonResponse({ error: 'Method not allowed' }, 405)
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/reports/:id' }
