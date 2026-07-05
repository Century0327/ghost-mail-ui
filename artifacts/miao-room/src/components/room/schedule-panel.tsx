import { useState, useEffect } from 'react'
import { NotebookPen, Check } from 'lucide-react'
import { Panel } from './panel'
import { companionLocal } from '@/lib/companion-local'
import type { ScheduleItem } from '@/lib/companion-local'

export function SchedulePanel({ open, onClose, characterId = 'maodie' }: { open: boolean; onClose: () => void; characterId?: string }) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])

  useEffect(() => {
    if (open) {
      const state = companionLocal.getCharacterState(characterId)
      setSchedule(state.schedule)
    }
  }, [open, characterId])

  const toggleDone = (time: string) => {
    const updated = companionLocal.toggleScheduleDone(characterId, time)
    setSchedule([...updated])
  }

  return (
    <Panel open={open} onClose={onClose} title="今天的日程" icon={<NotebookPen className="size-5" />}>
      <p className="font-cute mb-4 text-sm text-muted-foreground">这是我今天想做的一些小事～</p>
      <ol className="relative flex flex-col gap-4 pl-2">
        {/* 时间线竖线 */}
        <span className="absolute bottom-2 left-[1.15rem] top-2 w-0.5 rounded-full bg-border" aria-hidden="true" />
        {schedule.map((item) => (
          <li key={item.time} className="relative flex items-start gap-3">
            <button
              onClick={() => toggleDone(item.time)}
              className={`relative z-10 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                item.done
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border bg-card text-muted-foreground hover:border-primary/50'
              }`}
            >
              {item.done ? <Check className="size-4" /> : <span className="size-2 rounded-full bg-current" />}
            </button>
            <div
              className={`flex-1 rounded-3xl border-2 p-3 transition-colors ${
                item.done ? 'border-primary/30 bg-secondary/40' : 'border-border bg-background/60'
              }`}
            >
              <p className="font-cute text-sm text-primary">{item.time}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-foreground/85">{item.activity}</p>
              {item.thought && (
                <p className="mt-1 text-xs text-muted-foreground/70 italic">💭 {item.thought}</p>
              )}
              {item.location && (
                <p className="mt-0.5 text-xs text-muted-foreground/60">📍 {item.location}</p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </Panel>
  )
}
