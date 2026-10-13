import { Eye, ShoppingBag, Star, Check } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../lib/types'
import { productImageSrc } from '../lib/imageUrl'
import { getProductModelBadge } from '../lib/categories'
import { formatPrice } from '../lib/format'
import { useCart } from '../lib/cart'

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const { addItem, items } = useCart()
  const [justAdded, setJustAdded] = useState(false)

  const imgs = product.images?.length ? product.images : product.image_url ? [product.image_url] : []
  const imgSrc = productImageSrc(imgs[0] ?? null)
  const modelBadge = getProductModelBadge(product)
  const isOutOfStock = product.stock <= 0
  const cartItem = items.find((i) => i.product.id === product.id)
  const inCartQty = cartItem?.quantity ?? 0

  function handleAddToCart() {
    if (isOutOfStock) return
    addItem(product, 1)
    setJustAdded(true)
    setTimeout(() => setJustAdded(false), 1200)
  }

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.06] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(214,122,157,0.12)] hover:ring-[color:var(--el-primary)]/40">
      {/* Insignia superior: Stock / Descuento */}
      <div className="absolute left-3.5 top-3.5 z-10 flex items-center gap-1.5">
        {isOutOfStock ? (
          <span className="rounded-lg bg-neutral-100 px-2.5 py-0.5 text-[11px] font-semibold text-neutral-600 ring-1 ring-black/5">
            Agotado
          </span>
        ) : (
          <span className="rounded-lg bg-emerald-500 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white shadow-xs">
            {modelBadge}
          </span>
        )}
      </div>

      {/* Contenedor de Imagen con overlay de acciones */}
      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-[#fafafa]">
        <Link to={`/product/${product.id}`} className="block h-full w-full">
          {imgSrc ? (
            <img
              src={imgSrc}
              alt={product.name}
              className="h-full w-full object-contain p-3 transition-transform duration-300 ease-out group-hover:scale-105"
              loading={priority ? 'eager' : 'lazy'}
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-xs text-neutral-400">
              Sin imagen
            </div>
          )}
        </Link>

        {/* Acciones flotantes al pasar el cursor (Ver + Agregar al Carrito) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 bg-white/40 backdrop-blur-[2px]">
          <Link
            to={`/product/${product.id}`}
            title="Ver detalles"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-neutral-800 shadow-md ring-1 ring-black/10 transition-transform hover:scale-110 active:scale-95"
          >
            <Eye className="h-4 w-4" />
          </Link>

          {!isOutOfStock && (
            <button
              type="button"
              onClick={handleAddToCart}
              title="Agregar al carrito"
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ba4f78] text-white shadow-md transition-transform hover:scale-110 active:scale-95"
            >
              <ShoppingBag className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Información del producto centrada */}
      <div className="mt-4 flex flex-1 flex-col items-center text-center">
        <Link
          to={`/product/${product.id}`}
          className="line-clamp-1 text-sm font-bold text-neutral-900 transition-colors hover:text-[color:var(--el-primary-strong)] sm:text-base"
        >
          {product.name}
        </Link>

        {/* Estrellas decorativas de calidad */}
        <div className="mt-1.5 flex items-center gap-0.5 text-[#e59bb6]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-current" />
          ))}
        </div>

        {/* Precio en tipografía limpia y tabular */}
        <div className="mt-2 text-sm font-bold text-[#ba4f78] tabular-nums sm:text-base">
          {formatPrice(product.price)}
        </div>

        {/* Botón: Agregar al carrito */}
        <div className="mt-3 w-full">
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            className={[
              'inline-flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-bold transition-all active:scale-[0.98]',
              isOutOfStock
                ? 'cursor-not-allowed bg-neutral-100 text-neutral-400 border border-black/5'
                : justAdded
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'border border-black/[0.1] bg-white text-neutral-800 shadow-xs hover:border-[#ba4f78] hover:bg-[#ba4f78] hover:text-white',
            ].join(' ')}
          >
            {justAdded ? (
              <>
                <Check className="h-4 w-4" />
                <span>¡Agregado al carrito!</span>
              </>
            ) : (
              <>
                <ShoppingBag className="h-4 w-4" />
                <span>
                  {isOutOfStock
                    ? 'Agotado'
                    : inCartQty > 0
                      ? `Agregar más (${inCartQty})`
                      : 'Agregar al carrito'}
                </span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
