/* eslint-disable react-refresh/only-export-components */
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { applyAction, applyQueue, emptyStore, firstRootListId, migrateStore, type Store } from '../../shared/store.mjs'
import { apiFetch, ApiError } from '../lib/api'
import { createId } from '../../shared/store.mjs'
import {
  loadActiveListId,
  loadCachedStore,
  loadQueue,
  saveActiveListId,
  saveCachedStore,
  saveQueue,
  type QueuedMutation,
} from '../lib/storage'
import { useNetwork } from './NetworkContext'

type StoreContextValue = {
  store: Store
  queueLength: number
  activeListId: string | null
  setActiveListId: (id: string) => void
  dispatch: (action: string, payload: unknown) => Store | null
}

const StoreContext = createContext<StoreContextValue | null>(null)

function initialStore(): Store {
  const cached = loadCachedStore()
  if (cached) return migrateStore(cached)
  const fresh = emptyStore()
  saveCachedStore(fresh)
  return fresh
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const { reachable } = useNetwork()
  const [store, setStore] = useState<Store>(initialStore)
  const [queue, setQueue] = useState<QueuedMutation[]>(loadQueue)
  const [activeListId, setActiveListIdState] = useState<string | null>(() => {
    const saved = loadActiveListId()
    const cached = loadCachedStore()
    const lists = cached ? migrateStore(cached).lists : []
    if (saved && lists.some((list) => list.id === saved)) return saved
    return lists.find((list) => !list.parentId)?.id || lists[0]?.id || null
  })
  const flushingRef = useRef(false)
  const storeRef = useRef(store)
  const queueRef = useRef(queue)

  useEffect(() => { storeRef.current = store }, [store])
  useEffect(() => { queueRef.current = queue }, [queue])

  const commitStore = useCallback((next: Store) => {
    storeRef.current = next
    saveCachedStore(next)
    setStore(next)
  }, [])

  const commitQueue = useCallback((next: QueuedMutation[]) => {
    queueRef.current = next
    saveQueue(next)
    setQueue(next)
  }, [])

  const setActiveListId = useCallback((id: string) => {
    saveActiveListId(id)
    setActiveListIdState(id)
  }, [])

  const dispatch = useCallback((action: string, payload: unknown) => {
    const result = applyAction(storeRef.current, action, payload)
    if (!result.ok) return null
    commitStore(result.store)
    const mutation: QueuedMutation = {
      opId: createId(),
      action,
      payload,
      ts: Date.now(),
    }
    commitQueue([...queueRef.current, mutation])
    return result.store
  }, [commitQueue, commitStore])

  const syncWithServer = useCallback(async () => {
    if (!reachable || flushingRef.current) return
    flushingRef.current = true
    try {
      const remote = await apiFetch<Store>('/api/state')
      const pending = [...queueRef.current]
      if (pending.length === 0) {
        commitStore(remote)
        return
      }
      const next = applyQueue(remote, pending, storeRef.current)
      const saved = await apiFetch<Store>('/api/state', {
        method: 'POST',
        body: { action: 'state.replace', payload: next },
      })
      commitStore(saved)
      commitQueue(queueRef.current.filter((op) => !pending.includes(op)))
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) return
      // stay on local snapshot while offline / server error
    } finally {
      flushingRef.current = false
    }
  }, [commitQueue, commitStore, reachable])

  useEffect(() => {
    if (reachable) syncWithServer()
  }, [reachable, syncWithServer, queue.length])

  useEffect(() => {
    if (activeListId && store.lists.some((list) => list.id === activeListId)) return
    const fallback = firstRootListId(store)
    if (fallback) setActiveListId(fallback)
  }, [activeListId, setActiveListId, store])

  const value = useMemo<StoreContextValue>(() => ({
    store,
    queueLength: queue.length,
    activeListId,
    setActiveListId,
    dispatch,
  }), [activeListId, dispatch, queue.length, setActiveListId, store])

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore(): StoreContextValue {
  const context = useContext(StoreContext)
  if (!context) throw new Error('useStore must be used within StoreProvider')
  return context
}
