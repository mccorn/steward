import type { Store } from '../../shared/store'
import { QUEUE_KEY, STORE_KEY, TOKEN_KEY, ACTIVE_LIST_KEY } from './constants'

export type QueuedMutation = {
  opId: string
  action: string
  payload: unknown
  ts: number
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function getToken(): string {
  return localStorage.getItem(TOKEN_KEY) || ''
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export function loadCachedStore(): Store | null {
  return readJson<Store | null>(STORE_KEY, null)
}

export function saveCachedStore(store: Store): void {
  localStorage.setItem(STORE_KEY, JSON.stringify(store))
}

export function loadQueue(): QueuedMutation[] {
  const queue = readJson<QueuedMutation[]>(QUEUE_KEY, [])
  return Array.isArray(queue) ? queue : []
}

export function saveQueue(queue: QueuedMutation[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function loadActiveListId(): string | null {
  return localStorage.getItem(ACTIVE_LIST_KEY)
}

export function saveActiveListId(id: string): void {
  localStorage.setItem(ACTIVE_LIST_KEY, id)
}
