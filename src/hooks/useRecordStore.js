import { useCallback, useEffect, useState } from 'react'
import { putRecord, deleteRecord, seedIfEmpty } from '../db/localDb.js'
import { generateLocalId } from '../utils/recordId.js'
import { useToast } from './useToast.js'

/**
 * storeName: the localDb store name ('documents' | 'personnel' | future modules)
 * seedData: initial records to populate on first-ever load
 * validate(input): returns an error message string, or null if valid
 * findDuplicate(records, input, excludeLocalId?): returns the matching existing record, or null
 * labelOf(record): a short human label for duplicate-warning dialogs
 */
export function useRecordStore({ storeName, seedData, validate, findDuplicate, labelOf }) {
  const { push } = useToast()
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const loaded = await seedIfEmpty(storeName, seedData)
        if (!cancelled) {
          setRecords(loaded)
          setIsLoading(false)
        }
      } catch {
        if (!cancelled) {
          setLoadError('Could not load records. Please refresh the page.')
          setIsLoading(false)
        }
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // storeName/seedData are stable per module instance; this effect is intentionally load-once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  /**
   * Attempts to save a new record. Returns:
   *  - { status: 'duplicate', existing } if a near-duplicate is found (caller shows the dialog)
   *  - { status: 'success' } on success
   *  - { status: 'error', message } on validation or write failure
   */
  const addRecord = useCallback(
    async (input, { skipDuplicateCheck = false } = {}) => {
      const validationError = validate(input)
      if (validationError) {
        return { status: 'error', message: validationError }
      }

      if (!skipDuplicateCheck) {
        const existing = findDuplicate(records, input)
        if (existing) {
          return { status: 'duplicate', existing }
        }
      }

      const record = { ...input, localId: generateLocalId(), sequenceNumber: null }
      try {
        await putRecord(storeName, record)
        setRecords((prev) => [...prev, record])
        push(`${labelOf(record)} added — pending sync.`, { tone: 'success' })
        return { status: 'success' }
      } catch {
        return { status: 'error', message: 'Could not save this record. Please try again.' }
      }
    },
    [records, validate, findDuplicate, storeName, push, labelOf],
  )

  const updateRecord = useCallback(
    async (localId, input) => {
      const validationError = validate(input)
      if (validationError) {
        return { status: 'error', message: validationError }
      }

      const existing = findDuplicate(records, input, localId)
      if (existing) {
        return { status: 'duplicate', existing }
      }

      const current = records.find((r) => r.localId === localId)
      const updated = { ...current, ...input }
      try {
        await putRecord(storeName, updated)
        setRecords((prev) => prev.map((r) => (r.localId === localId ? updated : r)))
        push(`${labelOf(updated)} updated.`, { tone: 'success' })
        return { status: 'success' }
      } catch {
        return { status: 'error', message: 'Could not save these changes. Please try again.' }
      }
    },
    [records, validate, findDuplicate, storeName, push, labelOf],
  )

  const mergeIntoExisting = useCallback(
    async (existingLocalId, incomingInput) => {
      const existing = records.find((r) => r.localId === existingLocalId)
      const merged = {
        ...existing,
        ...incomingInput,
        localId: existing.localId,
        sequenceNumber: existing.sequenceNumber,
      }
      try {
        await putRecord(storeName, merged)
        setRecords((prev) => prev.map((r) => (r.localId === existingLocalId ? merged : r)))
        push(`Merged into ${labelOf(merged)}.`, { tone: 'success' })
        return { status: 'success' }
      } catch {
        return { status: 'error', message: 'Could not merge these records. Please try again.' }
      }
    },
    [records, storeName, push, labelOf],
  )

  const removeRecord = useCallback(
    async (localId) => {
      try {
        await deleteRecord(storeName, localId)
        setRecords((prev) => prev.filter((r) => r.localId !== localId))
        push('Record deleted.', { tone: 'success' })
        return { status: 'success' }
      } catch {
        return { status: 'error', message: 'Could not delete this record. Please try again.' }
      }
    },
    [storeName, push],
  )

  return {
    records,
    isLoading,
    loadError,
    addRecord,
    updateRecord,
    mergeIntoExisting,
    removeRecord,
  }
}
