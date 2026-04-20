const rawApiUrl = ((import.meta.env.VITE_API_URL as string | undefined) ?? '').trim().replace(/\/+$/, '')
const API_URL = rawApiUrl || (import.meta.env.DEV ? 'http://localhost:5174' : '')

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const url = `${API_URL}${path}`
  const headers = {
    'Content-Type': 'application/json',
    ...(init?.headers ?? {}),
  }

  // Render free puede responder temporalmente 502 "no-deploy" mientras despierta.
  // Reintentamos unas veces para evitar que el usuario vea error.
  let lastErr: Error | null = null
  for (let attempt = 0; attempt < 3; attempt++) {
    let res: Response
    try {
      res = await fetch(url, { ...init, headers })
    } catch (e) {
      lastErr = e instanceof Error ? e : new Error('Network error')
      await sleep(350 * Math.pow(2, attempt))
      continue
    }

    if (res.ok) {
      if (res.status === 204) return undefined as T
      return (await res.json()) as T
    }

    // 502 con "no-deploy": esperar y reintentar
    const renderRouting = res.headers.get('x-render-routing') ?? res.headers.get('X-Render-Routing')
    if (res.status === 502 && renderRouting && renderRouting.toLowerCase().includes('no-deploy')) {
      await sleep(400 * Math.pow(2, attempt))
      continue
    }

    const text = await res.text().catch(() => '')
    let msg = text || `HTTP ${res.status}`
    // Si el proxy devuelve HTML (index.html / páginas de error), evita imprimirlo completo.
    if (msg.trim().startsWith('<!doctype html') || msg.trim().startsWith('<html')) {
      msg = `HTTP ${res.status}`
    }
    try {
      const j = JSON.parse(text) as { error?: unknown }
      if (j && typeof j.error === 'string') msg = j.error
    } catch {
      // texto plano
    }
    throw new Error(msg)
  }

  if (lastErr) throw lastErr
  throw new Error('No se pudo conectar al servidor')
}

export { API_URL }

