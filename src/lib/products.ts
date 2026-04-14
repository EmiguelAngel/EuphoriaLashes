import type { Product, ProductInsert, ProductUpdate } from './types'
import { api, API_URL } from './api'
import { io } from 'socket.io-client'
import { getAdminToken } from './auth'

function authHeaders(): Record<string, string> {
  const token = localStorage.getItem('token');
  return token ? { Authorization: token } : {};
}

export async function listProducts(params?: { search?: string }) {
  const search = params?.search?.trim()
  const qs = search ? `?search=${encodeURIComponent(search)}` : ''
  return await api<Product[]>(`/api/products${qs}`)
}

export async function createProduct(input: ProductInsert) {
  return await api<Product>('/api/products', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  })
}

export async function updateProduct(id: string, patch: ProductUpdate) {
  return await api<Product>(`/api/products/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  })
}

export async function deleteProduct(id: string) {
  await api<void>(`/api/products/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export function subscribeProducts(onChange: () => void) {
  const socket = io(API_URL, { transports: ['websocket'] })
  socket.on('connect_error', () => {
    // fallback: no realtime; consumer still has manual refresh
  })
  socket.on('products:changed', () => onChange())
  return () => {
    socket.disconnect()
  }
}

