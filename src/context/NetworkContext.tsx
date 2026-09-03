/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

type NetworkContextValue = {
  reachable: boolean
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

const PING_MS = 30_000
const PING_TIMEOUT_MS = 4000

async function pingHealth(): Promise<boolean> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), PING_TIMEOUT_MS)
  try {
    const response = await fetch('/api/health', { signal: controller.signal })
    return response.ok
  } catch {
    return false
  } finally {
    window.clearTimeout(timer)
  }
}

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [reachable, setReachable] = useState(false)

  useEffect(() => {
    let cancelled = false

    const setIfChanged = (next: boolean) => {
      if (!cancelled) setReachable((prev) => (prev === next ? prev : next))
    }

    const check = async () => {
      const ok = await pingHealth()
      setIfChanged(ok)
    }

    check()
    const interval = window.setInterval(check, PING_MS)
    const onOnline = () => { check() }
    const onOffline = () => setIfChanged(false)

    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)

    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  const value = useMemo(() => ({ reachable }), [reachable])

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>
}

export function useNetwork(): NetworkContextValue {
  const context = useContext(NetworkContext)
  if (!context) throw new Error('useNetwork must be used within NetworkProvider')
  return context
}
