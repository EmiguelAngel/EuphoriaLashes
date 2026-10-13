import { X, Trash2, Plus, Minus, MessageCircle, ShoppingBag, ArrowRight } from 'lucide-react'
import { useEffect } from 'react'
import { useCart } from '../lib/cart'
import { formatPrice } from '../lib/format'
import { productImageSrc } from '../lib/imageUrl'

export function CartDrawer() {
  const {
    items,
    isOpen,
    closeCart,
    totalCount,
    totalPrice,
    updateQuantity,
    removeItem,
    clearCart,
    sendOrderToWhatsApp,
  } = useCart()

  // Cerrar con Escape
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') closeCart()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [isOpen, closeCart])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] transition-opacity"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        aria-label="Carrito de compras"
        className="fixed inset-y-0 right-0 flex max-w-full pl-10"
      >
        <div className="flex w-screen max-w-md flex-col bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-black/[0.06] px-5 py-4">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-[color:var(--el-primary)]">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-neutral-900 font-serif-luxury">
                  Tu Carrito
                </h2>
                <span className="text-xs text-neutral-500 font-medium">
                  {totalCount === 1 ? '1 producto seleccionado' : `${totalCount} productos seleccionados`}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={closeCart}
              className="rounded-xl p-2 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700 active:scale-95 transition-all"
              aria-label="Cerrar carrito"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-5 py-4">
            {items.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center text-center py-12">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-neutral-100 text-neutral-400 mb-4">
                  <ShoppingBag className="h-8 w-8 stroke-[1.5]" />
                </div>
                <h3 className="text-sm font-bold text-neutral-900">Tu carrito está vacío</h3>
                <p className="mt-1 text-xs text-neutral-500 max-w-xs">
                  Agrega los modelos de pestañas que más te gusten y pídelos todos juntos por WhatsApp.
                </p>
                <button
                  type="button"
                  onClick={closeCart}
                  className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#ba4f78] px-4 py-2.5 text-xs font-bold text-white shadow-xs transition hover:bg-[#9e3660] active:scale-95"
                >
                  <span>Explorar modelos</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <ul className="divide-y divide-black/[0.04]">
                {items.map(({ product, quantity }) => {
                  const imgs = product.images?.length
                    ? product.images
                    : product.image_url
                      ? [product.image_url]
                      : []
                  const imgSrc = productImageSrc(imgs[0] ?? null)

                  return (
                    <li key={product.id} className="flex gap-3.5 py-4">
                      {/* Imagen */}
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-50 ring-1 ring-black/[0.06]">
                        {imgSrc ? (
                          <img
                            src={imgSrc}
                            alt={product.name}
                            className="h-full w-full object-contain p-1"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-neutral-400">
                            Sin foto
                          </div>
                        )}
                      </div>

                      {/* Detalles */}
                      <div className="flex flex-1 flex-col justify-between">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-bold text-neutral-900 line-clamp-2">
                            {product.name}
                          </h4>
                          <button
                            type="button"
                            onClick={() => removeItem(product.id)}
                            className="rounded-lg p-1 text-neutral-400 hover:bg-rose-50 hover:text-red-600 transition"
                            title="Quitar producto"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                          {/* Controles de cantidad */}
                          <div className="flex items-center rounded-lg border border-black/10 bg-neutral-50 p-0.5">
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity - 1)}
                              className="rounded-md p-1 text-neutral-600 hover:bg-white active:scale-90 transition"
                              title="Reducir cantidad"
                            >
                              <Minus className="h-3 w-3" />
                            </button>
                            <span className="w-6 text-center text-xs font-bold text-neutral-900 tabular-nums">
                              {quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(product.id, quantity + 1)}
                              className="rounded-md p-1 text-neutral-600 hover:bg-white active:scale-90 transition"
                              title="Aumentar cantidad"
                            >
                              <Plus className="h-3 w-3" />
                            </button>
                          </div>

                          {/* Precio subtotal por producto */}
                          <span className="text-xs font-bold text-[#ba4f78] tabular-nums">
                            {formatPrice(product.price * quantity)}
                          </span>
                        </div>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>

          {/* Footer con Total y Enviar a WhatsApp */}
          {items.length > 0 && (
            <div className="border-t border-black/[0.06] bg-neutral-50/70 p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-neutral-600">Total estimado:</span>
                <span className="text-lg font-black text-neutral-900 tabular-nums font-serif-luxury">
                  {formatPrice(totalPrice)}
                </span>
              </div>

              <button
                type="button"
                onClick={sendOrderToWhatsApp}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#25D366] py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-500/20 transition-all hover:bg-[#20ba5a] hover:shadow-lg active:scale-[0.98]"
              >
                <MessageCircle className="h-5 w-5 fill-current" />
                <span>Pedir por WhatsApp</span>
              </button>

              <div className="flex items-center justify-between text-[11px] text-neutral-500 pt-1">
                <span>Envío y pago a coordinar por chat</span>
                <button
                  type="button"
                  onClick={clearCart}
                  className="font-semibold text-neutral-500 hover:text-red-600 transition"
                >
                  Vaciar carrito
                </button>
              </div>
            </div>
          )}
        </div>
      </aside>
    </div>
  )
}
