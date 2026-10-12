import { ArrowRight, Eye, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Product } from '../lib/types'
import { productImageSrc } from '../lib/imageUrl'
import { getProductModelBadge } from '../lib/categories'

import { formatPrice } from '../lib/format'

export function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-neutral-100 px-2.5 py-0.5 text-xs font-medium text-neutral-600 ring-1 ring-black/5">
        Agotado temporalmente
      </span>
    )
  }

  const isLow = stock <= 2
  return (
    <span
      className={[
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1',
        isLow
          ? 'bg-rose-50 text-[color:var(--el-primary-strong)] ring-rose-200'
          : 'bg-emerald-50 text-emerald-700 ring-emerald-200',
      ].join(' ')}
    >
      <span className={['h-1.5 w-1.5 rounded-full', isLow ? 'bg-[color:var(--el-primary-strong)]' : 'bg-emerald-500'].join(' ')} />
      {stock === 1 ? 'Última unidad' : `${stock} disponibles`}
    </span>
  )
}

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const imgs = product.images?.length ? product.images : product.image_url ? [product.image_url] : []
  const imgSrc = productImageSrc(imgs[0] ?? null)
  const modelBadge = getProductModelBadge(product)

  return (
    <Link
      to={`/product/${product.id}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(223,63,143,0.12)] hover:ring-[color:var(--el-primary)]/40"
    >
      {/* Contenedor de Imagen con aspecto equilibrado */}
      <div className="relative aspect-[4/5] w-full overflow-hidden bg-gradient-to-b from-[#fff5f9] to-[#fae6ee]/40">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={product.name}
            className="h-full w-full object-contain p-3.5 transition-transform duration-500 ease-out group-hover:scale-105"
            loading={priority ? 'eager' : 'lazy'}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-400">
            Sin imagen disponible
          </div>
        )}

        {/* Badge de Modelo / Formato flotante en la esquina */}
        <div className="absolute left-3 top-3 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-xs font-semibold tracking-wide text-neutral-800 shadow-sm backdrop-blur-md ring-1 ring-black/10">
            <Sparkles className="h-3 w-3 text-[color:var(--el-primary-strong)]" />
            {modelBadge}
          </span>
        </div>

        {/* Botón flotante rápido "Ver" en hover */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/10 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 group-hover:opacity-100">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-neutral-900 shadow-md transition-transform duration-300 group-hover:scale-105">
            <Eye className="h-3.5 w-3.5 text-[color:var(--el-primary-strong)]" />
            Ver detalles
          </span>
        </div>
      </div>

      {/* Contenido de la tarjeta */}
      <div className="flex flex-1 flex-col justify-between p-4 sm:p-5">
        <div className="space-y-1.5">
          <h3 className="line-clamp-1 text-base font-bold text-neutral-900 transition-colors group-hover:text-[color:var(--el-primary-strong)]">
            {product.name}
          </h3>

          {product.description ? (
            <p className="line-clamp-2 text-xs leading-relaxed text-neutral-600">
              {product.description}
            </p>
          ) : (
            <p className="text-xs italic text-neutral-400">Pestañas premium Euphoria</p>
          )}
        </div>

        {/* Precio y Disponibilidad */}
        <div className="mt-4 pt-3 border-t border-black/[0.04]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <span className="text-[10px] font-semibold uppercase tracking-wider text-neutral-600 block">
                Precio
              </span>
              <span className="text-base font-extrabold text-[color:var(--el-primary-strong)]">
                {formatPrice(product.price)}
              </span>
            </div>

            <div className="text-right">
              <StockBadge stock={product.stock} />
            </div>
          </div>

          <div className="mt-2.5 flex items-center justify-end text-xs font-semibold text-[color:var(--el-primary-strong)] opacity-0 transition-opacity duration-300 group-hover:opacity-100">
            <span>Explorar modelo</span>
            <ArrowRight className="ml-1 h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
          </div>
        </div>
      </div>
    </Link>
  )
}
