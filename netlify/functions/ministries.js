import { getDb } from '../functions-lib/db.js'
import { requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { listMinistries, createMinistry } from '../functions-lib/modules/ministries.js'
import { canCreate } from '../../src/data/roles.js'

export default async (req) => {
  const db = getDb()
  try {
    if (req.method === 'GET') {
      const user = await requireUserWithAccess('ministry', 'read')
      const url = new URL(req.url)
      const rows = await listMinistries(db, {
        search: url.searchParams.get('search') ?? '',
        category: url.searchParams.get('category') ?? 'all',
        status: url.searchParams.get('status') ?? 'all',
      })
      return jsonResponse({ ministries: rows, canCreate: canCreate(user.role, 'ministry') })
    }
    if (req.method === 'POST') {
      const user = await requireUserWithAccess('ministry', 'create')
      const body = await req.json()
      const record = await createMinistry(db, {
        input: body.input,
        user,
        skipDuplicateCheck: Boolean(body.skipDuplicateCheck),
      })
      return jsonResponse({ ministry: record }, 201)
    }
    return jsonResponse({ error: 'Method not allowed' }, 405)
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/ministries' }
