import { Plus, Trash2, Pencil, Layers, PlusCircle, ArrowLeft } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { TextField } from '../components/TextField'
import {
  createCategory,
  deleteCategory,
  listCategories,
  createProduct,
  deleteProduct,
  listProducts,
  subscribeProducts,
  updateProduct,
} from '../lib/products'
import type { Category, Product, ProductInsert } from '../lib/types'
import { clearAdminToken } from '../lib/auth'
import { uploadProductImage } from '../lib/upload'
import { productImageSrc } from '../lib/imageUrl'
import { DEFAULT_CATEGORIES, getProductCategory, getProductModelBadge } from '../lib/categories'
import { formatPrice } from '../lib/format'

const OptionalTextToNull = z
  .string()
  .optional()
  .transform((v) => (v ?? '').trim())
  .transform((v) => (v.length ? v : null))

function coerceEsNumber(input: unknown): number {
  if (typeof input === 'number') return input
  const raw = String(input ?? '').trim()
  if (!raw) return NaN

  const s = raw.replace(/\s+/g, '').replace(/[^\d.,-]/g, '')
  if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g, ''))
  if (/^-?\d{1,3}(,\d{3})+$/.test(s)) return Number(s.replace(/,/g, ''))

  const lastDot = s.lastIndexOf('.')
  const lastComma = s.lastIndexOf(',')
  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) return Number(s.replace(/\./g, '').replace(',', '.'))
    return Number(s.replace(/,/g, ''))
  }

  if (lastComma !== -1) {
    if (/^-?\d+,\d+$/.test(s)) return Number(s.replace(',', '.'))
    return Number(s.replace(/,/g, ''))
  }

  return Number(s)
}

const PriceNumber = z.preprocess(coerceEsNumber, z.number().nonnegative('El precio debe ser >= 0'))
const StockNumber = z.preprocess(
  coerceEsNumber,
  z.number().int('El stock debe ser entero').nonnegative('El stock debe ser >= 0'),
)

const ProductSchema = z.object({
  name: z.string().trim().min(1, 'El nombre es requerido'),
  description: OptionalTextToNull,
  category: z.string().trim().min(1, 'La categoría es requerida').or(z.null()).optional(),
  price: PriceNumber.refine((v) => Number.isFinite(v), { message: 'El precio debe ser número' }),
  stock: StockNumber.refine((v) => Number.isFinite(v), { message: 'El stock debe ser número' }),
})

type ProductFormState = {
  name: string
  description?: string
  category: string
  price: string
  stock: string
}

function emptyForm(): ProductFormState {
  return { name: '', description: '', category: 'tablas', price: '0', stock: '0' }
}

