import { useSyncedRecordStore } from './useSyncedRecordStore.js'
import { SYNC_MODULES } from '../data/syncModules.js'

export function usePersonnel({ enabled = true } = {}) {
  return useSyncedRecordStore('personnel', { ...SYNC_MODULES.personnel, enabled })
}
