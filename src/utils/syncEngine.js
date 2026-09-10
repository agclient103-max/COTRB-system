import { api, ApiError } from '../api/client.js'
import { putRecord, deleteRecord } from '../db/localDb.js'
import { getQueue, getQueueForModule, markQueueEntry, removeQueueEntry } from './syncQueue.js'
import { SYNC_MODULES } from '../data/syncModules.js'

// Lightweight pub-sub so a currently-mounted page's hook can refresh instantly
// when the background engine changes its module's data — without needing a
// full page reload or waiting for the next mount.
const listeners = new Set()
export function onSyncEvent(callback) {
  listeners.add(callback)
  return () => listeners.delete(callback)
}
function emit(moduleKey) {
  listeners.forEach((cb) => cb(moduleKey))
}
/** Exposed so callers elsewhere (e.g. useSyncedRecordStore, right after
 * queuing a new offline write) can trigger the same "something changed"
 * notification that flushes and conflict resolutions already emit. */
export const notifySyncChange = emit

// Multiple things can ask to flush the same module at once (the global
// reconnect listener, a mounted page's own listener, a manual "try syncing
// now" click). Without this, two concurrent flushes of the same module can
// each pick up the same pending entry and post it twice before either has
// removed it from the queue. Concurrent callers share one in-flight promise
// instead of each independently racing through the queue.
const inFlightFlushes = new Map()

export function flushModuleQueue(moduleKey) {
  if (inFlightFlushes.has(moduleKey)) {
    return inFlightFlushes.get(moduleKey)
  }
  const promise = doFlushModuleQueue(moduleKey).finally(() => {
    inFlightFlushes.delete(moduleKey)
  })
  inFlightFlushes.set(moduleKey, promise)
  return promise
}

async function doFlushModuleQueue(moduleKey) {
  const config = SYNC_MODULES[moduleKey]
  if (!config) return false

  const queue = await getQueueForModule(moduleKey)
  let changed = false

  for (const entry of queue) {
    if (entry.status !== 'pending') continue

    try {
      if (entry.operation === 'create') {
        const body = await api.post(config.basePath, {
          input: entry.input,
          skipDuplicateCheck: false,
        })
        const record = body[config.itemKey]
        await deleteRecord(moduleKey, entry.recordLocalId)
        await putRecord(moduleKey, record)
        await removeQueueEntry(entry.localId)
        changed = true
      } else if (entry.operation === 'update') {
        const body = await api.put(`${config.basePath}/${entry.recordLocalId}`, {
          input: entry.input,
          skipDuplicateCheck: false,
        })
        const record = body[config.itemKey]
        await putRecord(moduleKey, record)
        await removeQueueEntry(entry.localId)
        changed = true
      } else if (entry.operation === 'delete') {
        try {
          await api.delete(`${config.basePath}/${entry.recordLocalId}`)
        } catch (err) {
          // Already gone server-side (someone else deleted it too) — that's
          // still the outcome we wanted, not a real conflict.
          if (!(err instanceof ApiError && err.status === 404)) throw err
        }
        await deleteRecord(moduleKey, entry.recordLocalId)
        await removeQueueEntry(entry.localId)
        changed = true
      } else if (entry.operation === 'merge') {
        const body = await api.post(`${config.basePath}/${entry.mergeTargetLocalId}/merge`, {
          input: entry.input,
        })
        const record = body[config.itemKey]
        await deleteRecord(moduleKey, entry.recordLocalId)
        await putRecord(moduleKey, record)
        await removeQueueEntry(entry.localId)
        changed = true
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        await markQueueEntry(entry.localId, {
          status: 'conflict',
          errorMessage: err.message,
          conflictPayload: err.payload ?? null,
        })
        changed = true
      } else if (err instanceof ApiError && err.status === 404 && entry.operation !== 'create') {
        await markQueueEntry(entry.localId, {
          status: 'conflict',
          errorMessage: 'This record was deleted by someone else before your change could sync.',
        })
        changed = true
      } else if (err instanceof ApiError) {
        await markQueueEntry(entry.localId, { status: 'error', errorMessage: err.message })
        changed = true
      } else {
        // Genuine network failure — still offline. Stop here; the rest of
        // this module's queue will be retried on the next flush attempt.
        break
      }
    }
  }

  if (changed) emit(moduleKey)
  return changed
}