function isValidImageRef(v: string) {
  const s = v.trim()
  if (!s) return false
  if (s.startsWith('/uploads/')) return true
  try {
    const u = new URL(s)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export function AdminPage() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])

  // Modal de Producto
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyForm())
  const [gallery, setGallery] = useState<string[]>([])
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  const [extraUrls, setExtraUrls] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  // Modal de Categorías / Pestañas
  const [catModalOpen, setCatModalOpen] = useState(false)
  const [newCatName, setNewCatName] = useState('')
  const [creatingCat, setCreatingCat] = useState(false)
  const [catFilter, setCatFilter] = useState('all')

  const title = editing ? 'Editar producto' : 'Añadir producto'

  async function refresh() {
    setError(null)
    try {
      const [prods, cats] = await Promise.all([listProducts(), listCategories()])
      setProducts(prods)
      setCategories(cats.length > 0 ? cats : DEFAULT_CATEGORIES.map((c, i) => ({ id: c.id, name: c.name, position: i + 1 })))
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
  }, [])

  // Lista de categorías combinada
  const allCategories = useMemo(() => {
    return categories.length > 0 ? categories : DEFAULT_CATEGORIES.map((c, i) => ({ id: c.id, name: c.name, position: i + 1 }))
  }, [categories])

  const rows = useMemo(() => {
    if (catFilter === 'all') return products
    return products.filter((p) => getProductCategory(p) === catFilter)
  }, [products, catFilter])

  function openCreate() {
    setEditing(null)
    setForm({
      ...emptyForm(),
      category: allCategories[0]?.id || 'tablas',
    })
    setGallery([])
    setPendingFiles([])
    setExtraUrls('')
    setFieldErrors({})
    setModalOpen(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      name: p.name,
      description: p.description ?? '',
      category: getProductCategory(p),
      price: String(p.price),
      stock: String(p.stock),
    })
    const imgs = p.images?.length ? p.images : p.image_url ? [p.image_url] : []
    setGallery(imgs)
    setPendingFiles([])
    setExtraUrls('')
    setFieldErrors({})
    setModalOpen(true)
  }

  function closeModal() {
    if (saving) return
    setModalOpen(false)
  }

  async function onDelete(p: Product) {
    const ok = window.confirm(`¿Eliminar "${p.name}"? Esta acción no se puede deshacer.`)
    if (!ok) return
    try {
      await deleteProduct(p.id)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar')
    }
  }

  async function onSubmit() {
    setFieldErrors({})
    const parsed = ProductSchema.safeParse(form)
    if (!parsed.success) {
      const next: Record<string, string> = {}
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]
        if (typeof key === 'string' && !next[key]) next[key] = issue.message
      }
      setFieldErrors(next)
      return
    }

    setSaving(true)
    setError(null)
    try {
      const fromLines = extraUrls
        .split('\n')
        .map((s) => s.trim())
        .filter(Boolean)
      for (const u of [...gallery, ...fromLines]) {
        if (!isValidImageRef(u)) {
          setFieldErrors({ gallery: 'Alguna URL o ruta de imagen no es válida' })
          setSaving(false)
          return
        }
      }
      const uploaded: string[] = []
      for (const f of pendingFiles) {
        uploaded.push(await uploadProductImage(f))
      }
      const images = [...gallery, ...fromLines, ...uploaded]
      const image_url = images[0] ?? null
      const payload = {
        ...parsed.data,
        category: form.category?.trim() || null,
        images,
        image_url,
      } satisfies ProductInsert

      if (editing) {
        await updateProduct(editing.id, payload)
      } else {
        await createProduct(payload)
      }
      setModalOpen(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  // Crear nueva categoría desde el panel
  async function handleCreateCategory() {
    const name = newCatName.trim()
    if (!name) return
    setCreatingCat(true)
    try {
      const created = await createCategory({
        name,
        position: allCategories.length + 1,
      })
      setCategories((prev) => [...prev, created])
      setNewCatName('')
      // Asignar en el formulario de producto si estaba abierto
      setForm((f) => ({ ...f, category: created.id }))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al crear la categoría')
    } finally {
      setCreatingCat(false)
    }
  }

  // Eliminar categoría
  async function handleDeleteCategory(catId: string, catName: string) {
    const ok = window.confirm(
      `¿Eliminar la categoría "${catName}"? Los productos que la tengan pasarán a la categoría general.`,
    )
    if (!ok) return
    try {
      await deleteCategory(catId)
      setCategories((prev) => prev.filter((c) => c.id !== catId))
      await refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al eliminar categoría')
    }
  }

  function onLogout() {
    clearAdminToken()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-[color:var(--el-bg)]">
      {/* Header Admin */}
      <header className="border-b border-black/5 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5">
          <div className="flex items-center gap-3">
            <img
              src="/assets/logo.png"
              alt="Euphoria Lashes"
              className="h-10 w-10 rounded-full object-cover shadow-sm ring-2 ring-rose-200/80"
            />
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight text-neutral-900 font-serif-luxury">
                Administración Euphoria
              </div>
              <div className="text-xs text-neutral-600">Gestión de Catálogo y Pestañas</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3.5 py-2 text-xs font-semibold text-neutral-800 shadow-sm transition hover:bg-black/5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Ver tienda</span>
            </Link>

            {/* Botón para gestionar categorías / pestañas */}
            <Button onClick={() => setCatModalOpen(true)} className="px-3.5 py-2 text-xs">
              <Layers className="h-4 w-4 mr-1 text-[color:var(--el-primary)]" />
              <span>Acomodar Pestañas</span>
            </Button>

            <Button variant="primary" onClick={openCreate} className="px-3.5 py-2 text-xs">
              <Plus className="h-4 w-4 mr-1" />
              <span>Añadir Producto</span>
            </Button>

            <Button onClick={onLogout} className="px-3 py-2 text-xs text-neutral-600">
              Salir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {error ? (
          <div className="mb-6 rounded-2xl bg-white p-4 text-sm text-red-700 shadow-sm ring-1 ring-red-200">
            {error}
          </div>
        ) : null}

        {/* Barra de Filtro de Pestañas / Categorías en el Admin */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-xs font-bold text-neutral-600 uppercase tracking-wider mr-1">
              Filtrar por pestaña:
            </span>
            <button
              type="button"
              onClick={() => setCatFilter('all')}
              className={[
                'rounded-xl px-3 py-1.5 text-xs font-semibold transition',
                catFilter === 'all'
                  ? 'bg-[#ba4f78] text-white shadow-xs'
                  : 'bg-black/5 text-neutral-700 hover:bg-black/10',
              ].join(' ')}
            >
              Todas ({products.length})
            </button>

            {allCategories.map((c) => {
              const count = products.filter((p) => getProductCategory(p) === c.id).length
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCatFilter(c.id)}
                  className={[
                    'rounded-xl px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap',
                    catFilter === c.id
                      ? 'bg-[#ba4f78] text-white shadow-xs'
                      : 'bg-black/5 text-neutral-700 hover:bg-black/10',
                  ].join(' ')}
                >
                  {c.name} ({count})
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={() => setCatModalOpen(true)}
            className="text-xs font-bold text-[color:var(--el-primary-strong)] hover:underline flex items-center gap-1"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span>Crear nueva pestaña</span>
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-2xl bg-white shadow-sm ring-1 ring-black/5" />
            ))}
          </div>
        ) : (
          <>
            {/* Lista Mobile */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {rows.map((p) => {
                const catName =
                  allCategories.find((c) => c.id === getProductCategory(p))?.name ??
                  getProductCategory(p)

                return (
                  <div key={p.id} className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <span className="text-sm font-semibold text-neutral-900">{p.name}</span>
                          <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-[#ba4f78]">
                            {catName}
                          </span>
                        </div>
                        <div className="text-xs text-neutral-600">
                          {formatPrice(p.price)} · Stock: {p.stock}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Button onClick={() => openEdit(p)} className="px-3" type="button">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="danger" onClick={() => void onDelete(p)} className="px-3" type="button">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Tabla Desktop */}
            <div className="hidden overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/[0.02] text-xs font-bold uppercase tracking-wider text-neutral-600">
                  <tr>
                    <th className="px-4 py-3.5">Producto</th>
                    <th className="px-4 py-3.5">Pestaña / Categoría</th>
                    <th className="px-4 py-3.5">Modelo</th>
                    <th className="px-4 py-3.5">Precio</th>
                    <th className="px-4 py-3.5">Stock</th>
                    <th className="px-4 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {rows.map((p) => {
                    const catName =
                      allCategories.find((c) => c.id === getProductCategory(p))?.name ??
                      getProductCategory(p)

                    return (
                      <tr key={p.id} className="align-top hover:bg-neutral-50/50 transition-colors">
                        <td className="px-4 py-3.5">
                          <div className="font-bold text-neutral-900">{p.name}</div>
                          {p.description ? (
                            <div className="mt-0.5 line-clamp-1 text-xs text-neutral-600">{p.description}</div>
                          ) : null}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-full bg-rose-50 px-2.5 py-1 text-xs font-bold text-[#ba4f78] ring-1 ring-rose-200">
                            {catName}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="inline-flex rounded-full bg-neutral-100 px-2.5 py-1 text-xs font-medium text-neutral-700">
                            {getProductModelBadge(p)}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-bold text-[#ba4f78] tabular-nums">
                          {formatPrice(p.price)}
                        </td>
                        <td className="px-4 py-3.5 font-medium">{p.stock} unid.</td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button onClick={() => openEdit(p)} className="px-3" type="button">
                              <Pencil className="h-4 w-4 mr-1" />
                              Editar
                            </Button>
                            <Button variant="danger" onClick={() => void onDelete(p)} className="px-3" type="button">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {rows.length === 0 ? (
              <div className="rounded-2xl bg-white p-12 text-center text-sm text-neutral-600 shadow-sm ring-1 ring-black/5">
                No hay productos en esta categoría. Puedes añadir o reasignar uno.
              </div>
            ) : null}
          </>
        )}
      </main>

      {/* MODAL 1: EDITAR / AÑADIR PRODUCTO (Con asignación de categoría) */}
      <Modal
        open={modalOpen}
        title={title}
        onClose={closeModal}
        footer={
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button onClick={closeModal} type="button" disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => void onSubmit()} type="button" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </Button>
          </div>
        }
      >
        <div className="grid grid-cols-1 gap-3.5">
          <TextField
            label="Nombre del Producto"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            error={fieldErrors.name}
            placeholder='Ej. "Euphoria Catty"'
          />

          {/* Selector de Pestaña / Categoría */}
          <div>
            <label className="block text-xs font-semibold text-neutral-700 mb-1">
              Pestaña / Categoría donde aparecerá:
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm((s) => ({ ...s, category: e.target.value }))}
              className="w-full rounded-xl border border-black/10 bg-white px-3 py-2 text-sm text-neutral-800 shadow-xs outline-none focus:ring-2 focus:ring-[#ba4f78]"
            >
              {allCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-neutral-600">
              El producto se mostrará en esta pestaña en la tienda principal.
            </p>
          </div>

          <TextField
            label="Descripción"
            value={form.description ?? ''}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            error={fieldErrors.description}
            placeholder="Detalles sobre efectos, pares o curvas..."
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <TextField
              label="Precio"
              value={form.price}
              onChange={(e) => setForm((s) => ({ ...s, price: e.target.value }))}
              error={fieldErrors.price}
              inputMode="decimal"
            />
            <TextField
              label="Stock"
              value={form.stock}
              onChange={(e) => setForm((s) => ({ ...s, stock: e.target.value }))}
              error={fieldErrors.stock}
              inputMode="numeric"
            />
          </div>

          <div className="space-y-2">
            <div className="text-xs font-semibold text-neutral-700">Galería de imágenes</div>
            {fieldErrors.gallery ? <div className="text-xs text-[color:var(--el-alert)]">{fieldErrors.gallery}</div> : null}
            {gallery.length ? (
              <div className="flex flex-wrap gap-2">
                {gallery.map((url, idx) => {
                  const src = productImageSrc(url)
                  return (
                    <div key={`${url}-${idx}`} className="relative h-20 w-20 overflow-hidden rounded-xl ring-1 ring-black/10">
                      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : null}
                      <button
                        type="button"
                        className="absolute right-1 top-1 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-black"
                        onClick={() => setGallery((g) => g.filter((_, i) => i !== idx))}
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-xs text-neutral-600">Aún no hay imágenes en la galería.</div>
            )}
          </div>

          <label className="block space-y-1">
            <div className="text-xs font-semibold text-neutral-700">Subir imágenes</div>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block w-full text-xs text-neutral-700 file:mr-3 file:rounded-xl file:border-0 file:bg-[#ba4f78] file:px-3 file:py-2 file:text-xs file:font-bold file:text-white hover:file:bg-[#9e3660]"
              onChange={(e) => {
                const next = Array.from(e.target.files ?? [])
                setPendingFiles((prev) => [...prev, ...next])
              }}
            />
          </label>

          <TextField
            label="O pegar URL de imagen externa"
            value={extraUrls}
            onChange={(e) => setExtraUrls(e.target.value)}
            placeholder="https://ejemplo.com/foto.jpg"
          />
        </div>
      </Modal>

      {/* MODAL 2: GESTIONAR PESTAÑAS / CATEGORÍAS */}
      <Modal
        open={catModalOpen}
        title="Gestionar Pestañas / Categorías"
        onClose={() => setCatModalOpen(false)}
        footer={
          <div className="flex justify-end">
            <Button variant="primary" onClick={() => setCatModalOpen(false)}>
              Cerrar
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-neutral-600 leading-relaxed">
            Aquí puedes crear nuevas pestañas para la página principal o eliminar las que no utilices. Los productos asignados a cada pestaña se agruparán automáticamente en el catálogo.
          </p>

          {/* Formulario para añadir nueva categoría */}
          <div className="rounded-xl bg-neutral-50 p-3.5 ring-1 ring-black/5">
            <label className="block text-xs font-bold text-neutral-800 mb-1.5">
              + Crear Nueva Pestaña / Categoría:
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder='Ej. "Pestañas Magnéticas", "Pegamentos"...'
                className="flex-1 rounded-xl border border-black/10 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-[#ba4f78]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    void handleCreateCategory()
                  }
                }}
              />
              <Button
                variant="primary"
                onClick={() => void handleCreateCategory()}
                disabled={creatingCat || !newCatName.trim()}
                className="px-3.5 text-xs"
              >
                {creatingCat ? 'Creando…' : 'Crear'}
              </Button>
            </div>
          </div>

          {/* Lista de categorías existentes */}
          <div className="space-y-2">
            <div className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
              Pestañas Activas ({allCategories.length}):
            </div>
            <div className="divide-y divide-black/5 rounded-xl border border-black/10 bg-white">
              {allCategories.map((c) => {
                const prodCount = products.filter((p) => getProductCategory(p) === c.id).length
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 text-xs">
                    <div>
                      <span className="font-bold text-neutral-900">{c.name}</span>
                      <span className="ml-2 text-neutral-600">({prodCount} productos)</span>
                    </div>

                    <button
                      type="button"
                      onClick={() => void handleDeleteCategory(c.id, c.name)}
                      className="rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition"
                      title="Eliminar categoría"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}
