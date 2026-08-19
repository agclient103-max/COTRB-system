import { useRecordStore } from './useRecordStore.js'
import { EVENTS_SEED } from '../data/eventsSeed.js'

function validate(input) {
  if (!input.title || !input.title.trim()) return 'Title is required.'
  if (!input.type) return 'Type is required.'
  if (!input.ministry) return 'Ministry is required.'
  return null
}

function findDuplicate(records, input, excludeLocalId) {
  const normalizedTitle = input.title?.trim().toLowerCase()
  return (
    records.find(
      (r) => r.localId !== excludeLocalId && r.title.trim().toLowerCase() === normalizedTitle,
    ) ?? null
  )
}

function labelOf(record) {
  return record.title
}

export function useEvents() {
  return useRecordStore({
    storeName: 'events',
    seedData: EVENTS_SEED,
    validate,
    findDuplicate,
    labelOf,
  })
}
