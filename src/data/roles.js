// The 9 roles, exactly as specified in the blueprint (§6.1).
export const ROLES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  COUNCIL_MEMBER: 'COUNCIL_MEMBER',
  TREASURER: 'TREASURER',
  CLERGY: 'CLERGY',
  MINISTRY_COORDINATOR: 'MINISTRY_COORDINATOR',
  STAFF: 'STAFF',
  MEMBER: 'MEMBER',
  GUEST: 'GUEST',
}

export const ROLE_LABELS = {
  [ROLES.SUPER_ADMIN]: 'Super Admin',
  [ROLES.ADMIN]: 'Church Administrator',
  [ROLES.COUNCIL_MEMBER]: 'Council Member',
  [ROLES.TREASURER]: 'Treasurer',
  [ROLES.CLERGY]: 'Clergy / Vicar',
  [ROLES.MINISTRY_COORDINATOR]: 'Ministry Coordinator',
  [ROLES.STAFF]: 'Staff / Secretary',
  [ROLES.MEMBER]: 'Member',
  [ROLES.GUEST]: 'Guest',
}

export const MODULES = [
  'documents',
  'ministry',
  'personnel',
  'financial',
  'events',
  'reports',
  'settings',
]

export const MODULE_LABELS = {
  documents: 'Documents',
  ministry: 'Ministry',
  personnel: 'Personnel',
  financial: 'Financial',
  events: 'Events',
  reports: 'Reports',
  settings: 'Settings',
}

// The exact module access matrix from §6.2 of the blueprint.
// Values: CRUD_APPROVE, CRUD, READ_APPROVE, READ, CR, CRU, NONE.
// A trailing "_SCOPED" entry means access is limited to items/ministries
// assigned to that specific user — never the full module (the "*" in §6.2).
export const ACCESS_MATRIX = {
  documents: {
    [ROLES.SUPER_ADMIN]: 'CRUD_APPROVE',
    [ROLES.ADMIN]: 'CRUD',
    [ROLES.COUNCIL_MEMBER]: 'READ_APPROVE',
    [ROLES.TREASURER]: 'READ',
    [ROLES.CLERGY]: 'CRUD_APPROVE',
    [ROLES.MINISTRY_COORDINATOR]: 'CR_SCOPED',
    [ROLES.STAFF]: 'CRU',
    [ROLES.MEMBER]: 'NONE',
    [ROLES.GUEST]: 'NONE',
  },
  ministry: {
    [ROLES.SUPER_ADMIN]: 'CRUD',
    [ROLES.ADMIN]: 'READ',
    [ROLES.COUNCIL_MEMBER]: 'CRU',
    [ROLES.TREASURER]: 'READ',
    [ROLES.CLERGY]: 'CRUD',
    [ROLES.MINISTRY_COORDINATOR]: 'CRUD_SCOPED',
    [ROLES.STAFF]: 'READ',
    [ROLES.MEMBER]: 'NONE',
    [ROLES.GUEST]: 'NONE',
  },
  personnel: {
    [ROLES.SUPER_ADMIN]: 'CRUD',
    [ROLES.ADMIN]: 'CRUD',
    [ROLES.COUNCIL_MEMBER]: 'READ',
    [ROLES.TREASURER]: 'READ',
    [ROLES.CLERGY]: 'CRU',
    [ROLES.MINISTRY_COORDINATOR]: 'READ',
    [ROLES.STAFF]: 'READ',
    [ROLES.MEMBER]: 'NONE',
    [ROLES.GUEST]: 'NONE',
  },
  financial: {
    [ROLES.SUPER_ADMIN]: 'CRUD',
    [ROLES.ADMIN]: 'CRUD',
    [ROLES.COUNCIL_MEMBER]: 'READ',
    [ROLES.TREASURER]: 'CRUD',
    [ROLES.CLERGY]: 'READ',
    [ROLES.MINISTRY_COORDINATOR]: 'READ',
    [ROLES.STAFF]: 'READ',
    [ROLES.MEMBER]: 'NONE',
    [ROLES.GUEST]: 'NONE',
  },
  events: {
    [ROLES.SUPER_ADMIN]: 'CRUD',
    [ROLES.ADMIN]: 'CRUD',
    [ROLES.COUNCIL_MEMBER]: 'CRU',
    [ROLES.TREASURER]: 'READ',
    [ROLES.CLERGY]: 'CRUD',
    [ROLES.MINISTRY_COORDINATOR]: 'CRUD_SCOPED',
    [ROLES.STAFF]: 'CR',
    [ROLES.MEMBER]: 'READ',
    [ROLES.GUEST]: 'READ',
  },
  reports: {
    [ROLES.SUPER_ADMIN]: 'CRUD',
    [ROLES.ADMIN]: 'CRUD',
    [ROLES.COUNCIL_MEMBER]: 'READ',
    [ROLES.TREASURER]: 'CRUD',
    [ROLES.CLERGY]: 'READ',
    [ROLES.MINISTRY_COORDINATOR]: 'READ_SCOPED',
    [ROLES.STAFF]: 'READ',
    [ROLES.MEMBER]: 'NONE',
    [ROLES.GUEST]: 'NONE',
  },
  settings: {
    [ROLES.SUPER_ADMIN]: 'CRUD',
    [ROLES.ADMIN]: 'CRU',
    [ROLES.COUNCIL_MEMBER]: 'NONE',
    [ROLES.TREASURER]: 'NONE',
    [ROLES.CLERGY]: 'READ',
    [ROLES.MINISTRY_COORDINATOR]: 'NONE',
    [ROLES.STAFF]: 'NONE',
    [ROLES.MEMBER]: 'NONE',
    [ROLES.GUEST]: 'NONE',
  },
}

/**
 * Returns true if the given permission level grants any access at all.
 * Real enforcement (which actions are allowed, and server-side re-checking)
 * arrives with the modules in Phase 5+ and, eventually, the Express API layer.
 * This helper exists now only so Phase 2 navigation can hide modules a role
 * has zero access to.
 */
export function hasModuleAccess(role, moduleKey) {
  const level = ACCESS_MATRIX[moduleKey]?.[role]
  return Boolean(level) && level !== 'NONE'
}
