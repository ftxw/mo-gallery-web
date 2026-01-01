'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id?: string
  username: string
  avatarUrl?: string
  isAdmin?: boolean
  oauthProvider?: string
  trustLevel?: number
}

interface AuthContextType {
  user: User | null
  token: string | null
  login: (token: string, user: User) => void
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

    if (storedToken && storedUser) {
      setToken(storedToken)
      try {
        const parsed = JSON.parse(storedUser) as User
        setUser(parsed)
      } catch {
        // Legacy format: just username string
        setUser({ username: storedUser })
      }
    }
    setIsReady(true)
  }, [])

  const login = (newToken: string, newUser: User) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(newUser))
    // Keep legacy field for backward compatibility
    localStorage.setItem('username', newUser.username)
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
