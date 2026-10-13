import type { Category } from '../lib/types'
import { PASTEL_PALETTES } from '../lib/categories'

interface CategoryBarProps {
  categories: Category[]
  activeCategory: string
  onSelectCategory: (id: string) => void
  totalCount: number
  countsByCategory: Record<string, number>
}

export function CategoryBar({
  categories,
  activeCategory,
  onSelectCategory,
}: CategoryBarProps) {
  return (
    <div className="w-full">
      <div className="flex items-center gap-2.5 overflow-x-auto pb-3 pt-1 scrollbar-none sm:justify-center">
        {/* Pestaña: Todos */}
        <button
          type="button"
          onClick={() => onSelectCategory('all')}
          className={[
            'group relative flex items-center justify-center rounded-2xl px-5 py-3 text-center transition-all duration-200 active:scale-[0.95]',
            activeCategory === 'all'
              ? 'bg-[#fee8f0] text-[#9c3360] shadow-sm ring-2 ring-[#ba4f78]'
              : 'bg-white text-neutral-700 shadow-sm ring-1 ring-black/[0.06] hover:bg-[#fff5f8]',
          ].join(' ')}
        >
          <span className="text-sm font-bold tracking-tight">Todos</span>
        </button>

        {/* Pestañas dinámicas de Categorías: solo el nombre */}
        {categories.map((cat, idx) => {
          const isSelected = activeCategory === cat.id
          const palette = PASTEL_PALETTES[idx % PASTEL_PALETTES.length]

          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => onSelectCategory(cat.id)}
              className={[
                'group relative flex items-center justify-center rounded-2xl px-5 py-3 text-center transition-all duration-200 active:scale-[0.95]',
                isSelected
                  ? `${palette.bg} ${palette.text} shadow-sm ring-2 ring-[#ba4f78]`
                  : `${palette.bg}/60 ${palette.text} shadow-sm ring-1 ring-black/[0.04] hover:${palette.bg} hover:shadow-xs`,
              ].join(' ')}
            >
              <span className="text-sm font-bold tracking-tight whitespace-nowrap">
                {cat.name}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
