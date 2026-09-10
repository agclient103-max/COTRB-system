import { useApiRecordStore } from './useApiRecordStore.js'

export function useEvents({ enabled = true } = {}) {
  return useApiRecordStore({
    basePath: '/api/events',
    listKey: 'events',
    itemKey: 'event',
    labelOf: (record) => record.title,
    enabled,
  })
}
