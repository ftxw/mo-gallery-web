'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  username: string
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, username: string) => void
  logout: () => void
  isAuthenticated: boolean
  isReady: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')
    const storedUsername = localStorage.getItem('username')

    if (storedToken && (storedUser || storedUsername)) {
      setToken(storedToken)
      if (storedUsername) {
        setUser({ username: storedUsername })
        setIsReady(true)
        return
      }
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser) as { username?: string; email?: string }
          setUser({ username: parsed.username ?? parsed.email ?? 'admin' })
        } catch {
          setUser({ username: 'admin' })
        } finally {
          setIsReady(true)
        }
        return
      }
    }
    setIsReady(true)
  }, [])

  const login = (newToken: string, username: string) => {
    setToken(newToken)
    setUser({ username })
    localStorage.setItem('token', newToken)
    localStorage.setItem('username', username)
    localStorage.setItem('user', JSON.stringify({ username }))
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('username')
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        logout,
        isAuthenticated: !!token,
        isReady,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
