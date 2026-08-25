import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { api } from '../services/api.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  // "loading" distingue "ainda não sabemos se há sessão" de "sabemos que
  // não há" — sem isto, uma página protegida redirecionaria para o login
  // por uma fração de segundo mesmo para quem já está autenticado.
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/auth/me')
      .then((data) => setUser(data.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  const login = useCallback(async (email, password) => {
    const data = await api.post('/auth/login', { email, password })
    setUser(data.user)
    return data.user
  }, [])

  const register = useCallback(async (name, email, password) => {
    const data = await api.post('/auth/register', { name, email, password })
    setUser(data.user)
    return data.user
  }, [])

  const logout = useCallback(async () => {
    await api.post('/auth/logout')
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth tem de ser usado dentro de um AuthProvider')
  return ctx
}
