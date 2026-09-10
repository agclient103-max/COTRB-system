import { useApiRecordStore } from './useApiRecordStore.js'

export function useDocuments({ enabled = true } = {}) {
  return useApiRecordStore({
    basePath: '/api/documents',
    listKey: 'documents',
    itemKey: 'document',
    labelOf: (record) => record.title,
    enabled,
  })
}
