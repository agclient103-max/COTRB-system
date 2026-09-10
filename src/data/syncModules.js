// One source of truth for how each module's records map to API endpoints and
// local cache. Used by both useSyncedRecordStore (per-page) and syncEngine.js
// (background, works across whichever module isn't currently on screen).
export const SYNC_MODULES = {
  documents: {
    basePath: '/api/documents',
    listKey: 'documents',
    itemKey: 'document',
    labelOf: (r) => r.title,
  },
  personnel: {
    basePath: '/api/personnel',
    listKey: 'personnel',
    itemKey: 'person',
    labelOf: (r) => r.name,
  },
  ministry: {
    basePath: '/api/ministries',
    listKey: 'ministries',
    itemKey: 'ministry',
    labelOf: (r) => r.name,
  },
  events: {
    basePath: '/api/events',
    listKey: 'events',
    itemKey: 'event',
    labelOf: (r) => r.title,
  },
  financial: {
    basePath: '/api/financial',
    listKey: 'transactions',
    itemKey: 'transaction',
    labelOf: (r) => r.description,
  },
  reports: {
    basePath: '/api/reports',
    listKey: 'reports',
    itemKey: 'report',
    labelOf: (r) => r.name,
  },
}
