'use client'

import { useEffect, useState } from 'react'
import { NotebookPen, RefreshCw } from 'lucide-react'
import { Panel } from './panel'
import { SCHEDULE } from '@/lib/companion-data'
import { companionApi } from '@/lib/companion-api'
import { companionLocal, type ScheduleItem } from '@/lib/companion-local'

type DisplaySchedule = {
  time: string
  text: string
  done: boolean
}

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

function getItemStatus(itemTime: string, currentTime: string, done: boolean): 'past' | 'current' | 'future' | 'done' {
  if (done) return 'done'
  const cmp = timeCompare(itemTime, currentTime)
  if (cmp < 0) return 'past'
  if (cmp === 0) return 'current'
  return 'future'
}

export function SchedulePanel({ open, onClose, characterId = 'maodie' }: { open: boolean; onClose: () => void; characterId?: string }) {
  const [currentTime, setCurrentTime] = useState(getNowTime())
  const [schedule, setSchedule] = useState<DisplaySchedule[]>(SCHEDULE)
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (!open) return
    loadSchedule()
    const timer = setInterval(() => {
      setCurrentTime(getNowTime())
    }, 60000)
    return () => clearInterval(timer)
  }, [open, characterId])

  const loadSchedule = async () => {
    setLoading(true)
    try {
      // 先从本地加载
      const localSchedule = companionLocal.getTodaySchedule(characterId)
      if (localSchedule.length > 0) {
        setSchedule(localSchedule.map(s => ({
          time: s.time,
          text: s.activity || '',
          done: !!s.done,
        })))
      }
      
      // 再尝试从后端获取
      const result = await companionApi.getSchedules(characterId)
      if (result.schedules?.length > 0) {
        const mapped = result.schedules.map((s: any) => ({
          time: s.time,
          text: s.activity || s.text || '',
          done: !!s.done,
        }))
        setSchedule(mapped)
        // 保存到本地
        companionLocal.saveTodaySchedule(
          characterId,
          result.schedules.map((s: any) => ({
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
          done: !!s.done,
        })))
      }
    } catch (err) {
      console.error('Failed to refresh schedule:', err)
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <Panel open={open} onClose={onClose} title="今天的日程" icon={<NotebookPen className="size-5" />}>
      <div className="mb-4 flex items-center justify-between">
        <p className="font-cute text-sm text-muted-foreground">
          这是我今天想做的一些小事～（{currentTime}）
        </p>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-1 rounded-full bg-secondary/50 px-3 py-1.5 font-cute text-xs text-secondary-foreground transition-colors hover:bg-secondary disabled:opacity-50"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? '生成中...' : '刷新'}
        </button>
      </div>
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <span className="mb-3 flex size-16 items-center justify-center rounded-full bg-secondary/50">
            <NotebookPen className="size-8 text-muted-foreground animate-pulse" />
          </span>
          <p className="font-cute text-muted-foreground">正在加载日程...</p>
        </div>
      ) : (
        <ol className="relative flex flex-col gap-4 pl-2">
          {/* 时间线竖线 */}
          <span className="absolute bottom-2 left-[1.15rem] top-2 w-0.5 rounded-full bg-border" aria-hidden="true" />
          {schedule.map((item) => {
            const status = getItemStatus(item.time, currentTime, item.done)
            const isPast = status === 'past'
            const isCurrent = status === 'current'
            const isDone = status === 'done'

            return (
              <li key={item.time} className="relative flex items-start gap-3">
                <span
                  className={`relative z-10 mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full border-2 ${
                    isCurrent
                      ? 'border-amber-400 bg-amber-400 text-amber-950'
                      : isDone
                        ? 'border-green-400 bg-green-400 text-green-950'
                        : isPast
                          ? 'border-muted bg-muted text-muted-foreground'
                          : 'border-border bg-card text-muted-foreground'
                  }`}
                >
                  {isCurrent ? (
                    <span className="size-2.5 rounded-full bg-current animate-pulse" />
                  ) : isDone ? (
                    <span className="size-2 rounded-full bg-current" />
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
                      : isDone
                        ? 'border-green-400/40 bg-green-50/60 opacity-80'
                        : isPast
                          ? 'border-border/50 bg-muted/30 opacity-60'
                          : 'border-border bg-background/60'
                  }`}
                >
                  <p className={`font-cute text-sm ${
                    isCurrent ? 'text-amber-600' :
                    isDone ? 'text-green-600' :
                    'text-primary'
                  }`}>
                    {item.time} {isCurrent && '· 进行中'}
                    {isPast && !isDone && '· 未完成'}
                    {isDone && '· 已完成'}
                  </p>
                  <p className="mt-0.5 text-sm leading-relaxed text-foreground/85">{item.text}</p>
                </div>
              </li>
            )
          })}
        </ol>
      )}
    </Panel>
  )
}
