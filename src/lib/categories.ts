import type { Category, Product } from './types'

export type LashEffect = 'all' | 'volumen' | 'wispy' | 'anime' | 'feline' | 'glam'
export type LashCategory = 'libros' | 'tablas' | 'enteras' | 'especiales' | string

export interface CategoryMeta {
  id: string
  name: string
  shortName: string
  tagline: string
  description: string
  badgeText: string
  pastelBg: string
  pastelBorder: string
  pastelText: string
}

export const DEFAULT_CATEGORIES: CategoryMeta[] = [
  {
    id: 'libros',
    name: 'Libros de Pestañas & XXL',
    shortName: 'Libros & XXL',
    tagline: 'Colecciones Multi-Efectos',
    description: 'Formatos libro con 5 a 6 efectos integrados y ediciones XXL.',
    badgeText: 'Libro XXL',
    pastelBg: 'bg-[#fee8f0]', // Soft blush rose
    pastelBorder: 'border-[#f8b4cd]',
    pastelText: 'text-[#9c3360]',
  },
  {
    id: 'tablas',
    name: 'Tablas & Blísters de Volumen',
    shortName: 'Tablas & Volumen',
    tagline: 'Volumen 40D a 100D',
    description: 'Tablas individuales y multi-densidad para máxima definición.',
    badgeText: 'Tabla / Blíster',
    pastelBg: 'bg-[#fae8ff]', // Soft lavender
    pastelBorder: 'border-[#f0abfc]',
    pastelText: 'text-[#86198f]',
  },
  {
    id: 'enteras',
    name: 'Packs de Pestañas Enteras',
    shortName: 'Packs Enteras',
    tagline: 'Tiras Listas para Usar',
    description: 'Sets de 7 y 10 pares completos con acabados sutiles o cat eye.',
    badgeText: 'Pack Enteras',
    pastelBg: 'bg-[#ffe4e6]', // Soft coral peach
    pastelBorder: 'border-[#fda4af]',
    pastelText: 'text-[#9f1239]',
  },
  {
    id: 'especiales',
    name: 'Efectos Anime & Wispy',
    shortName: 'Anime & Wispy',
    tagline: 'Espigas & Efecto Muñeca',
    description: 'Diseños de espigas marcadas, estilo doll eye y pelo a pelo.',
    badgeText: 'Efecto Especial',
    pastelBg: 'bg-[#ede9fe]', // Soft periwinkle violet
    pastelBorder: 'border-[#c4b5fd]',
    pastelText: 'text-[#5b21b6]',
  },
]

export const CATEGORIES: Record<string, CategoryMeta> = DEFAULT_CATEGORIES.reduce(
  (acc, c) => ({ ...acc, [c.id]: c }),
  {} as Record<string, CategoryMeta>
)

export const PASTEL_PALETTES = [
  { bg: 'bg-[#fee8f0]', border: 'border-[#f8b4cd]', text: 'text-[#9c3360]' },
  { bg: 'bg-[#fae8ff]', border: 'border-[#f0abfc]', text: 'text-[#86198f]' },
  { bg: 'bg-[#ffe4e6]', border: 'border-[#fda4af]', text: 'text-[#9f1239]' },
  { bg: 'bg-[#ede9fe]', border: 'border-[#c4b5fd]', text: 'text-[#5b21b6]' },
  { bg: 'bg-[#fef3c7]', border: 'border-[#fde68a]', text: 'text-[#92400e]' },
  { bg: 'bg-[#dcfce7]', border: 'border-[#86efac]', text: 'text-[#166534]' },
  { bg: 'bg-[#e0f2fe]', border: 'border-[#7dd3fc]', text: 'text-[#0369a1]' },
]

export const EFFECTS_FILTER: { id: LashEffect; label: string; icon: string }[] = [
  { id: 'all', label: '', icon: '' },
  { id: 'volumen', label: '', icon: '' },
  { id: 'wispy', label: '', icon: '' },
  { id: 'anime', label: '', icon: '' },
  { id: 'feline', label: '', icon: '' },
  { id: 'glam', label: '', icon: '' },
]

/**
 * Obtiene la categoría de un producto (respetando la asignada por admin en BD, o con fallback)
 */
