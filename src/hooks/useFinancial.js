import { useSyncedRecordStore } from './useSyncedRecordStore.js'
import { SYNC_MODULES } from '../data/syncModules.js'

export function useFinancial({ enabled = true } = {}) {
  return useSyncedRecordStore('financial', { ...SYNC_MODULES.financial, enabled })
}
