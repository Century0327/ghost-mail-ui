'use client'

import { useState } from 'react'
import { Mail, ChevronLeft, Heart } from 'lucide-react'
import { Panel } from './panel'
import { LETTERS, type Letter } from '@/lib/companion-data'

export function MemoriesPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [active, setActive] = useState<Letter | null>(null)

  const handleClose = () => {
    setActive(null)
    onClose()
  }

  return (
    <Panel open={open} onClose={handleClose} title="记忆收藏夹" icon={<Mail className="size-5" />}>
      {active ? (
        <div className="animate-bubble-in">
          <button
            onClick={() => setActive(null)}
            className="mb-3 inline-flex items-center gap-1 rounded-full bg-secondary/70 px-3 py-1.5 font-cute text-sm text-secondary-foreground transition-colors hover:bg-secondary"
          >
            <ChevronLeft className="size-4" /> 返回
          </button>
          <div className="rounded-3xl border-2 border-border bg-background/60 p-5">
            <p className="font-cute text-xs text-muted-foreground">{active.date}</p>
            <h3 className="font-cute mt-1 text-lg text-foreground">{active.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-foreground/85">{active.body}</p>
            <div className="mt-4 flex items-center gap-1 text-primary">
              <Heart className="size-4 fill-primary" />
              <span className="font-cute text-xs">已珍藏</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="font-cute text-sm text-muted-foreground">我把和你相处的点滴都写进了信里～</p>
          {LETTERS.map((letter) => (
            <button
              key={letter.id}
              onClick={() => setActive(letter)}
              className="flex items-start gap-3 rounded-3xl border-2 border-border bg-background/60 p-4 text-left transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:bg-secondary/40"
            >
              <span className="mt-0.5 flex size-10 shrink-0 items-center justify-center rounded-2xl bg-accent/50 text-accent-foreground">
                <Mail className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className="font-cute text-base text-foreground">{letter.title}</span>
                  <span className="shrink-0 font-cute text-[0.7rem] text-muted-foreground">
                    {letter.date}
                  </span>
                </span>
                <span className="mt-1 block truncate text-sm text-muted-foreground">
                  {letter.preview}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Panel>
  )
}
