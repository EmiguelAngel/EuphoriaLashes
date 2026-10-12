import { BookOpen, Layers, Sparkles, Wand2, ArrowDownRight } from 'lucide-react'
import { CATEGORIES, type LashCategory } from '../lib/categories'

interface CategoryHeroProps {
  categoryCounts: Record<LashCategory, number>
  onSelectCategory: (cat: LashCategory) => void
  activeTab: string
}

export function CategoryHero({ categoryCounts, onSelectCategory, activeTab }: CategoryHeroProps) {
  const cards: {
    id: LashCategory
    icon: typeof BookOpen
    tag: string
    highlight: string
    colorClass: string
    borderClass: string
    bgGradient: string
  }[] = [
    {
      id: 'libros',
      icon: BookOpen,
      tag: 'Multi-Efectos & XXL',
      highlight: '5 a 6 efectos por libro',
      colorClass: 'text-rose-700',
      borderClass: 'hover:border-rose-300',
      bgGradient: 'from-rose-500/10 to-pink-500/5',
    },
    {
      id: 'tablas',
      icon: Layers,
      tag: 'Alta Densidad',
      highlight: 'Volumen 40D a 100D',
      colorClass: 'text-pink-700',
      borderClass: 'hover:border-pink-300',
      bgGradient: 'from-pink-500/10 to-fuchsia-500/5',
    },
    {
      id: 'enteras',
      icon: Wand2,
      tag: 'Packs Completos',
      highlight: 'Sets de 7 y 10 pares',
      colorClass: 'text-fuchsia-700',
      borderClass: 'hover:border-fuchsia-300',
      bgGradient: 'from-fuchsia-500/10 to-purple-500/5',
    },
    {
      id: 'especiales',
      icon: Sparkles,
      tag: 'Efectos de Autor',
      highlight: 'Anime, Wispy & Pelo a pelo',
      colorClass: 'text-purple-700',
      borderClass: 'hover:border-purple-300',
      bgGradient: 'from-purple-500/10 to-indigo-500/5',
    },
  ]

  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-white/90 via-pink-50/70 to-rose-100/50 p-6 shadow-sm ring-1 ring-black/5 backdrop-blur-md sm:p-10">
      {/* Círculos decorativos sutiles */}
      <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-rose-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-pink-200/30 blur-3xl" />

      <div className="relative max-w-3xl space-y-3">
        <div className="inline-flex items-center gap-2 rounded-full bg-rose-100/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-[color:var(--el-primary-strong)]">
          <Sparkles className="h-3.5 w-3.5" />
          Catálogo Exclusivo Organizado
        </div>

        <h1 className="text-3xl font-extrabold tracking-tight text-neutral-900 sm:text-4xl md:text-5xl font-serif-luxury leading-tight">
          Encuentra el estilo perfecto para cada mirada
        </h1>

        <p className="text-sm leading-relaxed text-neutral-600 sm:text-base">
          Explora nuestra colección dividida por categorías y técnicas: libros completos con variedad de efectos, tablas de volumen tecnológico de alta densidad, y pestañas enteras listas para lucir.
        </p>
      </div>

      {/* Tarjetas de acceso rápido a cada sección */}
      <div className="relative mt-8 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => {
          const meta = CATEGORIES[c.id]
          const count = categoryCounts[c.id] || 0
          const Icon = c.icon
          const isSelected = activeTab === c.id

          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelectCategory(c.id)}
              className={[
                'group relative flex flex-col justify-between overflow-hidden rounded-2xl p-4 text-left transition-all duration-300 ring-1',
                isSelected
                  ? 'bg-white shadow-md ring-2 ring-[color:var(--el-primary-strong)] scale-[1.02]'
                  : 'bg-white/80 ring-black/5 hover:bg-white hover:shadow-md hover:-translate-y-0.5',
              ].join(' ')}
            >
              <div className="flex items-center justify-between">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${c.bgGradient} ring-1 ring-black/5`}>
                  <Icon className={`h-5 w-5 ${c.colorClass}`} />
                </div>
                <span className="inline-flex items-center rounded-full bg-neutral-100 px-2 py-0.5 text-xs font-semibold text-neutral-700">
                  {count} modelos
                </span>
              </div>

              <div className="mt-4">
                <div className="text-[11px] font-bold uppercase tracking-wider text-neutral-600">
                  {c.tag}
                </div>
                <div className="text-base font-bold text-neutral-900 font-serif-luxury group-hover:text-[color:var(--el-primary-strong)] transition-colors">
                  {meta.shortName}
                </div>
                <div className="mt-0.5 text-xs text-neutral-600 line-clamp-1">
                  {c.highlight}
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between pt-2 border-t border-black/[0.04] text-xs font-semibold text-[color:var(--el-primary-strong)]">
                <span>{isSelected ? 'Sección activa' : 'Ver sección'}</span>
                <ArrowDownRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:translate-y-0.5" />
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}
