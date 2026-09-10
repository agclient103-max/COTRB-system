import { useApiRecordStore } from './useApiRecordStore.js'

export function useFinancial({ enabled = true } = {}) {
  return useApiRecordStore({
    basePath: '/api/financial',
    listKey: 'transactions',
    itemKey: 'transaction',
    labelOf: (record) => record.description,
    enabled,
  })
}
