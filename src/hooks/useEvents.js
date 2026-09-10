import { useSyncedRecordStore } from './useSyncedRecordStore.js'
import { SYNC_MODULES } from '../data/syncModules.js'

export function useEvents({ enabled = true } = {}) {
  return useSyncedRecordStore('events', { ...SYNC_MODULES.events, enabled })
}
