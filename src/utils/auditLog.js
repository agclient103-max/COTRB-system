import { putRecord, getAllRecords } from '../db/localDb.js'
import { generateLocalId } from './recordId.js'

const STORE = 'auditLog'

export async function logAction({ user, action, moduleLabel, recordLabel }) {
  const entry = {
    localId: generateLocalId(),
    timestamp: new Date().toISOString(),
    userName: user?.name ?? 'Unknown',
    userRole: user?.role ?? 'UNKNOWN',
    action,
    moduleLabel,
    recordLabel,
  }
  try {
    await putRecord(STORE, entry)
  } catch (err) {
    console.error('Failed to write audit log entry', err)
  }
}

export async function getAuditLog() {
  const entries = await getAllRecords(STORE)
  return entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
}
