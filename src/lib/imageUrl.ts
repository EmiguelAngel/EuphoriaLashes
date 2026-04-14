import { API_URL } from './api'

export function productImageSrc(image_url: string | null | undefined): string | null {
  if (!image_url) return null
  const v = image_url.trim()
  if (!v) return null
  if (v.startsWith('http://') || v.startsWith('https://')) return v
  if (v.startsWith('/')) return `${API_URL}${v}`
  return `${API_URL}/${v}`
}
