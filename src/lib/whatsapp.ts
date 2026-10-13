import { formatPrice } from './format'

export const WHATSAPP_RAW = '3127746386'
export const WHATSAPP_NUMBER = '573127746386'
export const WHATSAPP_DISPLAY = '+57 312 774 6386'
export const DEFAULT_WHATSAPP_MESSAGE = 'Hola! Deseo hacer un pedido'

export function getWhatsAppUrl(text: string = DEFAULT_WHATSAPP_MESSAGE): string {
  const msg = text ? `?text=${encodeURIComponent(text)}` : ''
  return `https://wa.me/${WHATSAPP_NUMBER}${msg}`
}

export interface CartOrderLine {
  name: string
  quantity: number
  price: number
}

export function getCartWhatsAppUrl(lines: CartOrderLine[], total: number): string {
  const linesText = lines
    .map((l) => `• ${l.quantity}x ${l.name} (${formatPrice(l.price * l.quantity)})`)
    .join('\n')

  const message = `Hola! Deseo hacer un pedido:\n\n${linesText}\n\nTotal: ${formatPrice(total)}`
  return getWhatsAppUrl(message)
}

export function getProductWhatsAppUrl(productName: string, price: number): string {
  const message = `Hola! Deseo hacer un pedido:\n• 1x ${productName} (${formatPrice(price)})\n\nTotal: ${formatPrice(price)}`
  return getWhatsAppUrl(message)
}
