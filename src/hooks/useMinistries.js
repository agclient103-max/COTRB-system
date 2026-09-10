import { useSyncedRecordStore } from './useSyncedRecordStore.js'
import { SYNC_MODULES } from '../data/syncModules.js'

export function useMinistries({ enabled = true } = {}) {
  return useSyncedRecordStore('ministry', { ...SYNC_MODULES.ministry, enabled })
}
