import { useApiRecordStore } from './useApiRecordStore.js'

export function useMinistries({ enabled = true } = {}) {
  return useApiRecordStore({
    basePath: '/api/ministries',
    listKey: 'ministries',
    itemKey: 'ministry',
    labelOf: (record) => record.name,
    enabled,
  })
}
