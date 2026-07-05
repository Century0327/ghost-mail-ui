'use client'

import { useEffect, useState } from 'react'
import { NotebookPen } from 'lucide-react'
import { Panel } from './panel'
import { SCHEDULE } from '@/lib/companion-data'

function getNowTime(): string {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function timeCompare(a: string, b: string): number {
  const [ah, am] = a.split(':').map(Number)
  const [bh, bm] = b.split(':').map(Number)
  return ah * 60 + am - (bh * 60 + bm)
}

function getItemStatus(itemTime: string, currentTime: string): 'past' | 'current' | 'future' {
  const cmp = timeCompare(itemTime, currentTime)
  if (cmp < 0) return 'past'
  if (cmp === 0) return 'current'
  return 'future'
}

export function SchedulePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currentTime, setCurrentTime] = useState(getNowTime())

  useEffect(() => {
    if (!open) return
    const timer = setInterval(() => {
      setCurrentTime(getNowTime())
    }, 60000)
    return () => clearInterval(timer)
  }, [open])

  return (
    <Panel open={open} onClose={onClose} title="今天的日程" icon={<NotebookPen className="size-5" />}>
      <p className="font-cute mb-4 text-sm text-muted-foreground">
        这是我今天想做的一些小事～（{currentTime}）
      </p>
      <ol className="relative flex flex-col gap-4 pl-2">
        {/* 时间线竖线 */}
        <span className="absolute bottom-2 left-[1.15rem] top-2 w-0.5 rounded-full bg-border" aria-hidden="true" />
        {SCHEDULE.map((item) => {
          const status = getItemStatus(item.time, currentTime)
          const isPast = status === 'past'
          const isCurrent = status === 'current'

          return (
            <li key={item.time} className="relative flex items-start gap-3">
              <span
                className={`relative z-10 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border-2 ${
                  isCurrent
                    ? 'border-amber-400 bg-amber-400 text-amber-950'
                    : isPast
                      ? 'border-muted bg-muted text-muted-foreground'
                      : 'border-border bg-card text-muted-foreground'
                }`}
              >
                {isCurrent ? (
                  <span className="size-2.5 rounded-full bg-current animate-pulse" />
                ) : isPast ? (
                  <span className="size-2 rounded-full bg-current opacity-40" />
                ) : (
                  <span className="size-2 rounded-full bg-current" />
                )}
              </span>
              <div
                className={`flex-1 rounded-3xl border-2 p-3 ${
                  isCurrent
                    ? 'border-amber-400/40 bg-amber-50/60'
                    : isPast
                      ? 'border-border/50 bg-muted/30 opacity-60'
                      : 'border-border bg-background/60'
                }`}
              >
                <p className={`font-cute text-sm ${isCurrent ? 'text-amber-600' : 'text-primary'}`}>
                  {item.time} {isCurrent && '· 进行中'}
                  {isPast && '· 已完成'}
                </p>
                <p className="mt-0.5 text-sm leading-relaxed text-foreground/85">{item.text}</p>
              </div>
            </li>
          )
        })}
      </ol>
    </Panel>
  )
}
