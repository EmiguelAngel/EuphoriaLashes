import { MessageCircle } from 'lucide-react'
import { getWhatsAppUrl } from '../lib/whatsapp'

export function FloatingWhatsApp() {
  const url = getWhatsAppUrl('Hola! Deseo hacer un pedido')

  return (
    <aside aria-label="Contacto por WhatsApp" className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="group flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg shadow-emerald-500/25 transition-all duration-200 hover:scale-105 hover:bg-[#20ba5a] hover:shadow-xl active:scale-95"
      >
        <MessageCircle className="h-5 w-5 fill-current" />
        <span className="text-xs font-bold tracking-wide">
          WhatsApp
        </span>
      </a>
    </aside>
  )
}
