import { admin } from '@netlify/identity'
import { ValidationError, ConflictError } from '../errors.js'
import { ROLES } from '../../../src/data/roles.js'

const VALID_ROLES = Object.values(ROLES)

function toSummary(identityUser) {
  return {
    id: identityUser.id,
    email: identityUser.email,
    name: identityUser.name ?? identityUser.userMetadata?.full_name ?? identityUser.email,
    role: identityUser.roles?.[0] ?? null,
    createdAt: identityUser.createdAt,
    lastSignInAt: identityUser.lastSignInAt,
  }
}

export async function listUsers() {
  const users = await admin.listUsers({ perPage: 200 })
  return users.map(toSummary)
}

/**
 * Roles live in app_metadata.roles (an array), not Identity's generic singular
 * "role" field — matching how requireUser() reads identityUser.roles?.[0]
 * elsewhere, so account creation and role checks always agree on the same
 * source of truth.
 */
export async function createUser({ email, password, name, role }) {
  if (!email || !email.trim()) throw new ValidationError('Email is required.')
  if (!password || password.length < 8) {
    throw new ValidationError('Password must be at least 8 characters.')
  }
  if (!VALID_ROLES.includes(role)) throw new ValidationError('A valid role is required.')

  try {
    const created = await admin.createUser({
      email,
      password,
      data: {
        app_metadata: { roles: [role] },
        user_metadata: { full_name: name || email },
      },
    })
    return toSummary(created)
  } catch (err) {
    if (err.status === 422 || /already/i.test(err.message ?? '')) {
      throw new ConflictError('An account with that email already exists.')
    }
    throw err
  }
}

export async function updateUserRole(userId, role) {
  if (!VALID_ROLES.includes(role)) throw new ValidationError('A valid role is required.')
  const updated = await admin.updateUser(userId, { app_metadata: { roles: [role] } })
  return toSummary(updated)
}

export async function deleteUser(userId) {
  await admin.deleteUser(userId)
}
