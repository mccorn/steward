export type ShopItem = {
  id: string
  label: string
  isHot?: boolean
}

export type ListDisplay = 'page' | 'nested'

export type ShopList = {
  id: string
  name: string
  parentId: string | null
  display: ListDisplay
  items: ShopItem[]
}

export type Store = {
  lists: ShopList[]
}

export type ApplyResult =
  | { ok: true; store: Store }
  | { ok: false; error: string; status: number }

export function createId(): string
export function emptyStore(): Store
export function migrateStore(raw: unknown): Store
export function applyAction(store: Store, action: string, payload: unknown): ApplyResult
export function listDepth(store: Store, listId: string): number
export function firstRootListId(store: Store): string | null
export function applyQueue(
  remote: Store,
  queue: Array<{ action: string; payload: unknown }>,
  local: Store,
): Store
