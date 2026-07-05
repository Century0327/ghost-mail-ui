import { useState, useEffect } from 'react'
import { NotebookPen, Check, Clock, Play, Star } from 'lucide-react'
import { Panel } from './panel'
import { companionLocal, getScheduleStatus } from '@/lib/companion-local'
import type { ScheduleItem, ScheduleStatus } from '@/lib/companion-local'

function getStatusIcon(status: ScheduleStatus) {
  switch (status) {
    case 'done': return <Check className="size-4" />
    case 'current': return <Play className="size-4" />
    case 'past': return <Clock className="size-4" />
    case 'future': return <Star className="size-4" />
  }
}

function getStatusLabel(status: ScheduleStatus): string {
  switch (status) {
    case 'done': return '已完成'
    case 'current': return '进行中'
    case 'past': return '已错过'
    case 'future': return '待开始'
  }
}

function getStatusColor(status: ScheduleStatus): string {
  switch (status) {
    case 'done': return 'border-green-300 bg-green-50/60 text-green-700'
    case 'current': return 'border-primary bg-primary/10 text-primary animate-pulse'
    case 'past': return 'border-gray-200 bg-gray-50/40 text-gray-400 line-through'
    case 'future': return 'border-border bg-background/60 text-foreground'
  }
}

function getDotColor(status: ScheduleStatus): string {
  switch (status) {
    case 'done': return 'bg-green-400'
    case 'current': return 'bg-primary animate-ping'
    case 'past': return 'bg-gray-300'
    case 'future': return 'bg-muted-foreground/50'
  }
}

export function SchedulePanel({ open, onClose, characterId = 'maodie' }: { open: boolean; onClose: () => void; characterId?: string }) {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([])
  const [currentTime, setCurrentTime] = useState('')
  const [summary, setSummary] = useState('')
  const [completionRate, setCompletionRate] = useState(0)

  // 每分钟更新一次当前时间
  useEffect(() => {
    if (!open) return
    
    const update = () => {
      const now = new Date()
      setCurrentTime(`${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`)
    }
    update()
    const interval = setInterval(update, 60000) // 每分钟更新
    return () => clearInterval(interval)
  }, [open])

  // 加载日程
  useEffect(() => {
    if (open) {
      const items = companionLocal.getTodaySchedule(characterId)
      setSchedule(items)
      
      const history = companionLocal.getScheduleHistory(characterId)
      setSummary(history.currentSummary)
      setCompletionRate(companionLocal.getScheduleCompletionRate(characterId))
    }
  }, [open, characterId])

  const toggleDone = (time: string) => {
    const updated = companionLocal.toggleScheduleDone(characterId, time)
    setSchedule([...updated])
    setCompletionRate(companionLocal.getScheduleCompletionRate(characterId))
  }

  // 找出当前进行中的日程
  const currentIndex = schedule.findIndex((item) => getScheduleStatus(item, currentTime) === 'current')

  return (
    <Panel open={open} onClose={onClose} title="今天的日程" icon={<NotebookPen className="size-5" />}>
      {/* 顶部状态栏 */}
      <div className="mb-4 rounded-2xl border border-border/50 bg-muted/40 p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="size-4 text-muted-foreground" />
            <span className="font-cute text-sm text-muted-foreground">现在 {currentTime}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">完成率</span>
            <div className="h-2 w-16 overflow-hidden rounded-full bg-secondary">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <span className="font-cute text-xs text-primary">{completionRate}%</span>
          </div>
        </div>
        {summary && (
          <p className="mt-2 text-xs text-muted-foreground/80 leading-relaxed">{summary}</p>
        )}
      </div>

      <p className="font-cute mb-4 text-sm text-muted-foreground">这是我今天想做的一些小事～</p>

      <ol className="relative flex flex-col gap-3 pl-2">
        {/* 时间线竖线 */}
        <span className="absolute bottom-2 left-[1.15rem] top-2 w-0.5 rounded-full bg-border" aria-hidden="true" />
        
        {schedule.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <span className="mb-3 flex size-16 items-center justify-center rounded-full bg-secondary/50">
              <NotebookPen className="size-8 text-muted-foreground" />
            </span>
            <p className="font-cute text-muted-foreground">今天还没有安排日程～</p>
            <p className="mt-1 text-xs text-muted-foreground/60">点击"生成日程"来安排今天吧</p>
          </div>
        ) : (
          schedule.map((item, index) => {
            const status = getScheduleStatus(item, currentTime)
            const isCurrent = index === currentIndex
            
            return (
              <li key={item.time} className="relative flex items-start gap-3">
                <button
                  onClick={() => toggleDone(item.time)}
                  className={`relative z-10 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                    status === 'done'
                      ? 'border-green-400 bg-green-100 text-green-600'
                      : isCurrent
                        ? 'border-primary bg-primary/20 text-primary'
                        : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {getStatusIcon(status)}
                </button>
                
                <div
                  className={`flex-1 rounded-2xl border-2 p-3 transition-all ${getStatusColor(status)} ${
                    isCurrent ? 'ring-2 ring-primary/20' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`size-2 rounded-full ${getDotColor(status)}`} />
                      <p className="font-cute text-sm">{item.time}</p>
                      {isCurrent && (
                        <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs font-cute text-primary">
                          进行中
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground/60">{getStatusLabel(status)}</span>
                  </div>
                  
                  <p className="mt-1 text-sm leading-relaxed text-foreground/85">{item.activity}</p>
                  
                  {item.thought && (
                    <p className="mt-1 text-xs text-muted-foreground/70 italic">💭 {item.thought}</p>
                  )}
                  {item.location && (
                    <p className="mt-0.5 text-xs text-muted-foreground/60">📍 {item.location}</p>
                  )}
                </div>
              </li>
            )
          })
        )}
      </ol>
    </Panel>
  )
}
