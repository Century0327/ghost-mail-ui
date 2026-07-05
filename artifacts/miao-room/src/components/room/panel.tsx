

import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

type PanelProps = {
  open: boolean
  onClose: () => void
  title: string
  icon?: ReactNode
  children: ReactNode
}

// 温馨圆润的弹窗外壳，用于「记忆 / 商店 / 日程」等页面。
export function Panel({ open, onClose, title, icon, children }: PanelProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <button
        aria-label="关闭"
        onClick={onClose}
        className="absolute inset-0 bg-foreground/25 backdrop-blur-[2px]"
      />
      <div className="animate-bubble-in relative flex max-h-[85dvh] w-full max-w-md flex-col overflow-hidden rounded-3xl border-2 border-border bg-card text-card-foreground shadow-2xl">
        <div className="flex items-center gap-2 border-b-2 border-border/70 bg-secondary/60 px-5 py-4">
          <span className="flex size-9 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            {icon}
          </span>
          <h2 className="font-cute flex-1 text-xl text-foreground">{title}</h2>
          <button
            aria-label="关闭"
            onClick={onClose}
            className="flex size-9 items-center justify-center rounded-full bg-background/70 text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
          >
            <X className="size-5" />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
      </div>
    </div>
  )
}
