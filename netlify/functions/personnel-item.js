import { getDb } from '../functions-lib/db.js'
import { requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { updatePersonnel, deletePersonnel } from '../functions-lib/modules/personnel.js'
import { ValidationError } from '../functions-lib/errors.js'

export default async (req) => {
  const db = getDb()
  try {
    const segments = new URL(req.url).pathname.split('/').filter(Boolean)
    const localId = segments[segments.length - 1]
    if (!localId || localId === 'personnel')
      throw new ValidationError('Missing person id in the URL.')

    if (req.method === 'PUT') {
      const user = await requireUserWithAccess('personnel', 'update')
      const body = await req.json()
      const record = await updatePersonnel(db, {
        localId,
        input: body.input,
        user,
        skipDuplicateCheck: Boolean(body.skipDuplicateCheck),
      })
      return jsonResponse({ person: record })
    }
    if (req.method === 'DELETE') {
      const user = await requireUserWithAccess('personnel', 'delete')
      await deletePersonnel(db, { localId, user })
      return jsonResponse({ success: true })
    }
    return jsonResponse({ error: 'Method not allowed' }, 405)
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/personnel/:id' }
