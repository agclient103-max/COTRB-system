import { useRecordStore } from './useRecordStore.js'
import { MINISTRY_SEED } from '../data/ministrySeed.js'

function validate(input) {
  if (!input.name || !input.name.trim()) return 'Ministry name is required.'
  if (!input.category) return 'Category is required.'
  return null
}

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

export function useMinistries() {
  return useRecordStore({
    storeName: 'ministry',
    seedData: MINISTRY_SEED,
    validate,
    findDuplicate,
    labelOf,
  })
}
