import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '../api/client.js'
import { useToast } from './useToast.js'

/**
 * The API-backed twin of the old useRecordStore (IndexedDB). Deliberately
 * exposes the identical shape — records, isLoading, loadError, addRecord,
 * updateRecord, mergeIntoExisting, removeRecord, with the same
 * success/duplicate/error result contract — so none of the 6 module page
 * components needed to change when the backend went live. Only the six
 * thin per-module hooks (useDocuments, usePersonnel, etc.) changed, to point
 * at this instead of the old local-storage version.
 *
 * basePath: e.g. '/api/documents'
 * listKey: the array's key in the GET response, e.g. 'documents'
 * itemKey: the single record's key in POST/PUT/merge responses, e.g. 'document'
 * labelOf: (record) => short human label, for success toasts
 */
export function useApiRecordStore({
  basePath,
  listKey,
  itemKey,
  labelOf,
  extraKeys = [],
  enabled = true,
}) {
  const { push } = useToast()
  const [records, setRecords] = useState([])
  const [extras, setExtras] = useState({})
  const [isLoading, setIsLoading] = useState(enabled)
  const [loadError, setLoadError] = useState(null)

  useEffect(() => {
    function skipLoad() {
      setIsLoading(false)
    }
    // Hooks can't be called conditionally, but the fetch itself can be skipped —
    // avoids an API call that would only come back 403 anyway for a role with no
    // access to this module (the server enforces this regardless either way; this
    // is purely about not making a pointless request the UI won't even show).
    if (!enabled) {
      skipLoad()
      return undefined
    }
    let cancelled = false
    async function load() {
      try {
        const body = await api.get(basePath)
        if (!cancelled) {
          setRecords(body[listKey])
          if (extraKeys.length > 0) {
            const picked = {}
            extraKeys.forEach((key) => {
              picked[key] = body[key]
            })
            setExtras(picked)
          }
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
  }, [enabled])

  const addRecord = useCallback(
    async (input, { skipDuplicateCheck = false } = {}) => {
      try {
        const body = await api.post(basePath, { input, skipDuplicateCheck })
        const record = body[itemKey]
        setRecords((prev) => [record, ...prev])
        push(`${labelOf(record)} added.`, { tone: 'success' })
        return { status: 'success' }
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          return { status: 'duplicate', existing: err.payload.existing }
        }
        return { status: 'error', message: err.message }
      }
    },
    [basePath, itemKey, labelOf, push],
  )

  const updateRecord = useCallback(
    async (localId, input, { skipDuplicateCheck = false } = {}) => {
      try {
        const body = await api.put(`${basePath}/${localId}`, { input, skipDuplicateCheck })
        const record = body[itemKey]
        setRecords((prev) => prev.map((r) => (r.localId === localId ? record : r)))
        push(`${labelOf(record)} updated.`, { tone: 'success' })
        return { status: 'success' }
      } catch (err) {
        if (err instanceof ApiError && err.status === 409) {
          return { status: 'duplicate', existing: err.payload.existing }
        }
        return { status: 'error', message: err.message }
      }
    },
    [basePath, itemKey, labelOf, push],
  )

  const mergeIntoExisting = useCallback(
    async (existingLocalId, input) => {
      try {
        const body = await api.post(`${basePath}/${existingLocalId}/merge`, { input })
        const record = body[itemKey]
        setRecords((prev) => prev.map((r) => (r.localId === existingLocalId ? record : r)))
        push(`Merged into ${labelOf(record)}.`, { tone: 'success' })
        return { status: 'success' }
      } catch (err) {
        return { status: 'error', message: err.message }
      }
    },
    [basePath, itemKey, labelOf, push],
  )

  const removeRecord = useCallback(
    async (localId) => {
      try {
        await api.delete(`${basePath}/${localId}`)
        setRecords((prev) => prev.filter((r) => r.localId !== localId))
        push('Record deleted.', { tone: 'success' })
        return { status: 'success' }
      } catch (err) {
        return { status: 'error', message: err.message }
      }
    },
    [basePath, push],
  )

  /**
   * Splices an already-fetched record into local state without a network call.
   * Used for sub-resources that have their own dedicated endpoints (e.g. an
   * event's attendees) — after that endpoint returns the updated parent
   * record, this keeps the list in sync without a full refetch.
   */
  const replaceRecord = useCallback((record) => {
    setRecords((prev) => prev.map((r) => (r.localId === record.localId ? record : r)))
  }, [])

  return {
    records,
    isLoading,
    loadError,
    addRecord,
    updateRecord,
    mergeIntoExisting,
    removeRecord,
    replaceRecord,
    ...extras,
  }
}
