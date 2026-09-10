import { getDatabase } from '@netlify/database'

// getDatabase() auto-selects the right connector for wherever this code is
// running (Netlify Function, Edge Function, build, etc.) and points at the
// correct database branch (production vs. this deploy preview) automatically.
// Cached per function invocation's module scope — cheap to call repeatedly,
// but no reason to reconnect on every call within the same cold start.
let cached = null

export function getDb() {
  if (!cached) {
    cached = getDatabase()
  }
  return cached
}
