import { Search, X, SlidersHorizontal, Sparkles, LayoutGrid, Layers, ArrowUp } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listProducts, subscribeProducts } from '../lib/products'
import type { Product } from '../lib/types'
import {
  CATEGORIES,
  CATEGORY_KEYS,
  classifyProductCategory,
  EFFECTS_FILTER,
  matchesEffectFilter,
  type LashCategory,
  type LashEffect,
} from '../lib/categories'
import { ProductCard } from '../components/ProductCard'
import { SectionHeader } from '../components/SectionHeader'
import { CategoryHero } from '../components/CategoryHero'
import { Footer } from '../components/Footer'

type ViewMode = 'sections' | LashCategory
type SortOption = 'default' | 'price-asc' | 'price-desc' | 'name-asc'

export function HomePage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filtros y Navegación
  const [activeTab, setActiveTab] = useState<ViewMode>('sections')
  const [selectedEffect, setSelectedEffect] = useState<LashEffect>('all')
  const [onlyInStock, setOnlyInStock] = useState(false)
  const [query, setQuery] = useState('')
  const [sortBy, setSortBy] = useState<SortOption>('default')
  const [showScrollTop, setShowScrollTop] = useState(false)

  async function refresh() {
    setError(null)
    try {
      const data = await listProducts()
      setProducts(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al cargar los productos')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void refresh()
    const unsub = subscribeProducts(() => void refresh())
    return () => unsub()
  }, [])

  // Control del botón volver arriba
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Conteo base de productos por categoría
  const categoryCounts = useMemo(() => {
    const counts: Record<LashCategory, number> = {
      libros: 0,
      tablas: 0,
      enteras: 0,
      especiales: 0,
    }
    for (const p of products) {
      const cat = classifyProductCategory(p)
      counts[cat] = (counts[cat] || 0) + 1
    }
    return counts
  }, [products])

  // Filtrado y ordenación global
  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase()

    return products
      .filter((p) => {
        // Filtro de búsqueda
        if (q) {
          const matchName = p.name.toLowerCase().includes(q)
          const matchDesc = (p.description ?? '').toLowerCase().includes(q)
          if (!matchName && !matchDesc) return false
        }

        // Filtro de stock
        if (onlyInStock && p.stock <= 0) {
          return false
        }

        // Filtro de estilo / efecto
        if (selectedEffect !== 'all' && !matchesEffectFilter(p, selectedEffect)) {
          return false
        }

        // Filtro por pestaña activa (si no es 'sections')
        if (activeTab !== 'sections') {
          const cat = classifyProductCategory(p)
          if (cat !== activeTab) return false
        }

        return true
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price
        if (sortBy === 'price-desc') return b.price - a.price
        if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
        return 0 // default
      })
  }, [products, query, onlyInStock, selectedEffect, activeTab, sortBy])

  // Agrupación por categoría para la vista por secciones
  const productsByCategory = useMemo(() => {
    const map: Record<LashCategory, Product[]> = {
      libros: [],
      tablas: [],
      enteras: [],
      especiales: [],
    }

    const q = query.trim().toLowerCase()

    for (const p of products) {
      if (q) {
        const matchName = p.name.toLowerCase().includes(q)
        const matchDesc = (p.description ?? '').toLowerCase().includes(q)
        if (!matchName && !matchDesc) continue
      }

      if (onlyInStock && p.stock <= 0) continue

      if (selectedEffect !== 'all' && !matchesEffectFilter(p, selectedEffect)) continue

      const cat = classifyProductCategory(p)
      map[cat].push(p)
    }

    // Ordenar cada sección
    if (sortBy !== 'default') {
      for (const k of CATEGORY_KEYS) {
        map[k].sort((a, b) => {
          if (sortBy === 'price-asc') return a.price - b.price
          if (sortBy === 'price-desc') return b.price - a.price
          if (sortBy === 'name-asc') return a.name.localeCompare(b.name)
          return 0
        })
      }
    }

    return map
  }, [products, query, onlyInStock, selectedEffect, sortBy])

  function resetFilters() {
    setQuery('')
    setSelectedEffect('all')
    setOnlyInStock(false)
    setActiveTab('sections')
    setSortBy('default')
  }

  const hasActiveFilters = query.trim() !== '' || selectedEffect !== 'all' || onlyInStock || sortBy !== 'default'

  return (
    <div className="min-h-dvh bg-[color:var(--el-bg)] text-neutral-900">
      {/* Header Premium */}
      <header className="sticky top-0 z-40 border-b border-black/5 bg-white/80 backdrop-blur-md transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6">
          <Link to="/" onClick={() => setActiveTab('sections')} className="flex items-center gap-3">
            <img
              src="/assets/logo.png"
              alt="Euphoria Lashes"
              className="h-10 w-10 rounded-xl bg-white p-1 ring-1 ring-black/5 shadow-sm"
            />
            <div className="leading-tight">
              <div className="text-base font-bold tracking-tight text-neutral-900 font-serif-luxury">
                Euphoria Lashes
              </div>
              <div className="text-[11px] font-medium text-neutral-600">
                Catálogo Exclusivo de Pestañas
              </div>
            </div>
          </Link>

          {/* Buscador en la cabecera */}
          <div className="hidden md:block w-full max-w-sm">
            <label className="group relative flex items-center rounded-xl bg-black/[0.03] px-3 py-2 text-sm ring-1 ring-black/5 transition-all focus-within:bg-white focus-within:ring-2 focus-within:ring-[color:var(--el-primary)]">
              <Search className="h-4 w-4 text-neutral-600 transition-colors group-focus-within:text-[color:var(--el-primary)]" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar por modelo, técnica o efecto..."
                className="w-full bg-transparent pl-2.5 text-xs outline-none placeholder:text-neutral-600"
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

          <div className="flex items-center gap-2.5">
            <Link
              to="/admin"
              className="rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-700 shadow-sm transition hover:bg-black/5"
            >
              Admin
            </Link>
          </div>
        </div>

        {/* Buscador para móvil */}
        <div className="border-t border-black/5 p-3 md:hidden">
          <label className="flex items-center rounded-xl bg-black/[0.03] px-3 py-2 text-sm ring-1 ring-black/5">
            <Search className="h-4 w-4 text-neutral-600" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar modelos..."
              className="w-full bg-transparent pl-2.5 text-xs outline-none placeholder:text-neutral-600"
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
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Banner Hero & Quick Launch */}
        <CategoryHero
          categoryCounts={categoryCounts}
          activeTab={activeTab}
          onSelectCategory={(cat) => {
            setActiveTab(cat)
            const targetEl = document.getElementById('catalogo-main')
            if (targetEl) {
              targetEl.scrollIntoView({ behavior: 'smooth' })
            }
          }}
        />

        {/* CONTENEDOR PRINCIPAL DEL CATÁLOGO */}
        <div id="catalogo-main" className="scroll-mt-24 space-y-6">
          {/* BARRA DE PESTAÑAS (TABS PRINCIPALES) */}
          <div className="rounded-2xl bg-white p-2.5 shadow-sm ring-1 ring-black/5">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              {/* Tab: Ver por Secciones */}
              <button
                type="button"
                onClick={() => setActiveTab('sections')}
                className={[
                  'flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-semibold transition-all',
                  activeTab === 'sections'
                    ? 'bg-gradient-to-r from-[color:var(--el-primary)] to-[color:var(--el-primary-strong)] text-white shadow-sm'
                    : 'text-neutral-700 hover:bg-black/5',
                ].join(' ')}
              >
                <LayoutGrid className="h-4 w-4" />
                <span>Ver por Secciones</span>
                <span
                  className={[
                    'ml-1 rounded-full px-2 py-0.5 text-[11px] font-bold',
                    activeTab === 'sections' ? 'bg-white/20 text-white' : 'bg-black/5 text-neutral-700',
                  ].join(' ')}
                >
                  {products.length}
                </span>
              </button>

              {/* Tabs por cada Categoría */}
              {CATEGORY_KEYS.map((key) => {
                const meta = CATEGORIES[key]
                const count = categoryCounts[key]
                const isSelected = activeTab === key

                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setActiveTab(key)}
                    className={[
                      'flex items-center gap-2 rounded-xl px-3.5 py-2.5 text-xs sm:text-sm font-semibold transition-all',
                      isSelected
                        ? 'bg-gradient-to-r from-[color:var(--el-primary)] to-[color:var(--el-primary-strong)] text-white shadow-sm'
                        : 'text-neutral-700 hover:bg-black/5',
                    ].join(' ')}
                  >
                    <span>{meta.shortName}</span>
                    <span
                      className={[
                        'rounded-full px-2 py-0.5 text-[11px] font-bold',
                        isSelected ? 'bg-white/20 text-white' : 'bg-black/5 text-neutral-700',
                      ].join(' ')}
                    >
                      {count}
                    </span>
                  </button>
                )
              })}
            </div>

            {/* BARRA DE FILTROS SECUNDARIOS (Modelos / Efectos / Stock / Ordenación) */}
            <div className="mt-3 flex flex-col gap-3 border-t border-black/5 pt-3 lg:flex-row lg:items-center lg:justify-between">
              {/* Filtro por Estilo / Efecto */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 lg:pb-0 scrollbar-none">
                <span className="shrink-0 text-[11px] font-bold uppercase tracking-wider text-neutral-600 mr-1 flex items-center gap-1">
                  <SlidersHorizontal className="h-3 w-3" />
                  Efecto:
                </span>
                {EFFECTS_FILTER.map((ef) => (
                  <button
                    key={ef.id}
                    type="button"
                    onClick={() => setSelectedEffect(ef.id)}
                    className={[
                      'inline-flex shrink-0 items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium transition',
                      selectedEffect === ef.id
                        ? 'bg-rose-100 font-bold text-[color:var(--el-primary-strong)] ring-1 ring-rose-300'
                        : 'bg-black/[0.03] text-neutral-600 hover:bg-black/5',
                    ].join(' ')}
                  >
                    <span>{ef.icon}</span>
                    <span>{ef.label}</span>
                  </button>
                ))}
              </div>

              {/* Controles de Stock y Ordenación */}
              <div className="flex items-center justify-between sm:justify-end gap-3 text-xs">
                {/* Toggle Solo en Stock */}
                <label className="flex cursor-pointer items-center gap-2 select-none">
                  <input
                    type="checkbox"
                    checked={onlyInStock}
                    onChange={(e) => setOnlyInStock(e.target.checked)}
                    className="h-3.5 w-3.5 rounded text-[color:var(--el-primary)] focus:ring-[color:var(--el-primary)]"
                  />
                  <span className="font-semibold text-neutral-700">Solo disponibles</span>
                </label>

                {/* Selector de ordenación */}
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className="rounded-lg border border-black/10 bg-white px-2.5 py-1 text-xs font-medium text-neutral-700 outline-none focus:ring-1 focus:ring-[color:var(--el-primary)]"
                >
                  <option value="default">Recomendados</option>
                  <option value="price-asc">Precio: Menor a Mayor</option>
                  <option value="price-desc">Precio: Mayor a Menor</option>
                  <option value="name-asc">Nombre: A - Z</option>
                </select>
              </div>
            </div>
          </div>

          {/* Feedback de filtros activos */}
          {hasActiveFilters ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/70 px-4 py-2.5 text-xs shadow-sm ring-1 ring-black/5 backdrop-blur-sm">
              <div className="flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-[color:var(--el-primary-strong)]" />
                <span className="text-neutral-600">
                  Mostrando{' '}
                  <strong className="text-neutral-900">{filteredProducts.length}</strong>{' '}
                  {filteredProducts.length === 1 ? 'modelo encontrado' : 'modelos encontrados'}
                  {query && (
                    <span>
                      {' '}
                      para &ldquo;<strong>{query}</strong>&rdquo;
                    </span>
                  )}
                </span>
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="font-semibold text-[color:var(--el-primary-strong)] hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          ) : null}

          {/* Mensaje de Error */}
          {error ? (
            <div className="rounded-2xl bg-white p-5 text-sm text-red-700 shadow-sm ring-1 ring-red-200">
              {error}
            </div>
          ) : null}

          {/* Loader Skeleton */}
          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="h-96 animate-pulse rounded-2xl bg-white/70 shadow-sm ring-1 ring-black/5"
                />
              ))}
            </div>
          ) : null}

          {/* CONTENIDO 1: MODO VISTA POR SECCIONES */}
          {!loading && activeTab === 'sections' && (
            <div className="space-y-12">
              {CATEGORY_KEYS.map((key) => {
                const meta = CATEGORIES[key]
                const list = productsByCategory[key]

                if (list.length === 0 && hasActiveFilters) {
                  return null // Si hay filtros y esta sección no tiene coincidencias, se oculta limpiamente
                }

                return (
                  <section key={key} aria-labelledby={`seccion-${key}`}>
                    <SectionHeader
                      category={meta}
                      count={list.length}
                      onFilterCategory={() => {
                        setActiveTab(key)
                        window.scrollTo({ top: 350, behavior: 'smooth' })
                      }}
                      isFiltered={false}
                    />

                    {list.length === 0 ? (
                      <div className="rounded-2xl bg-white/70 p-8 text-center text-xs text-neutral-600 shadow-sm ring-1 ring-black/5">
                        No hay modelos disponibles en esta sección con los filtros actuales.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        {list.map((p) => (
                          <ProductCard key={p.id} product={p} />
                        ))}
                      </div>
                    )}
                  </section>
                )
              })}
            </div>
          )}

          {/* CONTENIDO 2: MODO VISTA POR PESTAÑA INDIVIDUAL */}
          {!loading && activeTab !== 'sections' && (
            <div>
              <SectionHeader
                category={CATEGORIES[activeTab]}
                count={filteredProducts.length}
                isFiltered={true}
              />

              {filteredProducts.length === 0 ? (
                <div className="rounded-2xl bg-white p-12 text-center text-sm shadow-sm ring-1 ring-black/5">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[color:var(--el-primary-strong)] mb-3">
                    <Layers className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-neutral-900">
                    No encontramos modelos con estos filtros
                  </h3>
                  <p className="mt-1 text-xs text-neutral-600">
                    Prueba cambiando el estilo, limpiando la búsqueda o revisando el filtro de stock.
                  </p>
                  <button
                    type="button"
                    onClick={resetFilters}
                    className="mt-4 rounded-xl bg-[color:var(--el-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[color:var(--el-primary-strong)]"
                  >
                    Restablecer filtros
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {filteredProducts.map((p) => (
                    <ProductCard key={p.id} product={p} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sin ningún resultado global */}
          {!loading && filteredProducts.length === 0 && activeTab === 'sections' && (
            <div className="rounded-2xl bg-white p-12 text-center text-sm shadow-sm ring-1 ring-black/5">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-50 text-[color:var(--el-primary-strong)] mb-3">
                <Search className="h-6 w-6" />
              </div>
              <h3 className="font-semibold text-neutral-900">
                No se encontraron modelos de pestañas
              </h3>
              <p className="mt-1 text-xs text-neutral-600">
                No hay coincidencias para tu búsqueda. Intenta con otros términos o restablece los filtros.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-4 rounded-xl bg-[color:var(--el-primary)] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[color:var(--el-primary-strong)]"
              >
                Ver todo el catálogo
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Botón flotante para volver arriba */}
      {showScrollTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 right-6 z-30 flex h-11 w-11 items-center justify-center rounded-full bg-white/95 text-neutral-800 shadow-lg ring-1 ring-black/10 backdrop-blur-md transition-all hover:bg-[color:var(--el-primary)] hover:text-white"
          aria-label="Volver arriba"
        >
          <ArrowUp className="h-5 w-5" />
        </button>
      )}

      {/* Footer */}
      <Footer
        onSelectCategory={(cat) => {
          setActiveTab(cat)
          const targetEl = document.getElementById('catalogo-main')
          if (targetEl) {
            targetEl.scrollIntoView({ behavior: 'smooth' })
          }
        }}
      />
    </div>
  )
}
