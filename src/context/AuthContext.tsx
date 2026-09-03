/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEV_TOKEN } from '../lib/constants'
import { clearToken, getToken, setToken as persistToken } from '../lib/storage'
import { TokenScreen } from '../components/TokenScreen/TokenScreen'

type AuthContextValue = {
  token: string
  saveToken: (value: string) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

function readInitialToken(): string {
  const existing = getToken()
  if (existing) return existing
  if (import.meta.env.DEV) {
    persistToken(DEV_TOKEN)
    return DEV_TOKEN
  }
  return ''
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setTokenState] = useState(readInitialToken)

  const saveToken = useCallback((value: string) => {
    persistToken(value)
    setTokenState(value)
  }, [])

  useEffect(() => {
    const onUnauthorized = () => {
      clearToken()
      setTokenState('')
    }
    window.addEventListener('steward:unauthorized', onUnauthorized)
    return () => window.removeEventListener('steward:unauthorized', onUnauthorized)
  }, [])

  const value = useMemo(() => ({ token, saveToken }), [token, saveToken])

  if (!token) {
    return <TokenScreen onSubmit={saveToken} />
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}
