import { getAllRecords, putRecord, deleteRecord } from '../db/localDb.js'
import { generateLocalId } from './recordId.js'

const STORE = 'syncQueue'

/**
 * One entry per write operation that couldn't reach the server. `module` is the
 * frontend store key (e.g. 'documents'); `recordLocalId` ties the queue entry
 * back to the cached record it affects, so the UI can show "Pending sync" on
 * the right row and resolve conflicts against the right record.
 *
 * status: 'pending' (waiting to be sent) | 'conflict' (server rejected it and
 * needs a human decision) | 'error' (failed for another reason, will retry)
 */
export async function enqueueSync({ module, operation, recordLocalId, input, mergeTargetLocalId }) {
  const entry = {
    localId: generateLocalId(), // the queue entry's own id, unrelated to recordLocalId
    module,
    operation, // 'create' | 'update' | 'delete' | 'merge'
    recordLocalId,
    mergeTargetLocalId: mergeTargetLocalId ?? null,
    input: input ?? null,
    status: 'pending',
    errorMessage: null,
    createdAt: new Date().toISOString(),
  }
  await putRecord(STORE, entry)
  return entry
}

export async function getQueue() {
  const all = await getAllRecords(STORE)
  return all.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
}

export async function getQueueForModule(moduleKey) {
  const all = await getQueue()
  return all.filter((entry) => entry.module === moduleKey)
}

export async function markQueueEntry(queueLocalId, updates) {
  const all = await getAllRecords(STORE)
  const entry = all.find((e) => e.localId === queueLocalId)
  if (!entry) return null
  const updated = { ...entry, ...updates }
  await putRecord(STORE, updated)
  return updated
}

export async function removeQueueEntry(queueLocalId) {
  await deleteRecord(STORE, queueLocalId)
}
