import { useCallback, useEffect, useState } from 'react'
import { api, ApiError } from '../api/client.js'
import { getAllRecords, putRecord, deleteRecord } from '../db/localDb.js'
import { enqueueSync, getQueueForModule, removeQueueEntry } from '../utils/syncQueue.js'
import { onSyncEvent, flushModuleQueue, notifySyncChange } from '../utils/syncEngine.js'
import { generateLocalId } from '../utils/recordId.js'
import { useToast } from './useToast.js'

/**
 * The offline-capable twin of useApiRecordStore, with the identical external
 * shape (records, isLoading, loadError, addRecord, updateRecord,
 * mergeIntoExisting, removeRecord) plus sync-specific extras (isOnline,
 * pendingCount, conflictCount). Every write tries the real API first — this
 * behaves exactly like the online-only version for the common case. Only a
 * genuine network failure (fetch itself throwing, not a 4xx/5xx response)
 * falls back to writing locally and queuing the operation for later.
 */
export function useSyncedRecordStore(
  moduleKey,
  { basePath, listKey, itemKey, labelOf, enabled = true },
) {
  const { push } = useToast()
  const [records, setRecords] = useState([])
  const [isLoading, setIsLoading] = useState(enabled)
  const [loadError, setLoadError] = useState(null)
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true,
  )
  const [pendingCount, setPendingCount] = useState(0)
  const [conflictCount, setConflictCount] = useState(0)

  const refreshQueueCounts = useCallback(async () => {
    const moduleQueue = await getQueueForModule(moduleKey)
    setPendingCount(moduleQueue.filter((e) => e.status === 'pending').length)
    setConflictCount(moduleQueue.filter((e) => e.status === 'conflict').length)
  }, [moduleKey])

  const refreshFromCache = useCallback(async () => {
    const cached = await getAllRecords(moduleKey)
    setRecords(cached)
  }, [moduleKey])

  // Initial load: show whatever's cached immediately, then refresh from the
  // server if online. Records with an unsynced local change are left alone
  // during reconciliation so an offline edit is never silently overwritten
  // by a stale server read.
  useEffect(() => {
    function skipLoad() {
      setIsLoading(false)
    }
    if (!enabled) {
      skipLoad()
      return undefined
    }
    let cancelled = false
    async function load() {
      try {
        const cached = await getAllRecords(moduleKey)
        if (!cancelled) {
          setRecords(cached)
          if (cached.length > 0) setIsLoading(false)
        }
      } catch {
        // cache read failed — fall through to the network attempt below
      }

      if (typeof navigator !== 'undefined' && navigator.onLine) {
        try {
          const body = await api.get(basePath)
          const serverRecords = body[listKey]
          if (!cancelled) {
            const queue = await getQueueForModule(moduleKey)
            const pendingLocalIds = new Set(queue.map((e) => e.recordLocalId))
            for (const rec of serverRecords) {
              if (!pendingLocalIds.has(rec.localId)) {
                await putRecord(moduleKey, rec)
              }
            }
            if (!cancelled) await refreshFromCache()
          }
        } catch {
          if (!cancelled && records.length === 0) {
            setLoadError(
              'Could not load records. Showing what was last saved on this device, if anything.',
            )
          }
        }
      }

      if (!cancelled) {
        setIsLoading(false)
        await refreshQueueCounts()
      }
    }
    load()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey, enabled])

  // Stay in sync with the background engine (which may flush this module's
  // queue while a different page is mounted) and with browser connectivity.
  useEffect(() => {
    const unsubscribe = onSyncEvent((changedModule) => {
      if (changedModule === moduleKey) {
        refreshFromCache()
        refreshQueueCounts()
      }
    })
    function handleOnline() {
      setIsOnline(true)
      flushModuleQueue(moduleKey).then(() => {
        refreshFromCache()
        refreshQueueCounts()
      })
    }
    function handleOffline() {
      setIsOnline(false)
    }
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      unsubscribe()
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [moduleKey, refreshFromCache, refreshQueueCounts])

  const addRecord = useCallback(
    async (input, { skipDuplicateCheck = false } = {}) => {
      if (isOnline) {
        try {
          const body = await api.post(basePath, { input, skipDuplicateCheck })
          const record = body[itemKey]
          await putRecord(moduleKey, record)
          setRecords((prev) => [record, ...prev])
          push(`${labelOf(record)} added.`, { tone: 'success' })
          return { status: 'success' }
        } catch (err) {
          if (err instanceof ApiError) {
            if (err.status === 409) return { status: 'duplicate', existing: err.payload.existing }
            return { status: 'error', message: err.message }
          }
          // Not an ApiError — the fetch itself failed. Fall through to the
          // offline path below rather than reporting a false error.
        }
      }

      // Offline path: save locally with a local id and no sequence number yet
      // (the "Pending sync" badge already understands this), queue the real
      // create for later. Duplicate detection is deferred to the server at
      // sync time — there's no reliable way to run it against data that may
      // not even be cached on this device yet.
      const record = {
        ...input,
        localId: generateLocalId(),
        sequenceNumber: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
      await putRecord(moduleKey, record)
      await enqueueSync({
        module: moduleKey,
        operation: 'create',
        recordLocalId: record.localId,
        input,
      })
      setRecords((prev) => [record, ...prev])
      await refreshQueueCounts()
      notifySyncChange(moduleKey)
      push(`${labelOf(record)} saved on this device — will sync once you're back online.`, {
        tone: 'info',
      })
      return { status: 'success' }
    },
    [isOnline, basePath, itemKey, moduleKey, labelOf, push, refreshQueueCounts],
  )

  const updateRecord = useCallback(
    async (localId, input, { skipDuplicateCheck = false } = {}) => {
      if (isOnline) {
        try {
          const body = await api.put(`${basePath}/${localId}`, { input, skipDuplicateCheck })
          const record = body[itemKey]
          await putRecord(moduleKey, record)
          setRecords((prev) => prev.map((r) => (r.localId === localId ? record : r)))
          push(`${labelOf(record)} updated.`, { tone: 'success' })
          return { status: 'success' }
        } catch (err) {
          if (err instanceof ApiError) {
            if (err.status === 409) return { status: 'duplicate', existing: err.payload.existing }
            return { status: 'error', message: err.message }
          }
        }
      }

      // Offline path. If this record was itself created offline and hasn't
      // synced yet, there's no server-side record to PUT to — just update
      // the still-pending create's queued input in place instead of adding
      // a second, doomed operation.
      const existingQueue = await getQueueForModule(moduleKey)
      const pendingCreate = existingQueue.find(
        (e) => e.recordLocalId === localId && e.operation === 'create' && e.status === 'pending',
      )
      const current = records.find((r) => r.localId === localId)
      const updated = { ...current, ...input, updatedAt: new Date().toISOString() }
      await putRecord(moduleKey, updated)

      if (pendingCreate) {
        await enqueueSync({
          module: moduleKey,
          operation: 'create',
          recordLocalId: localId,
          input: { ...pendingCreate.input, ...input },
        })
        await removeQueueEntry(pendingCreate.localId)
      } else {
        await enqueueSync({ module: moduleKey, operation: 'update', recordLocalId: localId, input })
      }

      setRecords((prev) => prev.map((r) => (r.localId === localId ? updated : r)))
      await refreshQueueCounts()
      notifySyncChange(moduleKey)
      push(`${labelOf(updated)} saved on this device — will sync once you're back online.`, {
        tone: 'info',
      })
      return { status: 'success' }
    },
    [isOnline, basePath, itemKey, moduleKey, labelOf, push, records, refreshQueueCounts],
  )

  const mergeIntoExisting = useCallback(
    async (existingLocalId, input) => {
      if (isOnline) {
        try {
          const body = await api.post(`${basePath}/${existingLocalId}/merge`, { input })
          const record = body[itemKey]
          await putRecord(moduleKey, record)
          setRecords((prev) => prev.map((r) => (r.localId === existingLocalId ? record : r)))
          push(`Merged into ${labelOf(record)}.`, { tone: 'success' })
          return { status: 'success' }
        } catch (err) {
          return {
            status: 'error',
            message:
              err instanceof ApiError
                ? err.message
                : 'You appear to be offline. Try again once you\u2019re back online.',
          }
        }
      }
      return {
        status: 'error',
        message: 'Merging requires an internet connection. Try again once you\u2019re back online.',
      }
    },
    [isOnline, basePath, itemKey, moduleKey, labelOf, push],
  )

  const removeRecord = useCallback(
    async (localId) => {
      if (isOnline) {
        try {
          await api.delete(`${basePath}/${localId}`)
          await deleteRecord(moduleKey, localId)
          setRecords((prev) => prev.filter((r) => r.localId !== localId))
          push('Record deleted.', { tone: 'success' })
          return { status: 'success' }
        } catch (err) {
          if (err instanceof ApiError) {
            return { status: 'error', message: err.message }
          }
        }
      }

      // Offline path. If it was only ever a local, unsynced creation, there's
      // nothing to tell the server — just drop it entirely, here and now.
      const existingQueue = await getQueueForModule(moduleKey)
      const pendingCreate = existingQueue.find(
        (e) => e.recordLocalId === localId && e.operation === 'create' && e.status === 'pending',
      )
      if (pendingCreate) {
        await removeQueueEntry(pendingCreate.localId)
      } else {
        await enqueueSync({ module: moduleKey, operation: 'delete', recordLocalId: localId })
      }
      await deleteRecord(moduleKey, localId)
      setRecords((prev) => prev.filter((r) => r.localId !== localId))
      await refreshQueueCounts()
      notifySyncChange(moduleKey)
      push('Deleted on this device — will sync once you\u2019re back online.', { tone: 'info' })
      return { status: 'success' }
    },
    [isOnline, basePath, moduleKey, push, refreshQueueCounts],
  )

  return {
    records,
    isLoading,
    loadError,
    addRecord,
    updateRecord,
    mergeIntoExisting,
    removeRecord,
    isOnline,
    pendingCount,
    conflictCount,
  }
}
