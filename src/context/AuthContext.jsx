import { createContext, useCallback, useEffect, useMemo, useState } from 'react'
import {
  getUser,
  login as identityLogin,
  logout as identityLogout,
  onAuthChange,
} from '@netlify/identity'

export const AuthContext = createContext(null)

/**
 * Converts an Identity User into the shape the rest of the app expects.
 * Returns null if there's no session, or if there IS a session but no role
 * has been assigned yet (app_metadata.roles is empty) — an account without a
 * role can't do anything in this app, so it's treated the same as signed-out
 * rather than crashing on an undefined role everywhere downstream.
 */
function toAppUser(identityUser) {
  if (!identityUser) return null
  const role = identityUser.roles?.[0]
  if (!role) return null
  return {
    id: identityUser.id,
    email: identityUser.email,
    name: identityUser.name || identityUser.userMetadata?.full_name || identityUser.email,
    role,
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [authError, setAuthError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      try {
        const identityUser = await getUser()
        if (!cancelled) setUser(toAppUser(identityUser))
      } catch {
        if (!cancelled) setUser(null)
      }
      if (!cancelled) setIsLoading(false)
    }
    checkSession()

    // Keeps state in sync with token refreshes and any auth change triggered
    // elsewhere (e.g. a password recovery flow completing in another tab).
    const unsubscribe = onAuthChange((event, identityUser) => {
      if (event === 'logout') {
        setUser(null)
      } else {
        setUser(toAppUser(identityUser))
      }
    })

    return () => {
      cancelled = true
      unsubscribe()
    }
  }, [])

  const login = useCallback(async (email, password) => {
    setAuthError(null)
    try {
      const identityUser = await identityLogin(email, password)
      const appUser = toAppUser(identityUser)
      if (!appUser) {
        setAuthError('Your account has no role assigned yet. Contact an administrator.')
        return false
      }
      setUser(appUser)
      return true
    } catch (err) {
      setAuthError(err.message || 'Could not sign in. Please check your email and password.')
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await identityLogout()
    } catch {
      // Still clear local state even if the server-side call fails — the
      // person's intent to sign out should always be honored locally.
    }
    setUser(null)
    setAuthError(null)
  }, [])

  const value = useMemo(
    () => ({ user, isAuthenticated: Boolean(user), isLoading, authError, login, logout }),
    [user, isLoading, authError, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
