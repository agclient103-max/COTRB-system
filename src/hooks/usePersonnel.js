import { useRecordStore } from './useRecordStore.js'
import { PERSONNEL_SEED } from '../data/personnelSeed.js'

function validate(input) {
  if (!input.name || !input.name.trim()) return 'Name is required.'
  if (!input.title || !input.title.trim()) return 'Role/title is required.'
  return null
}

// Near-duplicate per §9: same name, case-insensitive — the realistic case being the same
// person entered twice by two different data-entry staff.
function findDuplicate(records, input, excludeLocalId) {
  const normalizedName = input.name?.trim().toLowerCase()
  return (
    records.find(
      (r) => r.localId !== excludeLocalId && r.name.trim().toLowerCase() === normalizedName,
    ) ?? null
  )
}

function labelOf(record) {
  return record.name
}

export function usePersonnel() {
  return useRecordStore({
    storeName: 'personnel',
    seedData: PERSONNEL_SEED,
    validate,
    findDuplicate,
    labelOf,
  })
}
