import { createContext, useCallback, useMemo, useState } from 'react'
import { findMockUserById } from '../data/mockUsers.js'

const SESSION_KEY = 'cotrb.auth.session'

export const AuthContext = createContext(null)

function readStoredUserId() {
  try {
    return window.localStorage.getItem(SESSION_KEY)
  } catch {
    // localStorage can throw in private-browsing modes or when storage is disabled.
    // Treat it the same as "no session" rather than crashing the app.
    return null
  }
}

function restoreUser() {
  const storedId = readStoredUserId()
  return storedId ? findMockUserById(storedId) : null
}

export function AuthProvider({ children }) {
  // localStorage reads are synchronous, so the session can be restored directly in the
  // initial state (a lazy initializer) rather than in an effect — no loading flicker,
  // and no cascading-render lint warning from setting state inside an effect body.
  const [user, setUser] = useState(restoreUser)
  const [authError, setAuthError] = useState(null)

  const login = useCallback((userId) => {
    setAuthError(null)
    const nextUser = findMockUserById(userId)
    if (!nextUser) {
      setAuthError('That account could not be found. Please choose an account from the list.')
      return false
    }
    try {
      window.localStorage.setItem(SESSION_KEY, nextUser.id)
    } catch {
      // Session still works for this tab via React state even if persistence fails;
      // let the person know it won't survive a refresh.
      setAuthError(
        "Signed in, but your browser blocked saving the session — you'll need to sign in again after refreshing.",
      )
    }
    setUser(nextUser)
    return true
  }, [])

  const logout = useCallback(() => {
    try {
      window.localStorage.removeItem(SESSION_KEY)
    } catch {
      // Nothing more we can do if storage is blocked; clearing in-memory state below
      // still logs the person out for this tab.
    }
    setUser(null)
    setAuthError(null)
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      // Kept for API stability: a future backend-backed auth check would be async and
      // would need this. Restoration from localStorage today is synchronous, so it's
      // always false.
      isLoading: false,
      authError,
      login,
      logout,
    }),
    [user, authError, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
