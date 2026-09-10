import { getDb } from '../functions-lib/db.js'
import { requireUserWithAccess } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import {
  listTransactions,
  createTransaction,
  getFinancialTotals,
} from '../functions-lib/modules/financial.js'
import { canCreate } from '../../src/data/roles.js'

export default async (req) => {
  const db = getDb()
  try {
    if (req.method === 'GET') {
      const user = await requireUserWithAccess('financial', 'read')
      const url = new URL(req.url)
      const [rows, totals] = await Promise.all([
        listTransactions(db, {
          search: url.searchParams.get('search') ?? '',
          type: url.searchParams.get('type') ?? 'all',
          status: url.searchParams.get('status') ?? 'all',
        }),
        getFinancialTotals(db),
      ])
      return jsonResponse({
        transactions: rows,
        totals,
        canCreate: canCreate(user.role, 'financial'),
      })
    }
    if (req.method === 'POST') {
      const user = await requireUserWithAccess('financial', 'create')
      const body = await req.json()
      const record = await createTransaction(db, {
        input: body.input,
        user,
        skipDuplicateCheck: Boolean(body.skipDuplicateCheck),
      })
      return jsonResponse({ transaction: record }, 201)
    }
    return jsonResponse({ error: 'Method not allowed' }, 405)
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/financial' }
