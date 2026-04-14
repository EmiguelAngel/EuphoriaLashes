import type { InputHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

export function TextField({
  label,
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string | null }) {
  return (
    <label className={cn('block space-y-1', className)}>
      <div className="text-xs font-medium text-neutral-700">{label}</div>
      <input
        className={cn(
          'w-full rounded-xl bg-white px-3 py-2 text-sm shadow-sm ring-1 ring-black/10 outline-none transition focus:ring-2 focus:ring-[color:var(--el-primary)]',
          error ? 'ring-[color:var(--el-alert)] focus:ring-[color:var(--el-alert)]' : null,
        )}
        {...props}
      />
      {error ? <div className="text-xs text-[color:var(--el-alert)]">{error}</div> : null}
    </label>
  )
}

