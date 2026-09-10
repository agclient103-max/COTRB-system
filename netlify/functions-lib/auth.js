import { getUser } from '@netlify/identity'
import {
  hasModuleAccess,
  canCreate,
  canUpdate,
  canDelete,
  canApprove,
} from '../../src/data/roles.js'
import { UnauthorizedError, ForbiddenError } from './errors.js'

/**
 * Every module's write endpoints call this first. It re-derives the caller's
 * role from the verified Identity JWT — never trusts a role sent in the
 * request body — and checks it against the exact same §6.2 matrix the
 * frontend already uses (imported directly from src/data/roles.js, not
 * duplicated), so there is exactly one place this matrix is ever defined.
 * This is the server-side enforcement the blueprint explicitly required:
 * client-side hiding was never enough on its own.
 */
export async function requireUser() {
  const identityUser = await getUser()
  if (!identityUser) {
    throw new UnauthorizedError()
  }

  const role = identityUser.roles?.[0]
  if (!role) {
    throw new ForbiddenError('Your account has no role assigned. Contact an administrator.')
  }

  const name =
    identityUser.name ||
    identityUser.userMetadata?.full_name ||
    identityUser.email ||
    'Unknown user'

  return { id: identityUser.id, email: identityUser.email, name, role }
}

const ACTION_CHECKS = {
  read: hasModuleAccess,
  create: canCreate,
  update: canUpdate,
  delete: canDelete,
  approve: canApprove,
}

/** Throws ForbiddenError unless the user's role has the given right on the given module. */
export function requireAccess(user, moduleKey, action) {
  const check = ACTION_CHECKS[action]
  if (!check) {
    throw new Error(`Unknown RBAC action "${action}"`)
  }
  if (!check(user.role, moduleKey)) {
    throw new ForbiddenError(
      `Your role (${user.role}) does not have ${action} access to ${moduleKey}.`,
    )
  }
}

/** Convenience: fetch the user and immediately check one permission. */
export async function requireUserWithAccess(moduleKey, action) {
  const user = await requireUser()
  requireAccess(user, moduleKey, action)
  return user
}
