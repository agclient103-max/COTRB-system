import { useApiRecordStore } from './useApiRecordStore.js'

export function useReports({ enabled = true } = {}) {
  return useApiRecordStore({
    basePath: '/api/reports',
    listKey: 'reports',
    itemKey: 'report',
    labelOf: (record) => record.name,
    extraKeys: ['summary'],
    enabled,
  })
}
