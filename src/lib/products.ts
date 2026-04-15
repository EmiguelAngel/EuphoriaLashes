import type { Product, ProductInsert, ProductUpdate } from './types'
import { api, API_URL } from './api'
import { io } from 'socket.io-client'
import { getAdminToken } from './auth'

function authHeaders(): Record<string, string> {
  const token = getAdminToken()
  return token ? { Authorization: `Bearer ${token}` } : {}
}

function ensureGallery(p: Product): Product {
  const imgs = p.images?.length ? p.images : p.image_url ? [p.image_url] : []
  return { ...p, images: imgs, image_url: imgs[0] ?? null }
}

export async function listProducts(params?: { search?: string }) {
  const search = params?.search?.trim()
  const qs = search ? `?search=${encodeURIComponent(search)}` : ''
  const data = await api<Product[]>(`/api/products${qs}`)
  return data.map(ensureGallery)
}

export async function getProduct(id: string) {
  const p = await api<Product>(`/api/products/${encodeURIComponent(id)}`)
  return ensureGallery(p)
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
  // En producción (Vercel + rewrites), WebSocket suele fallar.
  // La app igual funciona sin realtime (los usuarios pueden refrescar).
  if (!import.meta.env.DEV) return () => {}

  const socket = io(API_URL, { transports: ['websocket'] })
  socket.on('connect_error', () => {
    // fallback: no realtime; consumer still has manual refresh
  })
  socket.on('products:changed', () => onChange())
  return () => {
    socket.disconnect()
  }
}

