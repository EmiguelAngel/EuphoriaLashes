import { ChevronLeft } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { getProduct, subscribeProducts } from '../lib/products'
import type { Product } from '../lib/types'
import { productImageSrc } from '../lib/imageUrl'

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

function StockPill({ stock }: { stock: number }) {
  const isLow = stock < 3
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-3 py-1.5 text-sm font-medium',
        isLow ? 'bg-[color:var(--el-alert)]/15 text-[color:var(--el-alert)]' : 'bg-black/5 text-neutral-700',
      ].join(' ')}
    >
      Quedan {stock} unidades
    </span>
  )
}

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<Product | null>(null)
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
      const p = await getProduct(id)
      setProduct(p)
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

  const mainSrc = gallery[active] ?? null

  return (
    <div className="min-h-dvh bg-[color:var(--el-bg)]">
      <header className="border-b border-black/5 bg-white/60 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-sm font-semibold text-neutral-900 shadow-sm ring-1 ring-black/10 transition hover:bg-black/5"
          >
            <ChevronLeft className="h-4 w-4" />
            Volver
          </Link>
          <div className="text-sm font-semibold text-neutral-800">Detalle del producto</div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 py-8">
        {loading ? (
          <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5">
            <div className="h-80 animate-pulse rounded-xl bg-black/5" />
            <div className="h-6 w-2/3 animate-pulse rounded-lg bg-black/5" />
            <div className="h-4 w-full animate-pulse rounded-lg bg-black/5" />
          </div>
        ) : null}

        {error && !loading ? (
          <div className="rounded-xl bg-white p-6 text-sm text-red-700 shadow-sm ring-1 ring-red-200">{error}</div>
        ) : null}

        {!loading && product ? (
          <article className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5">
            <div className="relative min-h-[min(70vh,520px)] bg-black/[0.04]">
              {mainSrc ? (
                <img src={mainSrc} alt={product.name} className="mx-auto h-full max-h-[min(70vh,520px)] w-full object-contain p-4" />
              ) : (
                <div className="flex min-h-[320px] items-center justify-center text-neutral-500">Sin imágenes</div>
              )}
            </div>

            {gallery.length > 1 ? (
              <div className="flex gap-2 overflow-x-auto border-t border-black/5 p-3">
                {gallery.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setActive(i)}
                    className={[
                      'h-20 w-20 shrink-0 overflow-hidden rounded-lg ring-2 transition',
                      i === active ? 'ring-[color:var(--el-primary)]' : 'ring-transparent hover:ring-black/20',
                    ].join(' ')}
                  >
                    <img src={src} alt="" className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            ) : null}

            <div className="space-y-4 p-6">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{product.name}</h1>
                <div className="text-xl font-bold text-[color:var(--el-primary-strong)]">{formatPrice(product.price)}</div>
              </div>
              <StockPill stock={product.stock} />
              {product.description ? (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">{product.description}</p>
              ) : (
                <p className="text-sm text-neutral-500">Sin descripción detallada.</p>
              )}
            </div>
          </article>
        ) : null}
      </main>
    </div>
  )
}
