import { BookOpen, Layers, Sparkles, Wand2, Grid, Heart, Eye } from 'lucide-react'
import type { Category } from '../lib/types'
import { PASTEL_PALETTES } from '../lib/categories'

interface CategoryBarProps {
  categories: Category[]
  activeCategory: string
  onSelectCategory: (id: string) => void
  totalCount: number
  countsByCategory: Record<string, number>
}

function getCategoryIcon(name: string, iconKey?: string | null) {
  const n = (iconKey || name).toLowerCase()
  if (n.includes('libro') || n.includes('xxl') || n.includes('book')) {
    return <BookOpen className="h-6 w-6 stroke-[1.8]" />
  }
  if (n.includes('tabla') || n.includes('volumen') || n.includes('layer')) {
    return <Layers className="h-6 w-6 stroke-[1.8]" />
  }
  if (n.includes('entera') || n.includes('pack') || n.includes('wand')) {
    return <Wand2 className="h-6 w-6 stroke-[1.8]" />
  }
  if (n.includes('anime') || n.includes('wispy') || n.includes('sparkle')) {
    return <Sparkles className="h-6 w-6 stroke-[1.8]" />
  }
  if (n.includes('favorito') || n.includes('heart')) {
    return <Heart className="h-6 w-6 stroke-[1.8]" />
  }
  return <Eye className="h-6 w-6 stroke-[1.8]" />
}

export function CategoryBar({
  categories,
  activeCategory,
  onSelectCategory,
  totalCount,
  countsByCategory,
}: CategoryBarProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-3 overflow-x-auto pb-4 pt-2 scrollbar-none sm:justify-center">
        {/* Pestaña: Todos */}
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={[
            'group relative flex min-w-[105px] flex-col items-center justify-center rounded-2xl p-4 text-center transition-all duration-200 active:scale-[0.95]',
            activeCategory === 'all'
              ? 'bg-[#fee8f0] text-[#9c3360] shadow-sm ring-2 ring-[#ba4f78]'
              : 'bg-white text-neutral-700 shadow-sm ring-1 ring-black/[0.06] hover:bg-[#fff5f8]',
          ].join(' ')}
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/70 shadow-inner">
            <Grid className="h-6 w-6 stroke-[1.8] text-[#ba4f78]" />
          </div>
          <span className="mt-2 text-xs font-bold tracking-tight">Todos</span>
          <span className="text-[10px] text-neutral-600 font-medium">{totalCount} unid.</span>
        </button>

        {/* Pestañas dinámicas de Categorías con fondo pastel como en la imagen */}
        {categories.map((cat, idx) => {
          const isSelected = activeCategory === cat.id
          const palette = PASTEL_PALETTES[idx % PASTEL_PALETTES.length]
          const count = countsByCategory[cat.id] ?? 0

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={[
                'group relative flex min-w-[110px] flex-col items-center justify-center rounded-2xl p-4 text-center transition-all duration-200 active:scale-[0.95]',
                isSelected
                  ? `${palette.bg} ${palette.text} shadow-sm ring-2 ring-[#ba4f78]`
                  : `${palette.bg}/60 ${palette.text} shadow-sm ring-1 ring-black/[0.04] hover:${palette.bg} hover:shadow`,
              ].join(' ')}
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/80 shadow-inner">
                {getCategoryIcon(cat.name, cat.icon)}
              </div>
              <span className="mt-2 text-xs font-bold tracking-tight truncate max-w-[100px]">
                {cat.name}
              </span>
              <span className="text-[10px] opacity-75 font-medium">{count} unid.</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
