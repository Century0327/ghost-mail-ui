'use client'

import { useEffect, useState } from 'react'
import { NotebookPen, RefreshCw, Check, X } from 'lucide-react'
import { Panel } from './panel'
import { SCHEDULE } from '@/lib/companion-data'
import { companionApi } from '@/lib/companion-api'
import { companionLocal, type ScheduleItem } from '@/lib/companion-local'

type DisplaySchedule = {
  time: string
  text: string
  location?: string
  thought?: string
  done: boolean
}

function getNowTime(): string {
  const now = new Date()
  const h = String(now.getHours()).padStart(2, '0')
  const m = String(now.getMinutes()).padStart(2, '0')
  return `${h}:${m}`
}

function getDateStr(): string {
  const now = new Date()
  const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  const w = weekdays[now.getDay()]
  return `${y}年${m}月${d}日 ${w}`
}

function timeCompare(a: string, b: string): number {
  const [ah, am] = a.split(':').map(Number)
  const [bh, bm] = b.split(':').map(Number)
  return ah * 60 + am - (bh * 60 + bm)
}

function getItemStatus(itemTime: string, currentTime: string, done: boolean): 'past' | 'current' | 'future' | 'done' {
  if (done) return 'done'
  const cmp = timeCompare(itemTime, currentTime)
  if (cmp < 0) return 'past'
  if (cmp === 0) return 'current'
  return 'future'
}

export function SchedulePanel({ open, onClose, characterId = 'maodie' }: { open: boolean; onClose: () => void; characterId?: string }) {
  const [currentTime, setCurrentTime] = useState(getNowTime())
  const [dateStr, setDateStr] = useState(getDateStr())
  const [schedule, setSchedule] = useState<DisplaySchedule[]>(SCHEDULE.map(s => ({
    time: s.time,
    text: s.text,
    done: s.done,
  })))
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!open) return
    loadSchedule()
    const timer = setInterval(() => {
      setCurrentTime(getNowTime())
      setDateStr(getDateStr())
    }, 60000)
    return () => clearInterval(timer)
  }, [open, characterId])

  const loadSchedule = async () => {
    setLoading(true)
    try {
      const localSchedule = companionLocal.getTodaySchedule(characterId)
      if (localSchedule.length > 0) {
        setSchedule(localSchedule.map(s => ({
          time: s.time,
          text: s.activity || '',
          location: s.location,
          thought: s.thought,
          done: !!s.done,
        })))
      }
      
      const result = await companionApi.getSchedules(characterId)
      const list = Array.isArray(result.schedules) ? result.schedules : []
      if (list.length > 0) {
        const mapped = list.map((s: any) => ({
          time: s.time,
          text: s.activity || s.text || '',
          location: s.location,
          thought: s.thought,
          done: !!s.done,
        }))
        setSchedule(mapped)
        companionLocal.saveTodaySchedule(
          characterId,
          list.map((s: any) => ({
            time: s.time,
            activity: s.activity || s.text || '',
            location: s.location || '',
            thought: s.thought || '',
            done: !!s.done,
          })),
          ''
        )
      }
    } catch (err) {
      console.error('Failed to load schedule:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      const result = await companionApi.refreshSchedule(characterId)
      if (result.schedule) {
        setSchedule(result.schedule.map((s: ScheduleItem) => ({
          time: s.time,
          text: s.activity || '',
          location: s.location,
          thought: s.thought,
          done: !!s.done,
        })))
      }
    } catch (err) {
      console.error('Failed to refresh schedule:', err)
    } finally {
      setRefreshing(false)
    }
  }

  const toggleDone = (time: string) => {
    setSchedule(prev => prev.map(item =>
      item.time === time ? { ...item, done: !item.done } : item
    ))
    companionLocal.toggleScheduleDone(characterId, time)
  }

  return (
    <Panel open={open} onClose={onClose} title="今天的日程" icon={<NotebookPen className="size-5" />}>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="font-pixel text-sm text-muted-foreground">{dateStr}</p>
          <p className="font-pixel mt-0.5 text-xs text-muted-foreground/70">当前 {currentTime}</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1 rounded-full bg-secondary/50 px-3 py-1.5 font-pixel text-xs text-secondary-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? '刷新中...' : '刷新'}
        </button>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="mb-3 flex size-16 items-center justify-center rounded-full bg-secondary/50">
            <NotebookPen className="size-8 text-muted-foreground animate-pulse" />
          </span>
          <p className="font-pixel text-muted-foreground">加载中...</p>
        </div>
      ) : (
        <ol className="relative flex flex-col gap-3 pl-2">
          <span className="absolute bottom-2 left-[1.15rem] top-2 w-0.5 rounded-full bg-border" aria-hidden="true" />
          {schedule.map((item) => {
            const status = getItemStatus(item.time, currentTime, item.done)
            const isPast = status === 'past'
            const isCurrent = status === 'current'
            const isDone = status === 'done'

            return (
              <li key={item.time} className="relative flex items-start gap-3">
                <button
                  onClick={() => toggleDone(item.time)}
                  className={`relative z-10 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border-2 transition-all hover:scale-105 ${
                    isDone
                      ? 'border-green-400 bg-green-400 text-green-950'
                      : isCurrent
                        ? 'border-amber-400 bg-amber-400 text-amber-950'
                        : isPast
                          ? 'border-muted bg-muted text-muted-foreground'
                          : 'border-border bg-card text-muted-foreground hover:border-primary/50'
                  }`}
                >
                  {isDone ? (
                    <Check className="size-4" />
                  ) : isCurrent ? (
                    <span className="size-2.5 rounded-full bg-current animate-pulse" />
                  ) : isPast ? (
                    <X className="size-3 opacity-60" />
                  ) : (
                    <span className="size-2 rounded-full bg-current" />
                  )}
                </button>
                <div
                  className={`flex-1 rounded-2xl border-2 p-3 transition-all ${
                    isDone
                      ? 'border-green-300/50 bg-green-50/40'
                      : isCurrent
                        ? 'border-amber-400/50 bg-amber-50/60'
                        : isPast
                          ? 'border-border/40 bg-muted/20'
                          : 'border-border bg-background/60'
                  }`}
                  style={{
                    filter: isPast && !isDone ? 'saturate(0.5) opacity(0.65)' : isDone ? 'saturate(0.7)' : 'none',
                  }}
                >
                  <div className="flex items-center gap-2">
                    <span className={`font-pixel text-sm ${
                      isDone ? 'text-green-600 line-through' :
                      isCurrent ? 'text-amber-600' :
                      isPast ? 'text-muted-foreground line-through' :
                      'text-foreground'
                    }`}>
                      {item.time}
                    </span>
                    {item.location && (
                      <span className="font-pixel text-[10px] text-muted-foreground/70">
                        · {item.location}
                      </span>
                    )}
                  </div>
                  <p className={`mt-1 text-sm leading-relaxed ${
                    isDone ? 'text-muted-foreground line-through' :
                    isPast ? 'text-muted-foreground' :
                    'text-foreground/85'
                  }`}>
                    {item.text}
                  </p>
                  {item.thought && (isPast || isDone) && (
                    <p className="mt-1 font-pixel text-[10px] text-muted-foreground/60 italic">
                      「{item.thought}」
                    </p>
                  )}
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Panel>
  )
}
