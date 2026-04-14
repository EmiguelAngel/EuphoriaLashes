import type { ButtonHTMLAttributes } from 'react'
import { cn } from '../lib/cn'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'danger'
}

export function Button({ className, variant = 'secondary', ...props }: Props) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-black/10 transition focus:outline-none focus-visible:ring-2'
  const variants: Record<NonNullable<Props['variant']>, string> = {
    primary:
      'bg-[color:var(--el-primary)] text-white hover:bg-[color:var(--el-primary-strong)] focus-visible:ring-[color:var(--el-primary)]',
    secondary:
      'bg-white text-neutral-900 hover:bg-black/5 focus-visible:ring-[color:var(--el-primary)]',
    danger:
      'bg-[color:var(--el-alert)] text-white hover:bg-[color:var(--el-primary-strong)] focus-visible:ring-[color:var(--el-alert)]',
  }

  return <button className={cn(base, variants[variant], className)} {...props} />
}

