import type { Category, CategoryInsert, CategoryUpdate, Product, ProductInsert, ProductUpdate } from './types'
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

/* --- Categorías dinámicas --- */

export async function listCategories(): Promise<Category[]> {
  try {
    return await api<Category[]>('/api/categories')
  } catch {
    return []
  }
}

export async function createCategory(input: CategoryInsert): Promise<Category> {
  return await api<Category>('/api/categories', {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(input),
  })
}

export async function updateCategory(id: string, patch: CategoryUpdate): Promise<Category> {
  return await api<Category>(`/api/categories/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(patch),
  })
}

export async function deleteCategory(id: string): Promise<void> {
  await api<void>(`/api/categories/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
  })
}

export function subscribeProducts(onChange: () => void) {
  if (!import.meta.env.DEV) return () => {}

  const socket = io(API_URL, { transports: ['websocket'] })
  socket.on('connect_error', () => {})
  socket.on('products:changed', () => onChange())
  return () => {
    socket.disconnect()
  }
}
