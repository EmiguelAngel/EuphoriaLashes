import { Plus, Trash2, Pencil } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { z } from 'zod'
import { Button } from '../components/Button'
import { Modal } from '../components/Modal'
import { TextField } from '../components/TextField'
import { createProduct, deleteProduct, listProducts, subscribeProducts, updateProduct } from '../lib/products'
import type { Product, ProductInsert } from '../lib/types'
import { clearAdminToken } from '../lib/auth'
import { uploadProductImage } from '../lib/upload'
import { productImageSrc } from '../lib/imageUrl'

const OptionalTextToNull = z
  .string()
  .optional()
  .transform((v) => (v ?? '').trim())
  .transform((v) => (v.length ? v : null))

function coerceEsNumber(input: unknown): number {
  if (typeof input === 'number') return input
  const raw = String(input ?? '').trim()
  if (!raw) return NaN

  // Permite formatos típicos: "35000", "35.000", "35,000", "35 000", "35.000,50"
  // y normaliza a notación JS con "." como decimal y sin separadores de miles.
  const s = raw.replace(/\s+/g, '').replace(/[^\d.,-]/g, '')

  // Caso miles con puntos: 12.345.678
  if (/^-?\d{1,3}(\.\d{3})+$/.test(s)) return Number(s.replace(/\./g, ''))
  // Caso miles con comas: 12,345,678
  if (/^-?\d{1,3}(,\d{3})+$/.test(s)) return Number(s.replace(/,/g, ''))

  // Si hay ambos, el último separador se asume decimal.
  const lastDot = s.lastIndexOf('.')
  const lastComma = s.lastIndexOf(',')
  if (lastDot !== -1 && lastComma !== -1) {
    if (lastComma > lastDot) return Number(s.replace(/\./g, '').replace(',', '.'))
    return Number(s.replace(/,/g, ''))
  }

  // Solo coma: decimal "10,5" o miles "10,000"
  if (lastComma !== -1) {
    if (/^-?\d+,\d+$/.test(s)) return Number(s.replace(',', '.'))
    return Number(s.replace(/,/g, ''))
  }

  // Solo punto: decimal "10.5" o miles "10.000"
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
  price: PriceNumber.refine((v) => Number.isFinite(v), { message: 'El precio debe ser número' }),
  stock: StockNumber.refine((v) => Number.isFinite(v), { message: 'El stock debe ser número' }),
})

type ProductFormState = {
  name: string
  description?: string
  price: string
  stock: string
}

function formatPrice(value: number) {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(value)
}

