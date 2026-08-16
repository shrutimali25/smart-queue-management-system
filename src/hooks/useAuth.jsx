import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, authStorage, ApiError } from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => authStorage.getUser())
  const [token, setToken] = useState(() => authStorage.getToken())
  const [loading, setLoading] = useState(true)

  // On mount, if we have a stored token, validate it by fetching the profile.
  useEffect(() => {
    let active = true
    if (!token) { setLoading(false); return }
    api.getProfile()
      .then((data) => {
        if (!active) return
        const u = data.user || data
        setUser(u)
        authStorage.setUser(u)
      })
      .catch(() => {
        if (!active) return
        authStorage.clear()
        setUser(null)
        setToken(null)
      })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [token])

  const login = useCallback(async (credentials) => {
    const data = await api.login(credentials)
    const t = data.token || data.access_token
    const u = data.user
    authStorage.setToken(t)
    authStorage.setUser(u)
    setToken(t)
    setUser(u)
    return u
  }, [])

  const register = useCallback(async (payload) => {
    return api.register(payload)
  }, [])

  const logout = useCallback(async () => {
    try { await api.logout() } catch { /* ignore network errors on logout */ }
    authStorage.clear()
    setToken(null)
    setUser(null)
  }, [])

  const refreshProfile = useCallback(async () => {
    const data = await api.getProfile()
    const u = data.user || data
    authStorage.setUser(u)
    setUser(u)
    return u
  }, [])

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout, refreshProfile, isAuthed: !!token, hasRole: (r) => user?.role === r }),
    [user, token, loading, login, register, logout, refreshProfile],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export { ApiError }
