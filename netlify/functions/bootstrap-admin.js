import { admin } from '@netlify/identity'
import { jsonResponse, errorResponse } from '../functions-lib/response.js'
import { ValidationError, ForbiddenError, NotFoundError } from '../functions-lib/errors.js'
import { ROLES } from '../../src/data/roles.js'

/**
 * POST /api/bootstrap-admin
 * Body: { email, role, secret }
 *
 * A one-time-use tool for setting a role on an already-existing Identity account,
 * without needing to already be logged in as an admin — the normal /api/users
 * endpoint can't help with the very first account for exactly that reason.
 *
 * Protected by a shared secret (BOOTSTRAP_SECRET env var) rather than a login,
 * since no one can log in yet. Delete this file (or unset the env var) once
 * you've used it — it has no other purpose after your first real admin exists.
 */
/**
 * POST /api/bootstrap-admin
 * Body: { email, role, secret, password? }
 *
 * A one-time-use tool for setting up an Identity account, without needing to
 * already be logged in as an admin — the normal /api/users endpoint can't
 * help with the very first account for exactly that reason.
 *
 * If `password` is provided, it also sets that password directly and marks
 * the account confirmed — sidestepping the normal invite-email flow entirely,
 * for the case where that email was never sent, never arrived, or was never
 * clicked. Without a password, it only updates the role on an account that
 * already has one set some other way.
 *
 * Protected by a shared secret (BOOTSTRAP_SECRET env var) rather than a login,
 * since no one can log in yet. Delete this file (or unset the env var) once
 * you've used it — it has no other purpose after your first real admin exists.
 */
export default async (req) => {
  try {
    if (req.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405)
    }

    const expected = process.env.BOOTSTRAP_SECRET
    if (!expected) {
      throw new ForbiddenError(
        'Bootstrap is not configured. Set BOOTSTRAP_SECRET in your Netlify environment variables first, then redeploy.',
      )
    }

    const body = await req.json()
    const { email, role, secret, password } = body

    if (secret !== expected) {
      throw new ForbiddenError('Invalid bootstrap secret.')
    }
    if (!email || !email.trim()) {
      throw new ValidationError('Email is required.')
    }
    if (!Object.values(ROLES).includes(role)) {
      throw new ValidationError(`Role must be one of: ${Object.values(ROLES).join(', ')}`)
    }
    if (password != null && password.length < 8) {
      throw new ValidationError('Password must be at least 8 characters.')
    }

    const users = await admin.listUsers()
    const user = users.find((u) => u.email?.toLowerCase() === email.toLowerCase())
    if (!user) {
      throw new NotFoundError(
        `No Identity account found for ${email}. Create/confirm the account in Netlify Identity first, then try again.`,
      )
    }

    const updates = { app_metadata: { roles: [role] } }
    if (password != null) {
      updates.password = password
      updates.confirm = true
    }

    const updated = await admin.updateUser(user.id, updates)
    return jsonResponse({
      success: true,
      id: updated.id,
      email: updated.email,
      role: updated.roles?.[0] ?? null,
      passwordSet: password != null,
    })
  } catch (err) {
    return errorResponse(err)
  }
}

export const config = { path: '/api/bootstrap-admin' }
