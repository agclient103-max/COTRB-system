import { getDb } from '../functions-lib/db.js'
import { requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { mergeTransaction } from '../functions-lib/modules/financial.js'
import { ValidationError } from '../functions-lib/errors.js'

export default async (req) => {
  const db = getDb()
  try {
    if (req.method !== 'POST') return jsonResponse({ error: 'Method not allowed' }, 405)
    const segments = new URL(req.url).pathname.split('/').filter(Boolean)
    const mergeIndex = segments.indexOf('merge')
    const existingLocalId = mergeIndex > 0 ? segments[mergeIndex - 1] : null
    if (!existingLocalId) throw new ValidationError('Missing transaction id in the URL.')

    const user = await requireUserWithAccess('financial', 'update')
    const body = await req.json()
    const record = await mergeTransaction(db, { existingLocalId, input: body.input, user })
    return jsonResponse({ transaction: record })
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/financial/:id/merge' }
