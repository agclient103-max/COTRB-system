/**
 * §5.1 storage layers, implemented once here and reused by every module's hook — never
 * retrofitted per module later.
 *
 * IndexedDB is the primary store. If it's unavailable (older browsers, some private-browsing
 * modes), everything transparently falls back to localStorage with the exact same interface,
 * so hooks calling these functions never need to know which backend is actually active.
 *
 * Every function here is wrapped so it never throws past its caller uncaught — callers
 * (the useDocuments/usePersonnel hooks) are expected to try/catch anyway per §8/§9, but a
 * storage layer that can silently corrupt state is worse than one that fails loudly and
 * predictably.
 */

const DB_NAME = 'cotrb-local'
// Bumped from 1 → 2 to add the 'ministry' and 'events' stores (Phase 6). IndexedDB only
// creates new stores inside onupgradeneeded, which only fires when the version number
// increases — anyone who already opened the Phase 5 database at version 1 needs this bump
// or the new stores would silently never be created in their browser.
const DB_VERSION = 2

let dbPromise = null

function indexedDbAvailable() {
  return typeof window !== 'undefined' && 'indexedDB' in window
}

function openDatabase(storeNames) {
  if (dbPromise) return dbPromise

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = () => {
      const db = request.result
      storeNames.forEach((name) => {
        if (!db.objectStoreNames.contains(name)) {
          db.createObjectStore(name, { keyPath: 'localId' })
        }
      })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })

  return dbPromise
}

// All store names that will ever be used must be declared up front so onupgradeneeded can
// create them in one pass. Add new module store names here as later phases introduce them.
const KNOWN_STORES = ['documents', 'personnel', 'ministry', 'events']

function localStorageKey(storeName) {
  return `cotrb.store.${storeName}`
}

function readLocalStorageStore(storeName) {
  try {
    const raw = window.localStorage.getItem(localStorageKey(storeName))
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeLocalStorageStore(storeName, records) {
  window.localStorage.setItem(localStorageKey(storeName), JSON.stringify(records))
}

export async function getAllRecords(storeName) {
  if (!indexedDbAvailable()) {
    return readLocalStorageStore(storeName)
  }
  try {
    const db = await openDatabase(KNOWN_STORES)
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly')
      const request = tx.objectStore(storeName).getAll()
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  } catch {
    return readLocalStorageStore(storeName)
  }
}

export async function putRecord(storeName, record) {
  if (!indexedDbAvailable()) {
    const records = readLocalStorageStore(storeName)
    const index = records.findIndex((r) => r.localId === record.localId)
    if (index >= 0) {
      records[index] = record
    } else {
      records.push(record)
    }
    writeLocalStorageStore(storeName, records)
    return record
  }
  const db = await openDatabase(KNOWN_STORES)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).put(record)
    tx.oncomplete = () => resolve(record)
    tx.onerror = () => reject(tx.error)
  })
}

export async function deleteRecord(storeName, localId) {
  if (!indexedDbAvailable()) {
    const records = readLocalStorageStore(storeName).filter((r) => r.localId !== localId)
    writeLocalStorageStore(storeName, records)
    return
  }
  const db = await openDatabase(KNOWN_STORES)
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    tx.objectStore(storeName).delete(localId)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
}

/** Seeds a store with initial records only if it's currently empty (first load ever). */
export async function seedIfEmpty(storeName, seedRecords) {
  const existing = await getAllRecords(storeName)
  if (existing.length > 0) return existing

  if (!indexedDbAvailable()) {
    writeLocalStorageStore(storeName, seedRecords)
    return seedRecords
  }
  const db = await openDatabase(KNOWN_STORES)
  await new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readwrite')
    const store = tx.objectStore(storeName)
    seedRecords.forEach((record) => store.put(record))
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  return seedRecords
}
