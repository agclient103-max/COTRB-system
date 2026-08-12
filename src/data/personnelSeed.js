import { generateLocalId } from '../utils/recordId.js'

// Every name here is real, from §3.1-3.3 of the blueprint — nothing invented. Contact fields
// (email/phone) are left blank rather than fabricated, since the source data doesn't provide
// them and inventing plausible-looking contact details for real named people isn't appropriate.
// The Associate Vicar role is genuinely vacant per §3.1 ("TBD") — represented honestly as
// vacant rather than assigning a placeholder name.
const RAW = [
  // Leadership (§3.1)
  {
    name: 'Rev. David Asiimwe',
    title: 'Vicar',
    category: 'Clergy',
    ministry: 'Admin, IT & Media, Youth Ministry, 9:30am Service',
    status: 'Active',
  },
  {
    name: null,
    title: 'Associate Vicar',
    category: 'Clergy',
    ministry: 'Family Ministry, Initiations, 7:30am Service',
    status: 'Vacant',
  },
  {
    name: 'Rev. Felix Muhangi',
    title: 'Prayer & Discipleship Lead',
    category: 'Clergy',
    ministry: 'Cell Ministry, Emmanuel Church',
    status: 'Active',
  },
  {
    name: 'Rev. Liberty Muhereza',
    title: 'Worship & Mission Lead',
    category: 'Clergy',
    ministry: '11:30am Service, Mission Ministry',
    status: 'Active',
  },
  {
    name: 'Ord. Susan Kemigisha',
    title: "Children's Ministry Coordinator",
    category: 'Clergy',
    ministry: "Children's Ministry",
    status: 'Active',
  },
  // Parish Council officers (§3.2)
  {
    name: 'Dr. Dennis Nuwagaba',
    title: 'Head of Laity',
    category: 'Council',
    ministry: 'Parish Council',
    status: 'Active',
  },
  {
    name: 'Mr. Paul Tumwesigye',
    title: "Vicar's Warden",
    category: 'Council',
    ministry: 'Parish Council',
    status: 'Active',
  },
  {
    name: 'Mrs. Allen Oworinawe',
    title: 'Parish Council Secretary',
    category: 'Council',
    ministry: 'Parish Council',
    status: 'Active',
  },
  {
    name: 'Mrs. Alona Kemigisha Tugumisirize',
    title: 'Parish Treasurer',
    category: 'Council',
    ministry: 'Parish Council',
    status: 'Active',
  },
  // Ministry Coordinators (§3.3, all 11)
  {
    name: 'Mrs. Dorcas Jurua',
    title: 'Ministry Coordinator',
    category: 'Coordinator',
    ministry: 'Compassion & Care',
    status: 'Active',
  },
  {
    name: 'Dr. Kenneth Mugume',
    title: 'Ministry Coordinator',
    category: 'Coordinator',
    ministry: 'Health & Wellness',
    status: 'Active',
  },
  {
    name: 'Ms. Grace Nabwire',
    title: 'Ministry Coordinator',
    category: 'Coordinator',
    ministry: 'Mission & Evangelism',
    status: 'Active',
  },
  {
    name: 'Mrs. Agnes Odur',
    title: 'Ministry Coordinator',
    category: 'Coordinator',
    ministry: 'Prayer & Intercession',
    status: 'Active',
  },
  {
    name: 'Mr. Leon Tusiime',
    title: 'Ministry Coordinator',
    category: 'Coordinator',
    ministry: 'Youth Ministry (DYF)',
    status: 'Active',
  },
  {
    name: 'Mrs. Abigail Mugume',
    title: 'Ministry Coordinator',
    category: 'Coordinator',
    ministry: "Children's Ministry",
    status: 'Active',
  },
  {
    name: 'Mr. Peter Bakashaba Ruhamiza',
    title: 'Ministry Coordinator',
    category: 'Coordinator',
    ministry: 'Infrastructure & ICT',
    status: 'Active',
  },
  {
    name: 'Mr. Picho Okello Junior',
    title: 'Ministry Coordinator',
    category: 'Coordinator',
    ministry: 'Discipleship & Nurture',
    status: 'Active',
  },
  {
    name: 'Prof. Edith Natukunda Togboa',
    title: 'Ministry Coordinator',
    category: 'Coordinator',
    ministry: 'Education & Projects',
    status: 'Active',
  },
  {
    name: 'Eng. Sam Mugume',
    title: 'Ministry Coordinator',
    category: 'Coordinator',
    ministry: 'Building & Construction',
    status: 'Active',
  },
  {
    name: 'Mrs. Anne Katahoire',
    title: 'Ministry Coordinator',
    category: 'Coordinator',
    ministry: 'Worship & Arts',
    status: 'Active',
  },
]

export const PERSONNEL_SEED = RAW.map((entry, index) => ({
  localId: generateLocalId(),
  sequenceNumber: `PER-2026-${String(index + 1).padStart(3, '0')}`,
  name: entry.name ?? '— Vacant —',
  title: entry.title,
  category: entry.category,
  ministry: entry.ministry,
  status: entry.status,
  email: '',
  phone: '',
  notes: '',
}))
