import { ChevronLeft, MessageCircle, Sparkles, Layers, ShieldCheck, Truck, ShoppingBag } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProduct, listProducts, subscribeProducts } from '../lib/products'
import type { Product } from '../lib/types'
import { productImageSrc } from '../lib/imageUrl'
import { getProductCategory, getCategoryMeta, getProductModelBadge } from '../lib/categories'
import { formatPrice } from '../lib/format'
import { getProductWhatsAppUrl } from '../lib/whatsapp'
import { Footer } from '../components/Footer'
import { FloatingWhatsApp } from '../components/FloatingWhatsApp'
import { ProductCard } from '../components/ProductCard'
import { useCart } from '../lib/cart'

function StockBadge({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-semibold text-neutral-600">
        Agotado temporalmente
      </span>
    )
  }
  if (stock <= 3) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800 ring-1 ring-amber-200">
        ¡Últimas {stock} unidades!
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-800 ring-1 ring-emerald-200">
      Disponible ({stock} en stock)
    </span>
  )
}

export function ProductDetailPage() {
  const { addItem, openCart, totalCount } = useCart()
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
  const [allProducts, setAllProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState(0)

  const gallery = useMemo(() => {
    if (!product) return []
    const raw = product.images?.length ? product.images : product.image_url ? [product.image_url] : []
    return raw.map((u) => productImageSrc(u)).filter((x): x is string => Boolean(x))
  }, [product])

  async function load() {
    if (!id) return
    setError(null)
    setLoading(true)
    try {
      const [p, list] = await Promise.all([getProduct(id), listProducts()])
      setProduct(p)
      setAllProducts(list)
      setActive(0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo cargar el producto')
      setProduct(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
    const unsub = subscribeProducts(() => void load())
    return () => unsub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  const category = useMemo(() => {
    if (!product) return 'tablas'
    return getProductCategory(product)
  }, [product])

  const categoryMeta = useMemo(() => getCategoryMeta(category), [category])
  const modelBadge = product ? getProductModelBadge(product) : ''

  // Otros productos de la misma sección
  const relatedProducts = useMemo(() => {
    if (!product) return []
    return allProducts
      .filter((p) => p.id !== product.id && getProductCategory(p) === category)
      .slice(0, 4)
  }, [allProducts, product, category])

  const mainSrc = gallery[active] ?? null

  return (
    <div className="min-h-dvh bg-[color:var(--el-bg)] text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 shadow-sm transition hover:bg-black/5"
          >
            <ChevronLeft className="h-4 w-4" />
            <span>Volver al Catálogo</span>
          </Link>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openCart}
              className="relative inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs font-semibold text-neutral-800 shadow-xs transition hover:bg-neutral-50 active:scale-95"
              aria-label="Abrir carrito"
            >
              <ShoppingBag className="h-4 w-4 text-[color:var(--el-primary)]" />
              <span className="hidden sm:inline">Carrito</span>
              {totalCount > 0 && (
                <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#ba4f78] px-1 text-[10px] font-bold text-white tabular-nums">
                  {totalCount}
                </span>
              )}
            </button>

            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-[color:var(--el-primary-strong)]">
              {categoryMeta.shortName}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Breadcrumb de Navegación */}
        <nav className="mb-6 flex items-center gap-2 text-xs text-neutral-600 overflow-x-auto pb-1">
          <Link to="/" className="hover:text-[color:var(--el-primary-strong)] shrink-0">
            Catálogo
          </Link>
          <span className="text-neutral-400">/</span>
          <Link to="/" className="hover:text-[color:var(--el-primary-strong)] shrink-0 font-medium text-neutral-700">
            {categoryMeta.name}
          </Link>
          <span className="text-neutral-400">/</span>
          <span className="text-neutral-900 font-semibold truncate shrink-0">
            {product?.name ?? 'Detalle'}
          </span>
        </nav>

        {loading ? (
          <div className="space-y-6 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-black/5 sm:p-10">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="aspect-square animate-pulse rounded-2xl bg-neutral-100" />
              <div className="space-y-4">
                <div className="h-8 w-2/3 animate-pulse rounded-lg bg-neutral-100" />
                <div className="h-6 w-1/3 animate-pulse rounded-lg bg-neutral-100" />
                <div className="h-24 w-full animate-pulse rounded-lg bg-neutral-100" />
              </div>
            </div>
          </div>
        ) : null}

        {error && !loading ? (
          <div className="rounded-2xl bg-white p-8 text-center text-sm text-red-700 shadow-sm ring-1 ring-red-200">
            {error}
          </div>
        ) : null}

        {!loading && product ? (
          <div className="space-y-12">
            <article className="overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5">
              <div className="grid grid-cols-1 md:grid-cols-2">
                {/* Lado izquierdo: Galería de Imágenes */}
                <div className="flex flex-col border-b border-black/5 bg-gradient-to-b from-[#fff5f9] to-[#fae6ee]/30 p-4 sm:p-8 md:border-b-0 md:border-r">
                  <div className="relative aspect-[4/5] min-h-[320px] max-h-[560px] w-full overflow-hidden rounded-2xl bg-white shadow-inner">
                    {mainSrc ? (
                      <img
                        src={mainSrc}
                        alt={product.name}
                        className="mx-auto h-full w-full object-contain p-4"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-neutral-400">
                        Sin imagen
                      </div>
                    )}

                    {/* Badge flotante en la foto */}
                    <div className="absolute left-4 top-4">
                      <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-neutral-900 shadow-sm backdrop-blur ring-1 ring-black/10">
                        <Sparkles className="h-3 w-3 text-[color:var(--el-primary-strong)]" />
                        {modelBadge}
                      </span>
                    </div>
                  </div>

                  {/* Tira de Miniaturas */}
                  {gallery.length > 1 ? (
                    <div className="mt-4 flex gap-2.5 overflow-x-auto pb-1">
                      {gallery.map((src, i) => (
                        <button
                          key={`${src}-${i}`}
                          type="button"
                          onClick={() => setActive(i)}
                          className={[
                            'h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition',
                            i === active
                              ? 'border-[color:var(--el-primary-strong)] shadow-sm'
                              : 'border-transparent bg-white hover:border-neutral-300',
                          ].join(' ')}
                        >
                          <img src={src} alt="" className="h-full w-full object-cover" />
                        </button>
                      ))}
                    </div>
                  ) : null}
                </div>

                {/* Lado derecho: Información del Producto */}
                <div className="flex flex-col justify-between p-6 sm:p-10">
                  <div className="space-y-6">
                    {/* Badge de Categoría y Disponibilidad */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-semibold text-[color:var(--el-primary-strong)] ring-1 ring-rose-200">
                        <Layers className="h-3.5 w-3.5" />
                        {categoryMeta.name}
                      </span>

                      <StockBadge stock={product.stock} />
                    </div>

                    {/* Título y Precio */}
                    <div className="space-y-2">
                      <h1 className="text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl font-serif-luxury">
                        {product.name}
                      </h1>
                      <div className="text-2xl sm:text-3xl font-extrabold text-[color:var(--el-primary-strong)]">
                        {formatPrice(product.price)}
                      </div>
                    </div>

                    {/* Descripción */}
                    <div className="space-y-2 pt-2 border-t border-black/5">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-neutral-600">
                        Descripción del modelo
                      </h2>
                      {product.description ? (
                        <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
                          {product.description}
                        </p>
                      ) : (
                        <p className="text-sm italic text-neutral-400">
                          Modelo exclusivo Euphoria Lashes sin descripción detallada.
                        </p>
                      )}
                    </div>

                    {/* Garantías y Beneficios */}
                    <div className="grid grid-cols-1 gap-2.5 rounded-2xl bg-rose-50/60 p-4 text-xs text-neutral-700 sm:grid-cols-2">
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-[color:var(--el-primary-strong)] shrink-0" />
                        <span>Fibras sintéticas premium suaves</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-[color:var(--el-primary-strong)] shrink-0" />
                        <span>Envíos seguros y confiables</span>
                      </div>
                    </div>
                  </div>

                  {/* Acciones de Contacto / Compra */}
                  <div className="mt-8 space-y-3 pt-6 border-t border-black/5">
                    <button
                      type="button"
                      onClick={() => addItem(product, 1)}
                      disabled={product.stock <= 0}
                      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#ba4f78] px-6 py-3.5 text-sm font-bold text-white shadow-md transition hover:bg-[#9e3660] hover:shadow-lg focus:outline-none active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-500"
                    >
                      <ShoppingBag className="h-5 w-5" />
                      <span>{product.stock <= 0 ? 'Agotado' : 'Agregar al carrito'}</span>
                    </button>

                    <a
                      href={getProductWhatsAppUrl(product.name, product.price)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-2xl border border-black/10 bg-white px-6 py-3 text-xs font-bold text-neutral-800 shadow-xs transition hover:bg-neutral-50 active:scale-[0.98]"
                    >
                      <MessageCircle className="h-4 w-4 text-[#25D366]" />
                      <span>O pedir directamente por WhatsApp</span>
                    </a>

                    <p className="text-center text-[11px] text-neutral-600">
                      Te atenderemos de inmediato para coordinar disponibilidad y entrega.
                    </p>
                  </div>
                </div>
              </div>
            </article>

            {/* SECCIÓN DE PRODUCTOS RELACIONADOS DE LA MISMA CATEGORÍA */}
            {relatedProducts.length > 0 && (
              <section className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg sm:text-xl font-bold text-neutral-900 font-serif-luxury">
                      Otros modelos de {categoryMeta.shortName}
                    </h3>
                    <p className="text-xs text-neutral-600">
                      Continúa descubriendo más opciones de esta misma colección
                    </p>
                  </div>

                  <Link
                    to="/"
                    className="text-xs font-semibold text-[color:var(--el-primary-strong)] hover:underline"
                  >
                    Ver catálogo completo
                  </Link>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
                  {relatedProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : null}
      </main>

      <Footer />
      {/* Botón flotante de Carrito si hay items */}
      {totalCount > 0 && (
        <aside className="fixed bottom-20 right-6 z-40">
          <button
            type="button"
            onClick={openCart}
            className="flex items-center gap-2 rounded-full bg-[#ba4f78] px-4 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-900/25 transition-all hover:bg-[#9e3660] hover:scale-105 active:scale-95"
          >
            <ShoppingBag className="h-4 w-4" />
            <span>Ver Carrito ({totalCount})</span>
          </button>
        </aside>
      )}
      <FloatingWhatsApp />
    </div>
  )
}
