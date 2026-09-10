import { useCallback, useEffect, useState } from 'react'
import { putRecord, deleteRecord, seedIfEmpty } from '../db/localDb.js'
import { generateLocalId } from '../utils/recordId.js'
import { logAction } from '../utils/auditLog.js'
import { useToast } from './useToast.js'
import { useAuth } from './useAuth.js'

export function useRecordStore({
  storeName,
  moduleLabel,
  seedData,
  validate,
  findDuplicate,
  labelOf,
}) {
  const { push } = useToast()
  const { user } = useAuth()
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

      const record = {
        ...input,
        localId: generateLocalId(),
        sequenceNumber: null,
        createdAt: new Date().toISOString(),
      }
      try {
        await putRecord(storeName, record)
        setRecords((prev) => [...prev, record])
        push(`${labelOf(record)} added — pending sync.`, { tone: 'success' })
        logAction({ user, action: 'created', moduleLabel, recordLabel: labelOf(record) })
        return { status: 'success' }
      } catch {
        return { status: 'error', message: 'Could not save this record. Please try again.' }
      }
    },
    [records, validate, findDuplicate, storeName, moduleLabel, push, labelOf, user],
  )

  const updateRecord = useCallback(
    async (localId, input, { skipDuplicateCheck = false } = {}) => {
      const validationError = validate(input)
      if (validationError) {
        return { status: 'error', message: validationError }
      }

      if (!skipDuplicateCheck) {
        const existing = findDuplicate(records, input, localId)
        if (existing) {
          return { status: 'duplicate', existing }
        }
      }

      const current = records.find((r) => r.localId === localId)
      const updated = { ...current, ...input }
      try {
        await putRecord(storeName, updated)
        setRecords((prev) => prev.map((r) => (r.localId === localId ? updated : r)))
        push(`${labelOf(updated)} updated.`, { tone: 'success' })
        logAction({ user, action: 'updated', moduleLabel, recordLabel: labelOf(updated) })
        return { status: 'success' }
      } catch {
        return { status: 'error', message: 'Could not save these changes. Please try again.' }
      }
    },
    [records, validate, findDuplicate, storeName, moduleLabel, push, labelOf, user],
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
        logAction({ user, action: 'merged', moduleLabel, recordLabel: labelOf(merged) })
        return { status: 'success' }
      } catch {
        return { status: 'error', message: 'Could not merge these records. Please try again.' }
      }
    },
    [records, storeName, moduleLabel, push, labelOf, user],
  )

  const removeRecord = useCallback(
    async (localId) => {
      const current = records.find((r) => r.localId === localId)
      try {
        await deleteRecord(storeName, localId)
        setRecords((prev) => prev.filter((r) => r.localId !== localId))
        push('Record deleted.', { tone: 'success' })
        logAction({
          user,
          action: 'deleted',
          moduleLabel,
          recordLabel: current ? labelOf(current) : 'record',
        })
        return { status: 'success' }
      } catch {
        return { status: 'error', message: 'Could not delete this record. Please try again.' }
      }
    },
    [records, storeName, moduleLabel, push, labelOf, user],
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
