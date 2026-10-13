import { Search, X, Sparkles, Shield } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listCategories, listProducts, subscribeProducts } from '../lib/products'
import type { Category, Product } from '../lib/types'
import {
  DEFAULT_CATEGORIES,
  getCategoryMeta,
  getProductCategory,
  EFFECTS_FILTER,
  matchesEffectFilter,
  type LashEffect,
} from '../lib/categories'
import { ProductCard } from '../components/ProductCard'
import { CategoryBar } from '../components/CategoryBar'
import { Footer } from '../components/Footer'
import { FloatingWhatsApp } from '../components/FloatingWhatsApp'

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros activos
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [selectedEffect, setSelectedEffect] = useState<LashEffect>('all')
  const [query, setQuery] = useState('')
  const [onlyInStock, setOnlyInStock] = useState(false)

  async function loadData() {
    setError(null)
    try {
      const [prods, cats] = await Promise.all([listProducts(), listCategories()])
      setProducts(prods)
      // Si la BD tiene categorías dinámicas, úsalas; sino usa las por defecto
      setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES.map((c, i) => ({ id: c.id, name: c.name, position: i + 1 })))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
    const unsub = subscribeProducts(() => void loadData())
    return () => unsub()
  }, [])

  // Conteo de productos por categoría
  const countsByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const p of products) {
      const cat = getProductCategory(p)
      map[cat] = (map[cat] || 0) + 1
    }
    return map
  }, [products])

  // Filtrado reactivo de productos
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()

    return products.filter((p) => {
      // 1. Filtro por categoría seleccionada
      if (activeCategory !== 'all') {
        const cat = getProductCategory(p)
        if (cat !== activeCategory) return false
      }

      // 2. Filtro de búsqueda por texto
      if (q) {
        const nameMatch = p.name.toLowerCase().includes(q)
        const descMatch = (p.description ?? '').toLowerCase().includes(q)
        if (!nameMatch && !descMatch) return false
      }

      // 3. Filtro por efecto / estilo
      if (selectedEffect !== 'all' && !matchesEffectFilter(p, selectedEffect)) {
        return false
      }

      // 4. Filtro de stock
      if (onlyInStock && p.stock <= 0) {
        return false
      }

      return true
    })
  }, [products, activeCategory, query, selectedEffect, onlyInStock])

  const activeCategoryMeta = useMemo(() => {
    if (activeCategory === 'all') return null
    return getCategoryMeta(activeCategory, categories)
  }, [activeCategory, categories])

  function resetFilters() {
    setActiveCategory('all')
    setSelectedEffect('all')
    setQuery('')
    setOnlyInStock(false)
  }

  return (
    <div className="min-h-dvh bg-[#fdf4f8] text-neutral-900 antialiased font-sans">
      {/* Cabecera limpia y enfocada al comprador (Sin botón de Admin intrusivo) */}
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/85 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          {/* Logo y Nombre */}
          <Link to="/" onClick={resetFilters} className="flex items-center gap-3">
            <img
              src="/assets/logo.png"
              alt="Euphoria Lashes"
              className="h-10 w-10 rounded-full object-cover shadow-xs ring-2 ring-rose-200/80 transition-transform active:scale-95"
            />
            <div>
              <span className="text-base font-bold tracking-tight text-neutral-900 font-serif-luxury sm:text-lg">
                Euphoria Lashes
              </span>
              <span className="hidden text-[11px] font-medium text-neutral-600 sm:block">
                Catálogo Exclusivo
              </span>
            </div>
          </Link>

          {/* Barra de búsqueda interactiva */}
          <div className="w-full max-w-xs sm:max-w-md">
            <label className="relative flex items-center rounded-xl bg-neutral-100/90 px-3 py-2 text-xs ring-1 ring-black/[0.04] transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-[color:var(--el-primary)]">
              <Search className="h-4 w-4 text-neutral-600" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar modelo o técnica..."
                className="w-full bg-transparent pl-2 text-xs outline-none placeholder:text-neutral-600"
                inputMode="search"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="rounded-full p-0.5 text-neutral-600 hover:bg-neutral-200"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              ) : null}
            </label>
          </div>

          {/* Botón de Acceso al Panel de Administración */}
          <div className="flex items-center gap-2">
            <Link
              to="/admin"
              className="inline-flex items-center gap-2 rounded-xl bg-neutral-900 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-transform hover:bg-neutral-800 active:scale-95"
            >
              <Shield className="h-3.5 w-3.5 text-rose-300" />
              <span className="hidden sm:inline">Panel Admin</span>
              <span className="sm:hidden">Admin</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* FILA DE CATEGORÍAS EN TARJETAS PASTEL (Inspirada exactamente en la referencia) */}
        <section aria-label="Categorías de pestañas" className="mb-8">
          <CategoryBar
            categories={categories}
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            totalCount={products.length}
            countsByCategory={countsByCategory}
          />
        </section>

        {/* TÍTULO PRINCIPAL Y PRESENTACIÓN LIMPIA (Estilo "OUR PRODUCTS" de la imagen) */}
        <div className="mb-8 text-center">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#ba4f78]">
            {activeCategoryMeta ? activeCategoryMeta.name : 'Catálogo Completo'}
          </span>
          <h1 className="mt-1 text-2xl font-black tracking-tight text-neutral-900 sm:text-3xl font-serif-luxury">
            NUESTRAS PESTAÑAS
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-xs leading-relaxed text-neutral-600 sm:text-sm">
            {activeCategoryMeta
              ? activeCategoryMeta.description
              : 'Selecciona tu modelo favorito y haz tu pedido directo a nuestro WhatsApp con disponibilidad inmediata.'}
          </p>

          {/* Filtros sutiles de estilo y stock */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
            {EFFECTS_FILTER.map((ef) => (
              <button
                key={ef.id}
                type="button"
                onClick={() => setSelectedEffect(ef.id)}
                className={[
                  'inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-all active:scale-95',
                  selectedEffect === ef.id
                    ? 'bg-[#ba4f78] text-white shadow-xs'
                    : 'bg-white text-neutral-600 shadow-xs ring-1 ring-black/[0.06] hover:bg-neutral-50',
                ].join(' ')}
              >
                <span>{ef.icon}</span>
                <span>{ef.label}</span>
              </button>
            ))}

            <label className="ml-2 inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-semibold text-neutral-700 shadow-xs ring-1 ring-black/[0.06] select-none">
              <input
                type="checkbox"
                checked={onlyInStock}
                onChange={(e) => setOnlyInStock(e.target.checked)}
                className="h-3.5 w-3.5 rounded text-[#ba4f78] focus:ring-[#ba4f78]"
              />
              <span>Solo en stock</span>
            </label>
          </div>
        </div>

        {/* Feedback de filtros */}
        {(query || selectedEffect !== 'all' || activeCategory !== 'all' || onlyInStock) && (
          <div className="mb-6 flex items-center justify-between rounded-xl bg-white/80 px-4 py-2 text-xs shadow-xs ring-1 ring-black/[0.04]">
            <div className="flex items-center gap-2 text-neutral-600">
              <Sparkles className="h-3.5 w-3.5 text-[#ba4f78]" />
              <span>
                Mostrando <strong>{filteredProducts.length}</strong> modelos
                {activeCategory !== 'all' && <span> en {activeCategoryMeta?.name}</span>}
              </span>
            </div>
            <button
              type="button"
              onClick={resetFilters}
              className="font-bold text-[#ba4f78] hover:underline"
            >
              Ver todos
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-6 rounded-2xl bg-white p-4 text-center text-xs text-red-600 shadow-xs ring-1 ring-red-200">
            {error}
          </div>
        )}

        {/* Loader skeleton */}
        {loading && (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="aspect-[3/4] animate-pulse rounded-2xl bg-white/70 shadow-xs ring-1 ring-black/[0.04]"
              />
            ))}
          </div>
        )}

        {/* CUADRÍCULA DE PRODUCTOS (Limpia y espaciosa como en la imagen) */}
        {!loading && filteredProducts.length > 0 && (
          <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
            {filteredProducts.map((p, idx) => (
              <ProductCard key={p.id} product={p} priority={idx < 4} />
            ))}
          </div>
        )}

        {/* Sin resultados */}
        {!loading && filteredProducts.length === 0 && (
          <div className="rounded-2xl bg-white p-12 text-center shadow-xs ring-1 ring-black/[0.04]">
            <h3 className="text-sm font-bold text-neutral-900">No encontramos modelos con estos filtros</h3>
            <p className="mt-1 text-xs text-neutral-600">Prueba cambiando la categoría o limpiando la búsqueda.</p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-4 rounded-xl bg-[#ba4f78] px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-[#9e3660] active:scale-95"
            >
              Restablecer catálogo
            </button>
          </div>
        )}
      </main>

      {/* Footer sin la sección de administración */}
      <Footer categories={categories} onSelectCategory={setActiveCategory} />

      {/* Botón flotante de WhatsApp */}
      <FloatingWhatsApp />
    </div>
  )
}
