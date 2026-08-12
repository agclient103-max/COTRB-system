import { useRecordStore } from './useRecordStore.js'
import { DOCUMENTS_SEED } from '../data/documentsSeed.js'

function validate(input) {
  if (!input.title || !input.title.trim()) return 'Title is required.'
  if (!input.category) return 'Category is required.'
  if (!input.ministry) return 'Ministry is required.'
  return null
}

// Field-level near-duplicate check per §9: same title + same ministry, case-insensitive.
// This stands in for hash-based file matching until real file uploads exist with a backend
// to hash against — noted here rather than pretending file-content hashing is happening today.
function findDuplicate(records, input, excludeLocalId) {
  const normalizedTitle = input.title?.trim().toLowerCase()
  return (
    records.find(
      (r) =>
        r.localId !== excludeLocalId &&
        r.title.trim().toLowerCase() === normalizedTitle &&
        r.ministry === input.ministry,
    ) ?? null
  )
}

function labelOf(record) {
  return record.title
}

export function useDocuments() {
  return useRecordStore({
    storeName: 'documents',
    seedData: DOCUMENTS_SEED,
    validate,
    findDuplicate,
    labelOf,
  })
}
