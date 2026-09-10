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

// Each exact permission-level string maps to its exact capability set — an explicit
// lookup, not substring matching. (A prior substring-based implementation checked
// things like level.includes('D') for delete rights, which incorrectly matched the
// word "READ" — R-E-A-D — granting delete rights to read-only roles. Never repeat
// that mistake: add new levels here explicitly rather than pattern-matching on the
// label text.)
const LEVEL_FLAGS = {
  NONE: [],
  READ: ['R'],
  READ_APPROVE: ['R', 'APPROVE'],
  READ_SCOPED: ['R', 'SCOPED'],
  CR: ['C', 'R'],
  CR_SCOPED: ['C', 'R', 'SCOPED'],
  CRU: ['C', 'R', 'U'],
  CRUD: ['C', 'R', 'U', 'D'],
  CRUD_SCOPED: ['C', 'R', 'U', 'D', 'SCOPED'],
  CRUD_APPROVE: ['C', 'R', 'U', 'D', 'APPROVE'],
}

function hasFlag(level, flag) {
  return (LEVEL_FLAGS[level] ?? []).includes(flag)
}

export function hasModuleAccess(role, moduleKey) {
  const level = ACCESS_MATRIX[moduleKey]?.[role]
  return Boolean(level) && level !== 'NONE'
}

export function canCreate(role, moduleKey) {
  return hasFlag(ACCESS_MATRIX[moduleKey]?.[role], 'C')
}

export function canUpdate(role, moduleKey) {
  return hasFlag(ACCESS_MATRIX[moduleKey]?.[role], 'U')
}

export function canDelete(role, moduleKey) {
  return hasFlag(ACCESS_MATRIX[moduleKey]?.[role], 'D')
}

export function canApprove(role, moduleKey) {
  return hasFlag(ACCESS_MATRIX[moduleKey]?.[role], 'APPROVE')
}

export function isScopedToOwn(role, moduleKey) {
  return hasFlag(ACCESS_MATRIX[moduleKey]?.[role], 'SCOPED')
}
