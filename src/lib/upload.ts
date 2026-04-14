import { API_URL } from './api'
import { getAdminToken } from './auth'

export async function uploadProductImage(file: File): Promise<string> {
  const token = getAdminToken()
  if (!token) throw new Error('No hay sesión')

  const body = new FormData()
  body.append('image', file)

  const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
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

  const data = (await res.json()) as { url: string }
  return data.url
}