export async function flushAllQueues() {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return
  for (const moduleKey of Object.keys(SYNC_MODULES)) {
    await flushModuleQueue(moduleKey)
  }
}

export async function getSyncSummary() {
  const queue = await getQueue()
  return {
    pendingCount: queue.filter((e) => e.status === 'pending').length,
    conflicts: queue.filter((e) => e.status === 'conflict'),
    errors: queue.filter((e) => e.status === 'error'),
  }
}

/**
 * A human resolving a conflict from the Settings > Sync screen. Three
 * possible actions:
 *  - 'discard': drop the local change entirely, defer to the server's version
 *  - 'retry-force': push the local change through anyway (skips dedup)
 *  - 'merge': merge the local change into the record the server pointed at
 */
export async function resolveConflict(queueLocalId, action) {
  const queue = await getQueue()
  const entry = queue.find((e) => e.localId === queueLocalId)
  if (!entry) return { status: 'error', message: 'That queued change no longer exists.' }
  const config = SYNC_MODULES[entry.module]

  if (action === 'discard') {
    if (entry.operation === 'create') {
      await deleteRecord(entry.module, entry.recordLocalId)
    } else {
      try {
        const body = await api.get(config.basePath)
        const serverRecord = body[config.listKey].find((r) => r.localId === entry.recordLocalId)
        if (serverRecord) {
          await putRecord(entry.module, serverRecord)
        } else {
          await deleteRecord(entry.module, entry.recordLocalId)
        }
      } catch {
        // Best effort — if we can't reach the server right now, leave the
        // cache as-is; the next successful refresh will correct it.
      }
    }
    await removeQueueEntry(entry.localId)
    emit(entry.module)
    return { status: 'success' }
  }

  if (action === 'retry-force') {
    try {
      let record
      if (entry.operation === 'create') {
        const body = await api.post(config.basePath, {
          input: entry.input,
          skipDuplicateCheck: true,
        })
        record = body[config.itemKey]
        await deleteRecord(entry.module, entry.recordLocalId)
      } else if (entry.operation === 'update') {
        const body = await api.put(`${config.basePath}/${entry.recordLocalId}`, {
          input: entry.input,
          skipDuplicateCheck: true,
        })
        record = body[config.itemKey]
      }
      if (record) await putRecord(entry.module, record)
      await removeQueueEntry(entry.localId)
      emit(entry.module)
      return { status: 'success' }
    } catch (err) {
      return {
        status: 'error',
        message: err instanceof ApiError ? err.message : 'Still unable to reach the server.',
      }
    }
  }

  if (action === 'merge') {
    const existingLocalId = entry.conflictPayload?.existing?.localId
    if (!existingLocalId) {
      return { status: 'error', message: 'No existing record to merge into.' }
    }
    try {
      const body = await api.post(`${config.basePath}/${existingLocalId}/merge`, {
        input: entry.input,
      })
      const record = body[config.itemKey]
      await deleteRecord(entry.module, entry.recordLocalId)
      await putRecord(entry.module, record)
      await removeQueueEntry(entry.localId)
      emit(entry.module)
      return { status: 'success' }
    } catch (err) {
      return {
        status: 'error',
        message: err instanceof ApiError ? err.message : 'Still unable to reach the server.',
      }
    }
  }

  return { status: 'error', message: 'Unknown resolution action.' }
}

let started = false
/** Called once, from App.jsx — sets up the reconnect listener and a periodic
 * safety-net flush, and makes one attempt immediately in case a queue was
 * left over from a previous offline session. */
export function startAutoSync() {
  if (started || typeof window === 'undefined') return
  started = true
  window.addEventListener('online', () => {
    flushAllQueues()
  })
  setInterval(() => {
    flushAllQueues()
  }, 30000)
  flushAllQueues()
}
