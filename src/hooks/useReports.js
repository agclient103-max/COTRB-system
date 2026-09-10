import { useSyncedRecordStore } from './useSyncedRecordStore.js'
import { SYNC_MODULES } from '../data/syncModules.js'

export function useReports({ enabled = true } = {}) {
  return useSyncedRecordStore('reports', { ...SYNC_MODULES.reports, enabled })
}
