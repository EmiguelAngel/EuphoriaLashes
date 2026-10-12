import { BookOpen, Layers, Sparkles, Wand2, ChevronRight } from 'lucide-react'
import type { CategoryMeta } from '../lib/categories'

interface SectionHeaderProps {
  category: CategoryMeta
  count: number
  onFilterCategory?: () => void
  isFiltered?: boolean
}

function getCategoryIcon(id: string) {
  switch (id) {
    case 'libros':
      return <BookOpen className="h-5 w-5 text-rose-600" />
    case 'tablas':
      return <Layers className="h-5 w-5 text-pink-600" />
    case 'enteras':
      return <Wand2 className="h-5 w-5 text-fuchsia-600" />
    case 'especiales':
      return <Sparkles className="h-5 w-5 text-purple-600" />
    default:
      return <Sparkles className="h-5 w-5 text-pink-600" />
  }
}

export function SectionHeader({ category, count, onFilterCategory, isFiltered }: SectionHeaderProps) {
  return (
    <div id={`seccion-${category.id}`} className="scroll-mt-28 mb-6">
      <div className="flex flex-col gap-3 rounded-2xl bg-white/80 p-5 shadow-sm ring-1 ring-black/5 backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="space-y-1.5 max-w-2xl">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-rose-50 shadow-inner ring-1 ring-rose-200/60">
              {getCategoryIcon(category.id)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold tracking-widest uppercase text-[color:var(--el-primary-strong)]">
                  {category.tagline}
                </span>
                <span className="inline-flex items-center rounded-full bg-rose-100/70 px-2.5 py-0.5 text-xs font-semibold text-rose-800">
                  {count} {count === 1 ? 'modelo' : 'modelos'}
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-neutral-900 sm:text-2xl font-serif-luxury">
                {category.name}
              </h2>
            </div>
          </div>
          <p className="text-xs text-neutral-600 sm:text-sm pl-12 leading-relaxed">
            {category.description}
          </p>
        </div>

        {onFilterCategory && !isFiltered ? (
          <button
            type="button"
            onClick={onFilterCategory}
            className="inline-flex self-start sm:self-center shrink-0 items-center gap-1.5 rounded-xl border border-[color:var(--el-primary)]/30 bg-rose-50/50 px-3.5 py-2 text-xs font-semibold text-[color:var(--el-primary-strong)] shadow-sm transition hover:bg-rose-100/70"
          >
            <span>Ver solo esta categoría</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
    </div>
  )
}
