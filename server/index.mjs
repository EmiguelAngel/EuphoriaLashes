import http from 'node:http'
import { createHmac, timingSafeEqual } from 'node:crypto'
import express from 'express'
import cors from 'cors'
import multer from 'multer'
import bcrypt from 'bcrypt'
import { Server } from 'socket.io'
import { z } from 'zod'
import { v2 as cloudinary } from 'cloudinary'
import { pool } from './db.mjs'

const PORT = Number(process.env.PORT || 5174)
const AUTH_SECRET = String(process.env.AUTH_SECRET || 'euphoria-dev-secret-change-me')
const TOKEN_TTL_SECONDS = 60 * 60 * 12
const CLOUDINARY_UPLOAD_FOLDER = String(process.env.CLOUDINARY_UPLOAD_FOLDER || 'euphoria-lashes').trim()
const hasCloudinaryUrl = Boolean(String(process.env.CLOUDINARY_URL || '').trim())
const hasCloudinaryNamedCreds =
  Boolean(String(process.env.CLOUDINARY_CLOUD_NAME || '').trim()) &&
  Boolean(String(process.env.CLOUDINARY_API_KEY || '').trim()) &&
  Boolean(String(process.env.CLOUDINARY_API_SECRET || '').trim())
const hasCloudinaryConfig = hasCloudinaryUrl || hasCloudinaryNamedCreds
if (hasCloudinaryConfig) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  })
}

const app = express()
app.set('trust proxy', true)
app.use(cors({ origin: true }))
app.use(express.json({ limit: '1mb' }))

const loginSchema = z.object({
  email: z.string().trim().transform((s) => s.toLowerCase()).pipe(z.string().email()),
  password: z.string().min(1),
})

const ProductSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  price: z.number(),
  stock: z.number().int(),
  image_url: z.string().nullable().optional(),
  images: z.array(z.string()).optional(),
})

function parseImagesFromRow(row) {
  const raw = row.images
  if (raw == null) return []
  if (Array.isArray(raw)) return raw.filter((x) => typeof x === 'string' && x.trim())
  return []
}

function normalizeImagesPayload(body) {
  let imgs = []
  if (Array.isArray(body.images) && body.images.length) {
    imgs = body.images.map((x) => String(x).trim()).filter(Boolean)
  }
  if (!imgs.length && body.image_url != null && String(body.image_url).trim()) {
    imgs = [String(body.image_url).trim()]
  }
  const image_url = imgs[0] ?? null
  return { images: imgs, image_url }
}

function applyGalleryPatch(patch) {
  const hasImages = Object.prototype.hasOwnProperty.call(patch, 'images')
  const hasUrl = Object.prototype.hasOwnProperty.call(patch, 'image_url')
  if (!hasImages && !hasUrl) return patch
  const next = { ...patch }
  if (hasImages && Array.isArray(next.images)) {
    const imgs = next.images.map((x) => String(x).trim()).filter(Boolean)
    next.images = imgs
    next.image_url = imgs[0] ?? null
    return next
  }
  if (hasUrl) {
    if (next.image_url == null || String(next.image_url).trim() === '') {
      next.images = []
      next.image_url = null
    } else {
      const u = String(next.image_url).trim()
      next.images = [u]
      next.image_url = u
    }
  }
  return next
}

const allowedUploadMimes = new Map([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
])

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (allowedUploadMimes.has(file.mimetype)) cb(null, true)
    else cb(new Error('Solo se permiten imágenes JPG, PNG, WEBP o GIF'))
  },
})

function uploadBufferToCloudinary(file) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: CLOUDINARY_UPLOAD_FOLDER,
        resource_type: 'image',
      },
      (error, result) => {
        if (error) return reject(error)
        if (!result?.secure_url) return reject(new Error('Cloudinary no devolvió secure_url'))
        return resolve(result.secure_url)
      },
    )
    uploadStream.end(file.buffer)
  })
}

function mapProduct(row) {
  let images = parseImagesFromRow(row)
  if (!images.length && row.image_url && String(row.image_url).trim()) {
    images = [String(row.image_url).trim()]
  }
  const image_url = images[0] ?? null
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    price: Number(row.price),
    stock: row.stock,
    image_url,
    images,
    created_at: row.created_at,
  }
}

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: true } })

function broadcastProductsChanged() {
  io.emit('products:changed')
}

function signPayload(payloadB64) {
  return createHmac('sha256', AUTH_SECRET).update(payloadB64).digest('base64url')
}

function createAuthToken(subjectEmail) {
  const exp = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS
  const payloadB64 = Buffer.from(JSON.stringify({ sub: subjectEmail, exp }), 'utf8').toString('base64url')
  const signature = signPayload(payloadB64)
  return `${payloadB64}.${signature}`
}

