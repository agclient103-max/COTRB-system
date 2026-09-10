import { useSyncedRecordStore } from './useSyncedRecordStore.js'
import { SYNC_MODULES } from '../data/syncModules.js'

export function useDocuments({ enabled = true } = {}) {
  return useSyncedRecordStore('documents', { ...SYNC_MODULES.documents, enabled })
}
