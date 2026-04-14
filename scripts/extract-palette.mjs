import fs from 'node:fs'
import path from 'node:path'
import { PNG } from 'pngjs'

const root = process.cwd()
const defaultLogo = path.join(root, 'public', 'assets', 'logo.png')

function hex(rgb) {
  return `#${rgb.map((v) => v.toString(16).padStart(2, '0')).join('')}`
}

function dist(a, b) {
  const dr = a[0] - b[0]
  const dg = a[1] - b[1]
  const db = a[2] - b[2]
  return Math.sqrt(dr * dr + dg * dg + db * db)
}

function quantize([r, g, b], step = 8) {
  return [Math.floor(r / step) * step, Math.floor(g / step) * step, Math.floor(b / step) * step]
}

function readPng(p) {
  return new Promise((resolve, reject) => {
    fs.createReadStream(p)
      .pipe(new PNG())
      .on('parsed', function parsed() {
        resolve(this)
      })
      .on('error', reject)
  })
}

const logoPath = fs.existsSync(defaultLogo) ? defaultLogo : null
if (!logoPath) {
  console.error(
    [
      'No encontré el logo en `public/assets/logo.png`.',
      'Copia tu imagen del logo ahí (mismo nombre) y vuelve a correr:',
      '  npm run palette:extract',
    ].join('\n'),
  )
  process.exit(1)
}

const png = await readPng(logoPath)
const counts = new Map()

for (let y = 0; y < png.height; y++) {
  for (let x = 0; x < png.width; x++) {
    const idx = (png.width * y + x) << 2
    const r = png.data[idx]
    const g = png.data[idx + 1]
    const b = png.data[idx + 2]
    const a = png.data[idx + 3]
    if (a < 240) continue
    const q = quantize([r, g, b], 8)
    const key = q.join(',')
    counts.set(key, (counts.get(key) ?? 0) + 1)
  }
}

const sorted = [...counts.entries()]
  .map(([k, n]) => ({ rgb: k.split(',').map((v) => Number(v)), n }))
  .sort((a, b) => b.n - a.n)

if (sorted.length === 0) {
  console.error('No pude extraer colores del PNG (¿transparencia inesperada?).')
  process.exit(1)
}

const bg = sorted[0].rgb
const accents = sorted.filter((c) => dist(c.rgb, bg) > 30)

const palette = {
  bg: hex(bg),
  primary: accents[0] ? hex(accents[0].rgb) : hex(bg),
  primaryStrong: accents[3] ? hex(accents[3].rgb) : accents[0] ? hex(accents[0].rgb) : hex(bg),
  accent: accents[1] ? hex(accents[1].rgb) : accents[0] ? hex(accents[0].rgb) : hex(bg),
  alert: accents[2] ? hex(accents[2].rgb) : accents[0] ? hex(accents[0].rgb) : hex(bg),
}

console.log('Paleta sugerida (extraída):')
console.log(JSON.stringify(palette, null, 2))

const cssPath = path.join(root, 'src', 'styles.css')
const css = fs.readFileSync(cssPath, 'utf8')
const next = css
  .replace(/--el-bg:\\s*#[0-9a-fA-F]{6};/, `--el-bg: ${palette.bg};`)
  .replace(/--el-primary:\\s*#[0-9a-fA-F]{6};/, `--el-primary: ${palette.primary};`)
  .replace(
    /--el-primary-strong:\\s*#[0-9a-fA-F]{6};/,
    `--el-primary-strong: ${palette.primaryStrong};`,
  )
  .replace(/--el-accent:\\s*#[0-9a-fA-F]{6};/, `--el-accent: ${palette.accent};`)
  .replace(/--el-alert:\\s*#[0-9a-fA-F]{6};/, `--el-alert: ${palette.alert};`)

fs.writeFileSync(cssPath, next)
console.log(`Actualicé tokens en ${path.relative(root, cssPath)}`)

