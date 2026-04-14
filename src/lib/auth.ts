import { api } from './api'

const ADMIN_TOKEN_KEY = 'el_admin_token'

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminToken(token: string) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token)
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY)
}

export async function loginAdmin(email: string, password: string) {
  const result = await api<{ token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
  setAdminToken(result.token)
}

export async function verifyAdminSession() {
  const token = getAdminToken()
  if (!token) return false
  try {
    await api<{ ok: true }>('/api/auth/verify', {
      headers: { Authorization: `Bearer ${token}` },
    })
    return true
  } catch {
    return false
  }
}
