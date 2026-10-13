import { formatPrice } from './format'

export const WHATSAPP_RAW = '3127746386'
export const WHATSAPP_NUMBER = '573127746386'
export const WHATSAPP_DISPLAY = '+57 312 774 6386'

export function getWhatsAppUrl(text?: string): string {
  const msg = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${WHATSAPP_NUMBER}${msg}`
}

export function getProductWhatsAppUrl(productName: string, price: number): string {
  const message = `¡Hola Euphoria Lashes! ✨ Me interesa pedir el modelo "${productName}" (${formatPrice(price)}). ¿Tienen disponibilidad inmediata?`
  return getWhatsAppUrl(message)
}
