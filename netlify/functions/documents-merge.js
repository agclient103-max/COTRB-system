import { getDb } from '../functions-lib/db.js'
import { requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { mergeDocument } from '../functions-lib/modules/documents.js'
import { ValidationError } from '../functions-lib/errors.js'

// POST /api/documents/:id/merge — merge incoming data into an existing record,
// per §9's duplicate-resolution flow (the "Merge into existing" choice).
export default async (req) => {
  const db = getDb()

  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const segments = new URL(req.url).pathname.split('/').filter(Boolean)
    const mergeIndex = segments.indexOf('merge')
    const existingLocalId = mergeIndex > 0 ? segments[mergeIndex - 1] : null
    if (!existingLocalId) {
      throw new ValidationError('Missing document id in the URL.')
    }

    const user = await requireUserWithAccess('documents', 'update')
    const body = await req.json()
    const record = await mergeDocument(db, { existingLocalId, input: body.input, user })
    return jsonResponse({ document: record })
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/documents/:id/merge' }
