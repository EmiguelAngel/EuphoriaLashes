const API_URL = (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:5174'

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
  })

  if (!res.ok) {
    const text = await res.text().catch(() => '')
    let msg = text || `HTTP ${res.status}`
    try {
      const j = JSON.parse(text) as { error?: unknown }
      if (j && typeof j.error === 'string') msg = j.error
    } catch {
      // texto plano
    }
    throw new Error(msg)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export { API_URL }

