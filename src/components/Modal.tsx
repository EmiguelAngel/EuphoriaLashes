import type { ReactNode } from 'react'
import { X } from 'lucide-react'
import { cn } from '../lib/cn'

export function Modal({
  open,
  title,
  children,
  footer,
  onClose,
}: {
  open: boolean
  title: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
}) {
  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-black/10">
        <div className="flex items-start justify-between gap-3 border-b border-black/5 px-5 py-4">
          <div>
            <div className="text-sm font-semibold tracking-tight">{title}</div>
          </div>
          <button
            className={cn(
              'rounded-xl p-2 text-neutral-500 transition hover:bg-black/5 hover:text-neutral-700',
            )}
            onClick={onClose}
            type="button"
            aria-label="Cerrar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-4">{children}</div>

        {footer ? <div className="border-t border-black/5 px-5 py-4">{footer}</div> : null}
      </div>
    </div>
  )
}

