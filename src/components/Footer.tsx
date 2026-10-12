import { Sparkles, Heart } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CATEGORIES, CATEGORY_KEYS, type LashCategory } from '../lib/categories'

interface FooterProps {
  onSelectCategory?: (cat: LashCategory) => void
}

export function Footer({ onSelectCategory }: FooterProps) {
  return (
    <footer className="mt-20 border-t border-black/5 bg-white/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo.png"
                alt="Euphoria Lashes"
                className="h-10 w-10 rounded-xl bg-white p-1 ring-1 ring-black/5"
              />
              <div>
                <span className="text-base font-bold tracking-tight text-neutral-900 font-serif-luxury">
                  Euphoria Lashes
                </span>
                <span className="block text-xs text-neutral-600">
                  Accesorios y pestañas premium
                </span>
              </div>
            </div>
            <p className="max-w-md text-xs leading-relaxed text-neutral-600">
              Transforma miradas con nuestra selección exclusiva de pestañas. Calidad profesional, fibras suaves, curvaturas duraderas y variedad de estilos para toda ocasión.
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-[color:var(--el-primary-strong)]">
              <Sparkles className="h-3.5 w-3.5" />
              Diseñado para realzar tu belleza
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Colecciones & Secciones
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-neutral-600">
              {CATEGORY_KEYS.map((k) => (
                <li key={k}>
                  {onSelectCategory ? (
                    <button
                      type="button"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                        onSelectCategory(k)
                      }}
                      className="transition hover:text-[color:var(--el-primary-strong)] text-left"
                    >
                      {CATEGORIES[k].name}
                    </button>
                  ) : (
                    <span>{CATEGORIES[k].name}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Administración
            </h4>
            <p className="mt-3 text-xs text-neutral-600">
              Accede al panel de control para gestionar el catálogo y stock.
            </p>
            <div className="mt-3">
              <Link
                to="/admin"
                className="inline-flex items-center gap-1.5 rounded-xl bg-neutral-900 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-neutral-800"
              >
                Panel de Administración
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-col items-center justify-between gap-4 border-t border-black/5 pt-6 text-xs text-neutral-600 sm:flex-row">
          <p>© {new Date().getFullYear()} Euphoria Lashes. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Hecho con <Heart className="h-3.5 w-3.5 fill-[color:var(--el-primary)] text-[color:var(--el-primary)]" /> para amantes de las pestañas
          </p>
        </div>
      </div>
    </footer>
  )
}
