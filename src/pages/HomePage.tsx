import { Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listProducts, subscribeProducts } from '../lib/products'
import type { Product } from '../lib/types'
import { productImageSrc } from '../lib/imageUrl'

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(value)
}

function StockPill({ stock }: { stock: number }) {
  const isLow = stock < 3
  return (
    <span
      className={[
        'inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium',
        isLow ? 'bg-[color:var(--el-alert)]/15 text-[color:var(--el-alert)]' : 'bg-black/5 text-neutral-700',
      ].join(' ')}
    >
      Quedan {stock} unidades
    </span>
  )
}

function ProductCard({ p }: { p: Product }) {
  const imgSrc = productImageSrc(p.image_url)
  return (
    <div className="group overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 transition hover:shadow-md">
      <div className="aspect-[4/3] w-full overflow-hidden bg-black/5">
        {imgSrc ? (
          <img
            src={imgSrc}
            alt={p.name}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-neutral-500">
            Sin imagen
          </div>
        )}
      </div>

      <div className="space-y-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-sm font-semibold leading-snug">{p.name}</h3>
          <div className="shrink-0 text-sm font-semibold text-[color:var(--el-primary-strong)]">
            {formatPrice(p.price)}
          </div>
        </div>

        {p.description ? <p className="line-clamp-2 text-xs text-neutral-600">{p.description}</p> : null}

        <div className="pt-1">
          <StockPill stock={p.stock} />
        </div>
      </div>
    </div>
  )
}

export function HomePage() {
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return products
    return products.filter((p) => p.name.toLowerCase().includes(q))
  }, [products, query])

  async function refresh() {
    setError(null)
    try {
      const data = await listProducts()
      setProducts(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    const unsub = subscribeProducts(() => void refresh())
    return () => unsub()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div className="min-h-dvh bg-[color:var(--el-bg)]">
      <header className="border-b border-black/5 bg-white/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <img src="/assets/logo.png" alt="Euphoria Lashes" className="h-10 w-10 rounded-xl bg-white p-1 ring-1 ring-black/5" />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">Euphoria Lashes</div>
              <div className="text-xs text-neutral-600">Accesorios premium para pestañas</div>
            </div>
          </div>

          <div className="ml-auto w-full max-w-md">
            <label className="group flex items-center gap-2 rounded-xl bg-white px-3 py-2 shadow-sm ring-1 ring-black/10 focus-within:ring-2 focus-within:ring-[color:var(--el-primary)]">
              <Search className="h-4 w-4 text-neutral-500" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por nombre…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-neutral-400"
                inputMode="search"
              />
            </label>
          </div>
          <Link
            to="/admin"
            className="shrink-0 rounded-xl bg-[color:var(--el-primary)] px-4 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-black/10 transition hover:bg-[color:var(--el-primary-strong)]"
          >
            Ir a Admin
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {error ? (
          <div className="rounded-xl bg-white p-4 text-sm text-red-700 shadow-sm ring-1 ring-red-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-black/5" />
            ))}
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}

        {!loading && filtered.length === 0 ? (
          <div className="mt-10 rounded-xl bg-white p-6 text-center text-sm text-neutral-600 shadow-sm ring-1 ring-black/5">
            No se encontraron productos.
          </div>
        ) : null}
      </main>
    </div>
  )
}

