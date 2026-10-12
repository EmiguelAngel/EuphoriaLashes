import type { Product } from './types'

export type LashCategory = 'libros' | 'tablas' | 'enteras' | 'especiales'

export type LashEffect = 'all' | 'volumen' | 'wispy' | 'anime' | 'feline' | 'glam'

export interface CategoryMeta {
  id: LashCategory
  name: string
  shortName: string
  tagline: string
  description: string
  badgeText: string
  accentColor: string
}

export const CATEGORIES: Record<LashCategory, CategoryMeta> = {
  libros: {
    id: 'libros',
    name: 'Libros de Pestañas & XXL',
    shortName: 'Libros & XXL',
    tagline: 'Colecciones Multi-Efectos y Formatos XXL',
    description:
      'Presentaciones en formato libro con 5 a 6 efectos integrados, gran variedad de curvaturas y modelos XXL para looks versátiles y profesionales.',
    badgeText: 'Formato Libro',
    accentColor: '#e11d48',
  },
  tablas: {
    id: 'tablas',
    name: 'Tablas & Blísters de Volumen',
    shortName: 'Tablas & Volumen',
    tagline: 'Volumen Tecnológico 40D, 60D, 80D y 100D',
    description:
      'Tablas individuales y combinaciones de alta densidad para crear miradas impactantes, densas y con máxima definición.',
    badgeText: 'Tabla / Blíster',
    accentColor: '#db2777',
  },
  enteras: {
    id: 'enteras',
    name: 'Packs de Pestañas Enteras',
    shortName: 'Packs Enteras (Tiras)',
    tagline: 'Packs de 7 y 10 Pares en Tira Completa',
    description:
      'Pestañas enteras listas para aplicar, en convenientes packs de múltiples pares con acabados sutiles, elegantes y efecto ojo de gato.',
    badgeText: 'Pack Enteras',
    accentColor: '#c026d3',
  },
  especiales: {
    id: 'especiales',
    name: 'Efectos de Tendencia & Especiales',
    shortName: 'Anime, Wispy & Pelo a Pelo',
    tagline: 'Espigas Marcadas, Efecto Muñeca y Pelo a Pelo',
    description:
      'Diseños con espigas pronunciadas para efecto anime doll, acabados wispy texturizados y pestañas efecto pelo a pelo.',
    badgeText: 'Efecto Especial',
    accentColor: '#9333ea',
  },
}

export const CATEGORY_KEYS: LashCategory[] = ['libros', 'tablas', 'enteras', 'especiales']

export const EFFECTS_FILTER: { id: LashEffect; label: string; icon: string }[] = [
  { id: 'all', label: 'Todos los estilos', icon: '✨' },
  { id: 'volumen', label: 'Volumen Intenso (60D - 100D)', icon: '🔥' },
  { id: 'wispy', label: 'Efecto Wispy / Espigas', icon: '🪶' },
  { id: 'anime', label: 'Efecto Anime / Doll', icon: '🎀' },
  { id: 'feline', label: 'Ojo de Gato / Feline', icon: '🐱' },
  { id: 'glam', label: 'Glam & Multi-Efectos', icon: '💎' },
]

/**
 * Clasifica de forma inteligente un producto según su nombre y descripción
 */
export function classifyProductCategory(p: Product): LashCategory {
  const text = `${p.name} ${p.description ?? ''}`.toLowerCase()

  // 1. Packs de pestañas enteras
  if (text.includes('entera') || text.includes('pack de 7') || text.includes('pack de 10')) {
    return 'enteras'
  }

  // 2. Efectos especiales y pelo a pelo (Anime Doll, Wispy Glow, Wispy Muse, Anime Pop, Classic Volume)
  if (
    text.includes('anime pop') ||
    text.includes('anime doll') ||
    text.includes('wispy glow') ||
    text.includes('wispy muse') ||
    text.includes('pelo a pelo')
  ) {
    return 'especiales'
  }

  // 3. Libros de pestañas y formatos XXL
  if (text.includes('libro') || text.includes('xxl') || text.includes('feline — 6') || text.includes('harmony') || text.includes('muse')) {
    return 'libros'
  }

  // 4. Tablas y blísters (80D, 60D, 100D, tabla, trio volume, mix)
  if (
    text.includes('tabla') ||
    text.includes('80d') ||
    text.includes('60d') ||
    text.includes('100d') ||
    text.includes('40d') ||
    text.includes('trio') ||
    text.includes('volumen mix') ||
    text.includes('triple glam')
  ) {
    return 'tablas'
  }

  // Por defecto, clasificar según palabras clave de libros vs tablas
  return 'tablas'
}

/**
 * Obtiene una etiqueta de modelo / especificación detallada para mostrar en la tarjeta
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

  const cat = classifyProductCategory(p)
  return CATEGORIES[cat].badgeText
}

/**
 * Comprueba si un producto coincide con el filtro de efecto / estilo
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
        text.includes('volume') ||
        text.includes('trio volume')
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
