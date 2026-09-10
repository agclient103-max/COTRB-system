import { getDb } from '../functions-lib/db.js'
import { requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { listPersonnel, createPersonnel } from '../functions-lib/modules/personnel.js'
import { canCreate } from '../../src/data/roles.js'

export default async (req) => {
  const db = getDb()
  try {
    if (req.method === 'GET') {
      const user = await requireUserWithAccess('personnel', 'read')
      const url = new URL(req.url)
      const rows = await listPersonnel(db, {
        search: url.searchParams.get('search') ?? '',
        category: url.searchParams.get('category') ?? 'all',
        status: url.searchParams.get('status') ?? 'all',
      })
      return jsonResponse({ personnel: rows, canCreate: canCreate(user.role, 'personnel') })
    }
    if (req.method === 'POST') {
      const user = await requireUserWithAccess('personnel', 'create')
      const body = await req.json()
      const record = await createPersonnel(db, {
        input: body.input,
        user,
        skipDuplicateCheck: Boolean(body.skipDuplicateCheck),
      })
      return jsonResponse({ person: record }, 201)
    }
    return jsonResponse({ error: 'Method not allowed' }, 405)
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/personnel' }
