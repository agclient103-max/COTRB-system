import { ROLES } from './roles.js'

export const MOCK_USERS = [
  {
    id: 'super-admin',
    name: 'System Administrator',
    role: ROLES.SUPER_ADMIN,
    title: 'Full system access',
    group: 'System',
    ministry: null,
  },
  {
    id: 'admin',
    name: 'Administrator Account',
    role: ROLES.ADMIN,
    title: 'Accounts, payroll & personnel records',
    group: 'System',
    ministry: null,
  },
  {
    id: 'clergy-vicar',
    name: 'Rev. David Asiimwe',
    role: ROLES.CLERGY,
    title: 'Vicar — Admin, IT & Media, Youth Ministry',
    group: 'Leadership',
    ministry: null,
  },
  {
    id: 'council-member',
    name: 'Dr. Dennis Nuwagaba',
    role: ROLES.COUNCIL_MEMBER,
    title: 'Head of Laity, Parish Council',
    group: 'Leadership',
    ministry: null,
  },
  {
    id: 'treasurer',
    name: 'Mrs. Alona Kemigisha Tugumisirize',
    role: ROLES.TREASURER,
    title: 'Parish Treasurer',
    group: 'Leadership',
    ministry: null,
  },
  {
    id: 'coordinator',
    name: 'Mrs. Abigail Mugume',
    role: ROLES.MINISTRY_COORDINATOR,
    title: "Children's Ministry Coordinator",
    group: 'Ministry & Staff',
    ministry: "Children's Ministry",
  },
  {
    id: 'staff-secretary',
    name: 'Mrs. Allen Oworinawe',
    role: ROLES.STAFF,
    title: 'Parish Council Secretary',
    group: 'Ministry & Staff',
    ministry: null,
  },
  {
    id: 'member',
    name: 'Congregation Member',
    role: ROLES.MEMBER,
    title: 'Regular congregant account',
    group: 'Congregation',
    ministry: null,
  },
  {
    id: 'guest',
    name: 'Guest Visitor',
    role: ROLES.GUEST,
    title: 'Public / visitor account',
    group: 'Congregation',
    ministry: null,
  },
]

export function findMockUserById(id) {
  return MOCK_USERS.find((u) => u.id === id) ?? null
}
