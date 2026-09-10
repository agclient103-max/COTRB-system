import { getDb } from '../functions-lib/db.js'
import { requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { updateDocument, deleteDocument } from '../functions-lib/modules/documents.js'
import { ValidationError } from '../functions-lib/errors.js'

// PUT    /api/documents/:id  — update
// DELETE /api/documents/:id  — delete
export default async (req) => {
  const db = getDb()

  try {
    // Parsed directly from the URL rather than a routing-context param, so this
    // works identically regardless of exactly how Netlify exposes path params.
    const segments = new URL(req.url).pathname.split('/').filter(Boolean)
    const localId = segments[segments.length - 1]
    if (!localId || localId === 'documents') {
      throw new ValidationError('Missing document id in the URL.')
    }

    if (req.method === 'PUT') {
      const user = await requireUserWithAccess('documents', 'update')
      const body = await req.json()
      const record = await updateDocument(db, {
        localId,
        input: body.input,
        user,
        skipDuplicateCheck: Boolean(body.skipDuplicateCheck),
      })
      return jsonResponse({ document: record })
    }

    if (req.method === 'DELETE') {
      const user = await requireUserWithAccess('documents', 'delete')
      await deleteDocument(db, { localId, user })
      return jsonResponse({ success: true })
    }

    return jsonResponse({ error: 'Method not allowed' }, 405)
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/documents/:id' }
