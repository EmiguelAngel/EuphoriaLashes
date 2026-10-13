import { Eye, MessageCircle, Star } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Product } from '../lib/types'
import { productImageSrc } from '../lib/imageUrl'
import { getProductModelBadge } from '../lib/categories'
import { formatPrice } from '../lib/format'
import { getProductWhatsAppUrl } from '../lib/whatsapp'

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export function ProductCard({ product, priority = false }: ProductCardProps) {
  const imgs = product.images?.length ? product.images : product.image_url ? [product.image_url] : []
  const imgSrc = productImageSrc(imgs[0] ?? null)
  const modelBadge = getProductModelBadge(product)
  const isOutOfStock = product.stock <= 0
  const whatsappUrl = getProductWhatsAppUrl(product.name, product.price)

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl bg-white p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] ring-1 ring-black/[0.06] transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_12px_24px_rgba(214,122,157,0.12)] hover:ring-[color:var(--el-primary)]/40">
      {/* Insignia superior: Stock / Descuento estilo ref image */}
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

        {/* Acciones flotantes al pasar el cursor (Estilo referencia: Ver + WhatsApp directo) */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-2 opacity-0 transition-opacity duration-200 group-hover:pointer-events-auto group-hover:opacity-100 bg-white/40 backdrop-blur-[2px]">
          <Link
            to={`/product/${product.id}`}
            title="Ver detalles"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-neutral-800 shadow-md ring-1 ring-black/10 transition-transform hover:scale-110 active:scale-95"
          >
            <Eye className="h-4 w-4" />
          </Link>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            title="Pedir por WhatsApp"
            className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#25D366] text-white shadow-md transition-transform hover:scale-110 active:scale-95"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        </div>
      </div>

      {/* Información del producto centrada (como en la referencia) */}
      <div className="mt-4 flex flex-1 flex-col items-center text-center">
        <Link
          to={`/product/${product.id}`}
          className="line-clamp-1 text-sm font-bold text-neutral-900 transition-colors hover:text-[color:var(--el-primary-strong)] sm:text-base"
        >
          {product.name}
        </Link>

        {/* Estrellas decorativas de calidad (exacto como la imagen de referencia) */}
        <div className="mt-1.5 flex items-center gap-0.5 text-[#e59bb6]">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} className="h-3.5 w-3.5 fill-current" />
          ))}
        </div>

        {/* Precio en tipografía limpia y tabular */}
        <div className="mt-2 text-sm font-bold text-[#ba4f78] tabular-nums sm:text-base">
          {formatPrice(product.price)}
        </div>

        {/* Botón directo de WhatsApp para comprar rápido */}
        <div className="mt-3 w-full">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl border border-black/[0.08] bg-white py-2 text-xs font-semibold text-neutral-800 shadow-xs transition-colors hover:border-[#25D366] hover:bg-[#25D366] hover:text-white active:scale-[0.98]"
          >
            <MessageCircle className="h-3.5 w-3.5 text-[#25D366] group-hover:text-inherit" />
            <span>Pedir al 312 774 6386</span>
          </a>
        </div>
      </div>
    </div>
  )
}