function emptyForm(): ProductFormState {
  return { name: '', description: '', price: '0', stock: '0' }
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

  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [form, setForm] = useState<ProductFormState>(emptyForm())
  /** URLs ya guardadas o subidas en esta sesión (orden = galería) */
  const [gallery, setGallery] = useState<string[]>([])
  /** Archivos pendientes de subir al guardar */
  const [pendingFiles, setPendingFiles] = useState<File[]>([])
  /** Una URL externa por línea (opcional) */
  const [extraUrls, setExtraUrls] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  const title = editing ? 'Editar producto' : 'Añadir producto'

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

  const rows = useMemo(() => products, [products])

  function openCreate() {
    setEditing(null)
    setForm(emptyForm())
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
      const payload = { ...parsed.data, images, image_url } satisfies ProductInsert
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

  function onLogout() {
    clearAdminToken()
    navigate('/admin/login', { replace: true })
  }

  return (
    <div className="min-h-dvh bg-[color:var(--el-bg)]">
      <header className="border-b border-black/5 bg-white/60 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <div className="flex items-center gap-3">
            <img src="/assets/logo.png" alt="Euphoria Lashes" className="h-10 w-10 rounded-xl bg-white p-1 ring-1 ring-black/5" />
            <div className="leading-tight">
              <div className="text-sm font-semibold tracking-tight">Administración</div>
              <div className="text-xs text-neutral-600">Gestiona tu inventario</div>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-sm ring-1 ring-black/10 transition hover:bg-black/5"
            >
              Ver tienda
            </Link>
            <Button onClick={onLogout}>Cerrar sesión</Button>
            <Button variant="primary" onClick={openCreate}>
              <Plus className="h-4 w-4" />
              Añadir
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {error ? (
          <div className="rounded-xl bg-white p-4 text-sm text-red-700 shadow-sm ring-1 ring-red-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-white shadow-sm ring-1 ring-black/5" />
            ))}
          </div>
        ) : (
          <>
            {/* Mobile-first list */}
            <div className="mt-6 grid grid-cols-1 gap-3 md:hidden">
              {rows.map((p) => (
                <div key={p.id} className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-black/5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold">{p.name}</div>
                      <div className="mt-1 text-xs text-neutral-600">
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
              ))}
            </div>

            {/* Desktop table */}
            <div className="mt-6 hidden overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 md:block">
              <table className="w-full text-left text-sm">
                <thead className="bg-black/[0.02] text-xs font-semibold text-neutral-700">
                  <tr>
                    <th className="px-4 py-3">Producto</th>
                    <th className="px-4 py-3">Precio</th>
                    <th className="px-4 py-3">Stock</th>
                    <th className="px-4 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {rows.map((p) => (
                    <tr key={p.id} className="align-top">
                      <td className="px-4 py-3">
                        <div className="font-semibold">{p.name}</div>
                        {p.description ? (
                          <div className="mt-1 line-clamp-1 text-xs text-neutral-600">{p.description}</div>
                        ) : null}
                      </td>
                      <td className="px-4 py-3 font-semibold text-[color:var(--el-primary-strong)]">
                        {formatPrice(p.price)}
                      </td>
                      <td className="px-4 py-3">{p.stock}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-2">
                          <Button onClick={() => openEdit(p)} className="px-3" type="button">
                            <Pencil className="h-4 w-4" />
                            Editar
                          </Button>
                          <Button variant="danger" onClick={() => void onDelete(p)} className="px-3" type="button">
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {rows.length === 0 ? (
              <div className="mt-10 rounded-xl bg-white p-6 text-center text-sm text-neutral-600 shadow-sm ring-1 ring-black/5">
                No hay productos. Añade el primero.
              </div>
            ) : null}
          </>
        )}
      </main>

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
        <div className="grid grid-cols-1 gap-3">
          <TextField
            label="Nombre"
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            error={fieldErrors.name}
            placeholder='Ej. "Pestañas Mink 3D"'
          />

          <TextField
            label="Descripción"
            value={form.description ?? ''}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            error={fieldErrors.description}
            placeholder="Opcional"
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
            <div className="text-xs font-medium text-neutral-700">Galería de imágenes</div>
            {fieldErrors.gallery ? <div className="text-xs text-[color:var(--el-alert)]">{fieldErrors.gallery}</div> : null}
            {gallery.length ? (
              <div className="flex flex-wrap gap-2">
                {gallery.map((url, idx) => {
                  const src = productImageSrc(url)
                  return (
                    <div key={`${url}-${idx}`} className="relative h-20 w-20 overflow-hidden rounded-lg ring-1 ring-black/10">
                      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : null}
                      <button
                        type="button"
                        className="absolute right-0.5 top-0.5 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-semibold text-white"
                        onClick={() => setGallery((g) => g.filter((_, i) => i !== idx))}
                      >
                        ✕
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-xs text-neutral-500">Aún no hay imágenes en la galería.</div>
            )}
          </div>

          <label className="block space-y-1">
            <div className="text-xs font-medium text-neutral-700">Subir imágenes (varias)</div>
            <input
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block w-full text-sm text-neutral-700 file:mr-3 file:rounded-lg file:border-0 file:bg-[color:var(--el-primary)] file:px-3 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[color:var(--el-primary-strong)]"
              onChange={(e) => {
                const next = Array.from(e.target.files ?? [])
                setPendingFiles((prev) => [...prev, ...next])
                e.target.value = ''
              }}
            />
            <div className="text-xs text-neutral-500">Se suben al guardar. Máx. 5 MB por archivo.</div>
          </label>

          {pendingFiles.length ? (
            <ul className="space-y-1 rounded-xl bg-black/[0.03] p-3 text-xs text-neutral-700">
              {pendingFiles.map((f, i) => (
                <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-2">
                  <span className="truncate">{f.name}</span>
                  <button type="button" className="shrink-0 text-[color:var(--el-alert)]" onClick={() => setPendingFiles((p) => p.filter((_, j) => j !== i))}>
                    Quitar
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <label className="block space-y-1">
            <div className="text-xs font-medium text-neutral-700">URLs externas extra (opcional, una por línea)</div>
            <textarea
              value={extraUrls}
              onChange={(e) => setExtraUrls(e.target.value)}
              rows={3}
              placeholder={'https://…\nhttps://…'}
              className="w-full rounded-xl bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-black/10 outline-none transition focus:ring-2 focus:ring-[color:var(--el-primary)]"
            />
          </label>
        </div>
      </Modal>
    </div>
  )
}

