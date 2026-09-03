import { getToken } from './storage'

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

type ApiOptions = {
  method?: 'GET' | 'POST'
  body?: unknown
  signal?: AbortSignal
  auth?: boolean
}

export async function apiFetch<T>(path: string, options: ApiOptions = {}): Promise<T> {
  const { method = 'GET', body, signal, auth = true } = options
  const headers: Record<string, string> = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(path, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  if (!response.ok) {
    let message = response.statusText
    try {
      const data = await response.json()
      if (data?.error) message = data.error
    } catch {
      // ignore parse errors
    }
    if (response.status === 401) {
      window.dispatchEvent(new Event('steward:unauthorized'))
    }
    throw new ApiError(response.status, message)
  }

  return response.json() as Promise<T>
}