export function getProductCategory(p: Product): string {
  if (p.category && p.category.trim()) {
    return p.category.trim()
  }

  const text = `${p.name} ${p.description ?? ''}`.toLowerCase()
  if (text.includes('entera') || text.includes('pack de 7') || text.includes('pack de 10')) {
    return 'enteras'
  }
  if (
    text.includes('anime pop') ||
    text.includes('anime doll') ||
    text.includes('wispy glow') ||
    text.includes('wispy muse') ||
    text.includes('pelo a pelo')
  ) {
    return 'especiales'
  }
  if (text.includes('libro') || text.includes('xxl') || text.includes('feline — 6') || text.includes('harmony') || text.includes('muse')) {
    return 'libros'
  }
  return 'tablas'
}

export const classifyProductCategory = getProductCategory

/**
 * Obtiene metadatos visuales para cualquier ID de categoría (estática o dinámica)
 */
export function getCategoryMeta(catId: string, dynamicCats: Category[] = []): CategoryMeta {
  const foundDefault = DEFAULT_CATEGORIES.find((c) => c.id === catId)
  if (foundDefault) return foundDefault

  const foundDyn = dynamicCats.find((c) => c.id === catId)
  if (foundDyn) {
    const paletteIndex = Math.abs(catId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)) % PASTEL_PALETTES.length
    const palette = PASTEL_PALETTES[paletteIndex]
    return {
      id: foundDyn.id,
      name: foundDyn.name,
      shortName: foundDyn.name,
      tagline: 'Colección Euphoria',
      description: `Modelos exclusivos de la categoría ${foundDyn.name}.`,
      badgeText: foundDyn.name,
      pastelBg: palette.bg,
      pastelBorder: palette.border,
      pastelText: palette.text,
    }
  }

  // Fallback
  return {
    id: catId,
    name: catId,
    shortName: catId,
    tagline: 'Colección Euphoria',
    description: 'Modelos de pestañas Euphoria Lashes',
    badgeText: catId,
    pastelBg: 'bg-[#fee8f0]',
    pastelBorder: 'border-[#f8b4cd]',
    pastelText: 'text-[#9c3360]',
  }
}

/**
 * Obtiene una etiqueta de modelo descriptiva
 */
export function getProductModelBadge(p: Product): string {
  const text = `${p.name} ${p.description ?? ''}`.toLowerCase()

  if (text.includes('pack de 7')) return 'Pack 7 Pares'
  if (text.includes('pack de 10')) return 'Pack 10 Pares'
  if (text.includes('xxl')) return 'Edición XXL'
  if (text.includes('6 efectos')) return '6 Efectos'
  if (text.includes('5 efectos')) return '5 Efectos'
  if (text.includes('6 volúmenes')) return '6 Volúmenes'
  if (text.includes('80d')) return 'Volumen 80D'
  if (text.includes('60d')) return 'Volumen 60D'
  if (text.includes('anime')) return 'Efecto Anime'
  if (text.includes('wispy')) return 'Efecto Wispy'
  if (text.includes('feline') || text.includes('ojo de gato') || text.includes('catty')) return 'Efecto Cat Eye'
  if (text.includes('pelo a pelo')) return 'Pelo a Pelo'
  if (text.includes('3 efectos')) return '3 Efectos'
  if (text.includes('4 efectos')) return '4 Efectos'

  return 'Premium'
}

/**
 * Filtro secundario de estilo / acabado
 */
export function matchesEffectFilter(p: Product, effect: LashEffect): boolean {
  if (effect === 'all') return true
  const text = `${p.name} ${p.description ?? ''}`.toLowerCase()

  switch (effect) {
    case 'volumen':
      return (
        text.includes('80d') ||
        text.includes('60d') ||
        text.includes('100d') ||
        text.includes('volumen') ||
        text.includes('volume')
      )
    case 'wispy':
      return text.includes('wispy') || text.includes('espigas')
    case 'anime':
      return text.includes('anime') || text.includes('muñeca') || text.includes('doll')
    case 'feline':
      return text.includes('catty') || text.includes('feline') || text.includes('ojo de gato')
    case 'glam':
      return text.includes('glam') || text.includes('harmony') || text.includes('muse') || text.includes('sutil')
    default:
      return true
  }
}
