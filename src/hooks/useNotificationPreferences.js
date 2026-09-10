import { useCallback, useState } from 'react'
import { useAuth } from './useAuth.js'
import { DEFAULT_NOTIFICATION_PREFS } from '../data/notificationDefaults.js'

function storageKey(userId) {
  return `cotrb.notificationPrefs.${userId}`
}

function readPrefs(userId) {
  try {
    const raw = window.localStorage.getItem(storageKey(userId))
    return raw ? { ...DEFAULT_NOTIFICATION_PREFS, ...JSON.parse(raw) } : DEFAULT_NOTIFICATION_PREFS
  } catch {
    return DEFAULT_NOTIFICATION_PREFS
  }
}

export function useNotificationPreferences() {
  const { user } = useAuth()
  const [prefs, setPrefs] = useState(() => readPrefs(user.id))
  const [error, setError] = useState(null)

  const toggle = useCallback(
    (key) => {
      setError(null)
      const next = { ...prefs, [key]: !prefs[key] }
      try {
        window.localStorage.setItem(storageKey(user.id), JSON.stringify(next))
        setPrefs(next)
      } catch {
        setError('Could not save this preference. Please try again.')
      }
    },
    [prefs, user.id],
  )

  return { prefs, toggle, error }
}
