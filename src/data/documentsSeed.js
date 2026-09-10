import { generateLocalId, daysAgoIso } from '../utils/recordId.js'

const RAW = [
  {
    title: '2026 Parish Budget Proposal',
    category: 'Financial',
    ministry: 'Parish Council',
    status: 'Approved',
  },
  {
    title: 'Parish Council Meeting Minutes — January 2026',
    category: 'Meeting Minutes',
    ministry: 'Parish Council',
    status: 'Approved',
  },
  {
    title: 'Parish Council Meeting Minutes — March 2026',
    category: 'Meeting Minutes',
    ministry: 'Parish Council',
    status: 'Approved',
  },
  {
    title: "Children's Ministry Activity Report — Q1 2026",
    category: 'Report',
    ministry: "Children's Ministry",
    status: 'Approved',
  },
  {
    title: 'Youth Ministry (DYF) BAYC Conference Report',
    category: 'Report',
    ministry: 'Youth Ministry (DYF)',
    status: 'Approved',
  },
  {
    title: 'Emmanuel Church Kasokoso — 2025 Confirmation Register',
    category: 'Register',
    ministry: 'Emmanuel Church Kasokoso',
    status: 'Archived',
  },
  {
    title: 'Building & Construction Project Proposal',
    category: 'Proposal',
    ministry: 'Building & Construction',
    status: 'Pending Approval',
  },
  {
    title: 'Mission Week — End of Year Planning Document',
    category: 'Planning',
    ministry: 'Mission & Evangelism',
    status: 'Draft',
  },
  {
    title: 'Health & Wellness Ministry Policy',
    category: 'Policy',
    ministry: 'Health & Wellness',
    status: 'Approved',
  },
  {
    title: 'Home Cells Facilitator Guidelines',
    category: 'Policy',
    ministry: 'Discipleship & Nurture',
    status: 'Draft',
  },
]

export const DOCUMENTS_SEED = RAW.map((entry, index) => ({
  localId: generateLocalId(),
  sequenceNumber: `DOC-2026-${String(index + 1).padStart(3, '0')}`,
  title: entry.title,
  category: entry.category,
  ministry: entry.ministry,
  status: entry.status,
  fileName: null,
  notes: '',
  createdAt: daysAgoIso(RAW.length - index),
}))
