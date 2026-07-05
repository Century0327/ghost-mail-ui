

import { NotebookPen, Check } from 'lucide-react'
import { Panel } from './panel'
import { SCHEDULE } from '@/lib/companion-data'

export function SchedulePanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Panel open={open} onClose={onClose} title="今天的日程" icon={<NotebookPen className="size-5" />}>
      <p className="font-cute mb-4 text-sm text-muted-foreground">这是我今天想做的一些小事～</p>
      <ol className="relative flex flex-col gap-4 pl-2">
        {/* 时间线竖线 */}
        <span className="absolute bottom-2 left-[1.15rem] top-2 w-0.5 rounded-full bg-border" aria-hidden="true" />
        {SCHEDULE.map((item) => (
          <li key={item.time} className="relative flex items-start gap-3">
            <span
              className={`relative z-10 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border-2 ${
                item.done
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground'
              }`}
            >
              {item.done ? <Check className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
            </span>
            <div
              className={`flex-1 rounded-3xl border-2 p-3 ${
                item.done ? 'border-primary/30 bg-secondary/40' : 'border-border bg-background/60'
              }`}
            >
              <p className="font-cute text-sm text-primary">{item.time}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-foreground/85">{item.text}</p>
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
