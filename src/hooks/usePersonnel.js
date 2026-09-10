import { useApiRecordStore } from './useApiRecordStore.js'

export function usePersonnel({ enabled = true } = {}) {
  return useApiRecordStore({
    basePath: '/api/personnel',
    listKey: 'personnel',
    itemKey: 'person',
    labelOf: (record) => record.name,
    enabled,
  })
}
