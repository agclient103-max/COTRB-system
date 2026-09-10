import { getDb } from '../functions-lib/db.js'
import { requireUser } from '../functions-lib/auth.js'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import {
  getMonthlyGivingAverage,
  getYtdIncome,
  getPendingReviewCount,
} from '../functions-lib/modules/financial.js'
import { getPendingApprovalCount } from '../functions-lib/modules/documents.js'
import { getOrgStats } from '../functions-lib/modules/orgStats.js'
import { hasModuleAccess } from '../../src/data/roles.js'

// A single bundle of the cross-module, live figures the Dashboard (and a
// couple of module pages) need beyond their own module's own data. Each
// figure is only computed if the caller's role could plausibly see it —
// same gating each module's own endpoint uses, just applied per-field here
// since this spans modules. orgStats itself isn't module-gated (it's shown
// to everyone the same way it always was as a static value) — the caller
// decides per-widget whether to display it, same as before.
export default async (req) => {
  const db = getDb()
  try {
    if (req.method !== 'GET') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }
    const user = await requireUser()

    const [
      orgStats,
      monthlyGivingAverage,
      ytdIncome,
      documentsPendingApproval,
      financialPendingReview,
    ] = await Promise.all([
      getOrgStats(db),
      hasModuleAccess(user.role, 'financial') ? getMonthlyGivingAverage(db) : Promise.resolve(null),
      hasModuleAccess(user.role, 'financial') ? getYtdIncome(db) : Promise.resolve(null),
      hasModuleAccess(user.role, 'documents') ? getPendingApprovalCount(db) : Promise.resolve(null),
      hasModuleAccess(user.role, 'financial') ? getPendingReviewCount(db) : Promise.resolve(null),
    ])

    const percentOfBudgetUsed =
      ytdIncome != null && orgStats?.annualBudget
        ? Math.round((ytdIncome / orgStats.annualBudget) * 1000) / 10
        : null

    return jsonResponse({
      orgStats,
      monthlyGivingAverage,
      ytdIncome,
      percentOfBudgetUsed,
      documentsPendingApproval,
      financialPendingReview,
    })
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/dashboard-extras' }