function isValidToken(token) {
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [payloadB64, signature] = parts
  const expected = signPayload(payloadB64)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length) return false
  if (!timingSafeEqual(a, b)) return false
  try {
    const raw = Buffer.from(payloadB64, 'base64url').toString('utf8')
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return false
    if (typeof parsed.exp !== 'number') return false
    if (typeof parsed.sub !== 'string' || !parsed.sub.trim()) return false
    return parsed.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

function requireAdmin(req, res, next) {
  const raw = req.headers.authorization
  if (!raw || !raw.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'No autorizado' })
  }
  const token = raw.slice('Bearer '.length).trim()
  if (!isValidToken(token)) {
    return res.status(401).json({ error: 'Sesión inválida o expirada' })
  }
  next()
}

app.get('/api/health', (_req, res) => res.json({ ok: true }))

app.post('/api/auth/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Correo o contraseña inválidos' })
  const { email, password } = parsed.data

  try {
    const { rows } = await pool.query(
      'select id, email, password_hash from public.admin_users where lower(email) = lower($1) limit 1',
      [email],
    )
    const row = rows[0]
    if (!row) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    const ok = await bcrypt.compare(password, row.password_hash)
    if (!ok) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' })
    return res.json({ token: createAuthToken(row.email) })
  } catch (e) {
    return res.status(500).json({ error: e instanceof Error ? e.message : 'Error de servidor' })
  }
})

app.get('/api/auth/verify', requireAdmin, (_req, res) => {
  res.json({ ok: true })
})

app.post('/api/upload', requireAdmin, (req, res) => {
  upload.single('image')(req, res, (err) => {
    if (err) {
      const msg = err instanceof Error ? err.message : 'Error al subir'
      return res.status(400).json({ error: msg })
    }
    if (!req.file) return res.status(400).json({ error: 'Falta el archivo' })
    if (!hasCloudinaryConfig) {
      return res.status(500).json({
        error:
          'Cloudinary no está configurado. Define CLOUDINARY_URL o CLOUDINARY_CLOUD_NAME/CLOUDINARY_API_KEY/CLOUDINARY_API_SECRET.',
      })
    }
    uploadBufferToCloudinary(req.file)
      .then((url) => res.json({ url }))
      .catch((uploadErr) => {
        const msg = uploadErr instanceof Error ? uploadErr.message : 'Error subiendo a Cloudinary'
        res.status(502).json({ error: msg })
      })
  })
})

app.get('/api/products', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : ''
  try {
    const { rows } = await pool.query(
      search
        ? 'select * from public.products where name ilike $1 order by created_at desc'
        : 'select * from public.products order by created_at desc',
      search ? [`%${search}%`] : [],
    )
    res.json(rows.map(mapProduct))
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'DB error' })
  }
})

app.get('/api/products/:id', async (req, res) => {
  const id = req.params.id
  try {
    const { rows } = await pool.query('select * from public.products where id = $1', [id])
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })
    res.json(mapProduct(rows[0]))
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'DB error' })
  }
})

app.post('/api/products', requireAdmin, async (req, res) => {
  const parsed = ProductSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const p = parsed.data
  const { images, image_url } = normalizeImagesPayload(p)
  try {
    const { rows } = await pool.query(
      'insert into public.products (name, description, price, stock, image_url, images) values ($1,$2,$3,$4,$5,$6::jsonb) returning *',
      [p.name, p.description ?? null, p.price, p.stock, image_url, JSON.stringify(images)],
    )
    broadcastProductsChanged()
    res.status(201).json(mapProduct(rows[0]))
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'DB error' })
  }
})

app.patch('/api/products/:id', requireAdmin, async (req, res) => {
  const id = req.params.id
  const parsed = ProductSchema.partial().safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const patch = applyGalleryPatch(parsed.data)
  const fields = []
  const values = []
  let i = 1
  for (const [k, v] of Object.entries(patch)) {
    if (k === 'images') {
      fields.push(`images = $${i++}::jsonb`)
      values.push(JSON.stringify(Array.isArray(v) ? v : []))
      continue
    }
    fields.push(`${k} = $${i++}`)
    values.push(v ?? null)
  }
  if (fields.length === 0) return res.status(400).json({ error: 'Empty patch' })
  values.push(id)

  try {
    const { rows } = await pool.query(
      `update public.products set ${fields.join(', ')} where id = $${i} returning *`,
      values,
    )
    if (!rows[0]) return res.status(404).json({ error: 'Not found' })
    broadcastProductsChanged()
    res.json(mapProduct(rows[0]))
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'DB error' })
  }
})

app.delete('/api/products/:id', requireAdmin, async (req, res) => {
  const id = req.params.id
  try {
    await pool.query('delete from public.products where id = $1', [id])
    broadcastProductsChanged()
    res.status(204).end()
  } catch (e) {
    res.status(500).json({ error: e instanceof Error ? e.message : 'DB error' })
  }
})

server.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`)
})
