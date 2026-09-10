import { getAllRecords, putRecord } from '../db/localDb.js'

const BACKUP_STORES = ['documents', 'personnel', 'ministry', 'events', 'financial', 'reports']

export async function exportAllData() {
  const data = {}
  for (const store of BACKUP_STORES) {
    data[store] = await getAllRecords(store)
  }
  const payload = {
    exportedAt: new Date().toISOString(),
    version: 1,
    data,
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `cotrb-backup-${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importAllData(fileText) {
  let parsed
  try {
    parsed = JSON.parse(fileText)
  } catch {
    throw new Error('That file is not valid JSON. Please choose a COTRB backup file.')
  }

  if (!parsed || typeof parsed !== 'object' || !parsed.data) {
    throw new Error('That file does not look like a COTRB backup file.')
  }

  let restoredCount = 0
  for (const store of BACKUP_STORES) {
    const records = parsed.data[store]
    if (Array.isArray(records)) {
      for (const record of records) {
        if (record && record.localId) {
          await putRecord(store, record)
          restoredCount += 1
        }
      }
    }
  }
  return restoredCount
}
