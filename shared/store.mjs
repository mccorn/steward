const LABEL_MAX = 200
const NAME_MAX = 80
const DEFAULT_LIST_NAME = 'Покупки'

export function createId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }
  const bytes = new Uint8Array(16)
  for (let i = 0; i < 16; i++) bytes[i] = Math.floor(Math.random() * 256)
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

export function emptyStore() {
  return {
    lists: [makeList({ name: DEFAULT_LIST_NAME, parentId: null, display: 'page' })],
  }
}

function makeList({ id, name, parentId, display, items }) {
  return {
    id: id || createId(),
    name,
    parentId: parentId || null,
    display: display === 'nested' ? 'nested' : 'page',
    items: Array.isArray(items) ? items : [],
  }
}

function migrateItem(item) {
  if (!item || typeof item !== 'object') {
    return { id: createId(), label: '', isHot: false }
  }
  return {
    id: typeof item.id === 'string' && item.id ? item.id : createId(),
    label: String(item.label ?? '').slice(0, LABEL_MAX),
    isHot: Boolean(item.isHot),
  }
}

function migrateList(list) {
  if (!list || typeof list !== 'object') {
    return makeList({ name: DEFAULT_LIST_NAME, parentId: null, display: 'page', items: [] })
  }
  return makeList({
    id: typeof list.id === 'string' && list.id ? list.id : undefined,
    name: String(list.name || DEFAULT_LIST_NAME).trim().slice(0, NAME_MAX) || DEFAULT_LIST_NAME,
    parentId: typeof list.parentId === 'string' && list.parentId ? list.parentId : null,
    display: list.display,
    items: Array.isArray(list.items) ? list.items.map(migrateItem) : [],
  })
}

export function migrateStore(raw) {
  if (!raw || typeof raw !== 'object') return emptyStore()

  if (Array.isArray(raw.lists)) {
    if (raw.lists.length === 0) return emptyStore()
    return { lists: raw.lists.map(migrateList) }
  }

  if (Array.isArray(raw.list)) {
    return {
      lists: [
        makeList({
          name: DEFAULT_LIST_NAME,
          parentId: null,
          display: 'page',
          items: raw.list.map(migrateItem),
        }),
      ],
    }
  }

  return emptyStore()
}

function fail(error, status) {
  return { ok: false, error, status }
}

function ok(store) {
  return { ok: true, store }
}

function findList(store, id) {
  return store.lists.find((list) => list.id === id)
}

function isAncestor(store, ancestorId, nodeId) {
  const seen = new Set()
  let current = findList(store, nodeId)
  while (current?.parentId) {
    if (current.parentId === ancestorId) return true
    if (seen.has(current.parentId)) return true
    seen.add(current.parentId)
    current = findList(store, current.parentId)
  }
  return false
}

export function applyAction(store, action, payload) {
  const next = structuredClone(store)
  const body = payload && typeof payload === 'object' ? payload : {}

  switch (action) {
    case 'list.create': {
      const name = String(body.name ?? '').trim().slice(0, NAME_MAX)
      if (!name) return fail('name required', 400)
      const parentId = body.parentId || null
      if (parentId && !findList(next, parentId)) return fail('parent not found', 400)
      const display = body.display === 'nested' ? 'nested' : 'page'
      if (display === 'nested' && !parentId) return fail('nested list needs parent', 400)
      next.lists.push(makeList({
        name,
        parentId,
        display,
        items: [],
      }))
      return ok(next)
    }
    case 'list.update': {
      const list = findList(next, body.id)
      if (!list) return fail('list not found', 404)
      if (body.name != null) {
        const name = String(body.name).trim().slice(0, NAME_MAX)
        if (!name) return fail('name required', 400)
        list.name = name
      }
      if (body.display != null) {
        list.display = body.display === 'nested' ? 'nested' : 'page'
      }
      if (Object.prototype.hasOwnProperty.call(body, 'parentId')) {
        const parentId = body.parentId || null
        if (parentId === list.id) return fail('cycle', 400)
        if (parentId && !findList(next, parentId)) return fail('parent not found', 400)
        if (parentId && isAncestor(next, list.id, parentId)) return fail('cycle', 400)
        list.parentId = parentId
      }
      if (list.display === 'nested' && !list.parentId) return fail('nested list needs parent', 400)
      return ok(next)
    }
    case 'list.delete': {
      const id = body.id
      if (!findList(next, id)) return fail('list not found', 404)
      if (next.lists.some((list) => list.parentId === id)) return fail('list has children', 400)
      if (next.lists.length <= 1) return fail('cannot delete last list', 400)
      next.lists = next.lists.filter((list) => list.id !== id)
      return ok(next)
    }
    case 'item.create': {
      const list = findList(next, body.listId)
      if (!list) return fail('list not found', 404)
      const label = String(body.label ?? '').trim().slice(0, LABEL_MAX)
      if (!label) return fail('label required', 400)
      list.items.push({ id: createId(), label, isHot: false })
      return ok(next)
    }
    case 'item.update': {
      const list = findList(next, body.listId)
      if (!list) return fail('list not found', 404)
      const item = list.items.find((entry) => entry.id === body.id)
      if (!item) return fail('item not found', 404)
      if (body.label != null) {
        const label = String(body.label).trim().slice(0, LABEL_MAX)
        if (!label) return fail('label required', 400)
        item.label = label
      }
      if (body.isHot != null) item.isHot = Boolean(body.isHot)
      return ok(next)
    }
    case 'item.delete': {
      const list = findList(next, body.listId)
      if (!list) return fail('list not found', 404)
      const before = list.items.length
      list.items = list.items.filter((entry) => entry.id !== body.id)
      if (list.items.length === before) return fail('item not found', 404)
      return ok(next)
    }
    case 'state.replace': {
      if (!Array.isArray(body.lists) && !Array.isArray(body.list)) {
        return fail('invalid store', 400)
      }
      return ok(migrateStore(body))
    }
    default:
      return fail('unknown action', 400)
  }
}

export function listDepth(store, listId) {
  let depth = 0
  const seen = new Set()
  let current = findList(store, listId)
  while (current?.parentId) {
    if (seen.has(current.parentId)) break
    seen.add(current.parentId)
    depth += 1
    current = findList(store, current.parentId)
  }
  return depth
}

export function firstRootListId(store) {
  const root = store.lists.find((list) => !list.parentId) || store.lists[0]
  return root?.id ?? null
}

function resolveRemoteListId(listId, local, remote) {
  if (!listId || findList(remote, listId)) return listId
  const localList = local.lists.find((list) => list.id === listId)
  if (!localList) return listId
  const match = remote.lists.find((list) => (
    list.name === localList.name
    && (list.parentId || null) === (localList.parentId || null)
  ))
  return match?.id || remote.lists[0]?.id || listId
}

function remapPayload(action, payload, local, remote) {
  const body = payload && typeof payload === 'object' ? { ...payload } : {}
  if (body.listId) body.listId = resolveRemoteListId(body.listId, local, remote)
  if (action.startsWith('list.') && body.id) {
    body.id = resolveRemoteListId(body.id, local, remote)
  }
  if (Object.prototype.hasOwnProperty.call(body, 'parentId') && body.parentId) {
    body.parentId = resolveRemoteListId(body.parentId, local, remote)
  }
  return body
}

export function applyQueue(remote, queue, local) {
  let next = structuredClone(migrateStore(remote))
  const source = migrateStore(local)
  for (const op of queue) {
    const payload = remapPayload(op.action, op.payload, source, next)
    const result = applyAction(next, op.action, payload)
    if (result.ok) next = result.store
  }
  return next
}
