import { createContext, useContext, useEffect, useMemo, useCallback, useState, type ReactNode } from 'react'
import type { Product } from './types'
import { getCartWhatsAppUrl } from './whatsapp'

export interface CartItem {
  product: Product
  quantity: number
}

interface CartContextValue {
  items: CartItem[]
  totalCount: number
  totalPrice: number
  isOpen: boolean
  addItem: (product: Product, quantity?: number) => void
  removeItem: (productId: string) => void
  updateQuantity: (productId: string, quantity: number) => void
  clearCart: () => void
  openCart: () => void
  closeCart: () => void
  toggleCart: () => void
  sendOrderToWhatsApp: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'euphoria_cart_v1'

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) return parsed
      }
    } catch {
      // ignore
    }
    return []
  })

  const [isOpen, setIsOpen] = useState(false)

  // Sincronizar en localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [items])

  const totalCount = useMemo(() => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  }, [items])

  const totalPrice = useMemo(() => {
    return items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)
  }, [items])

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    if (quantity <= 0) return
    setItems((prev) => {
      const existingIndex = prev.findIndex((i) => i.product.id === product.id)
      if (existingIndex > -1) {
        const updated = [...prev]
        const current = updated[existingIndex]
        updated[existingIndex] = {
          ...current,
          quantity: current.quantity + quantity,
        }
        return updated
      }
      return [...prev, { product, quantity }]
    })
    setIsOpen(true)
  }, [])

  const removeItem = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((i) => i.product.id !== productId))
      return
    }
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i)),
    )
  }, [])

  const clearCart = useCallback(() => {
    setItems([])
  }, [])

  const openCart = useCallback(() => {
    setIsOpen(true)
  }, [])

  const closeCart = useCallback(() => {
    setIsOpen(false)
  }, [])

  const toggleCart = useCallback(() => {
    setIsOpen((v) => !v)
  }, [])

  const sendOrderToWhatsApp = useCallback(() => {
    if (items.length === 0) return
    const lines = items.map((i) => ({
      name: i.product.name,
      quantity: i.quantity,
      price: i.product.price,
    }))
    const url = getCartWhatsAppUrl(lines, totalPrice)
    window.open(url, '_blank', 'noopener,noreferrer')
  }, [items, totalPrice])

  const value = useMemo(
    () => ({
      items,
      totalCount,
      totalPrice,
      isOpen,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
      toggleCart,
      sendOrderToWhatsApp,
    }),
    [
      items,
      totalCount,
      totalPrice,
      isOpen,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      openCart,
      closeCart,
      toggleCart,
      sendOrderToWhatsApp,
    ],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return ctx
}
