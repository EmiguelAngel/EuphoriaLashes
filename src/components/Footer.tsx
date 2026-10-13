import { Sparkles, Heart, MessageCircle } from 'lucide-react'
import { getWhatsAppUrl, WHATSAPP_DISPLAY } from '../lib/whatsapp'
import type { Category } from '../lib/types'
import { DEFAULT_CATEGORIES } from '../lib/categories'

interface FooterProps {
  categories?: Category[]
  onSelectCategory?: (catId: string) => void
}

export function Footer({ categories = [], onSelectCategory }: FooterProps) {
  const displayCats = categories.length > 0 ? categories : DEFAULT_CATEGORIES

  return (
    <footer className="mt-20 border-t border-black/[0.06] bg-white/70 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Logo y Eslogan */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <img
                src="/assets/logo.png"
                alt="Euphoria Lashes"
                className="h-11 w-11 rounded-full object-cover shadow-sm ring-2 ring-rose-200/80"
              />
              <div>
                <span className="text-base font-bold tracking-tight text-neutral-900 font-serif-luxury">
                  Euphoria Lashes
                </span>
                <span className="block text-xs text-neutral-600">
                  Accesorios & pestañas premium
                </span>
              </div>
            </div>
            <p className="max-w-sm text-xs leading-relaxed text-neutral-600">
              Diseños exclusivos para realzar tu belleza. Fibras suaves, variedad de curvaturas y acabados profesionales.
            </p>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-[color:var(--el-primary-strong)]">
              <Sparkles className="h-3.5 w-3.5" />
              Calidad & Elegancia Garantizada
            </div>
          </div>

          {/* Categorías de la tienda */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Colecciones
            </h4>
            <ul className="mt-3 space-y-2 text-xs text-neutral-600">
              {displayCats.map((c) => (
                <li key={c.id}>
                  {onSelectCategory ? (
                    <button
                      type="button"
                      onClick={() => {
                        window.scrollTo({ top: 0, behavior: 'smooth' })
                        onSelectCategory(c.id)
                      }}
                      className="transition-colors hover:text-[color:var(--el-primary-strong)] text-left"
                    >
                      {c.name}
                    </button>
                  ) : (
                    <span>{c.name}</span>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto Directo por WhatsApp (Sin administración como solicitó el usuario) */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-900">
              Pedidos & Asesoría
            </h4>
            <p className="text-xs text-neutral-600 leading-relaxed">
              ¿Tienes dudas o deseas cotizar tu pedido? Escríbenos directamente a nuestra línea oficial de atención.
            </p>
            <a
              href={getWhatsAppUrl('¡Hola Euphoria Lashes! Deseo información sobre sus modelos de pestañas.')}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl bg-[#25D366] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-[#20ba5a] hover:shadow active:scale-[0.98]"
            >
              <MessageCircle className="h-4 w-4" />
              <span>WhatsApp: {WHATSAPP_DISPLAY}</span>
            </a>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-black/[0.06] pt-6 text-xs text-neutral-600 sm:flex-row">
          <p>© {new Date().getFullYear()} Euphoria Lashes. Todos los derechos reservados.</p>
          <p className="flex items-center gap-1">
            Hecho con <Heart className="h-3.5 w-3.5 fill-[color:var(--el-primary)] text-[color:var(--el-primary)]" /> para amantes de las pestañas
          </p>
        </div>
      </div>
    </footer>
  )
}
