import { getDb } from '../functions-lib/db.js'
import { requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { listDocuments, createDocument } from '../functions-lib/modules/documents.js'
import { canCreate } from '../../src/data/roles.js'

// GET  /api/documents  — list, filtered by search/category/status query params
// POST /api/documents  — create a new document
export default async (req) => {
  const db = getDb()

  try {
    if (req.method === 'GET') {
      const user = await requireUserWithAccess('documents', 'read')
      const url = new URL(req.url)
      const rows = await listDocuments(db, {
        search: url.searchParams.get('search') ?? '',
        category: url.searchParams.get('category') ?? 'all',
        status: url.searchParams.get('status') ?? 'all',
      })
      return jsonResponse({ documents: rows, canCreate: canCreate(user.role, 'documents') })
    }

    if (req.method === 'POST') {
      const user = await requireUserWithAccess('documents', 'create')
      const body = await req.json()
      const record = await createDocument(db, {
        input: body.input,
        user,
        skipDuplicateCheck: Boolean(body.skipDuplicateCheck),
      })
      return jsonResponse({ document: record }, 201)
    }

    return jsonResponse({ error: 'Method not allowed' }, 405)
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/documents' }
