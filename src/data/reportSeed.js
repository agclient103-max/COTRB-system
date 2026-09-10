import { generateLocalId, daysAgoIso } from '../utils/recordId.js'

const RAW = [
  {
    name: 'August 2026 Giving Summary',
    type: 'Giving Summary',
    createdBy: 'Mrs. Alona Kemigisha Tugumisirize',
    notes: 'Monthly giving vs budget snapshot.',
  },
  {
    name: 'Q3 2026 Membership Report',
    type: 'Membership Summary',
    createdBy: 'Administrator Account',
    notes: '',
  },
  {
    name: 'All-Ministries Activity Report',
    type: 'Ministry Activity',
    createdBy: 'Rev. David Asiimwe',
    notes: 'Coordinator-led areas and fellowship groups.',
  },
]

export const REPORT_SEED = RAW.map((entry, index) => ({
  localId: generateLocalId(),
  sequenceNumber: `RPT-2026-${String(index + 1).padStart(3, '0')}`,
  ...entry,
  createdAt: daysAgoIso(RAW.length - index),
}))
