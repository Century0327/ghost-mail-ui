import { useState } from 'react'
import { Sparkles, Loader2, Calendar, Check, X } from 'lucide-react'
import { Panel } from './panel'
import { companionApi } from '@/lib/companion-api'
import { companionLocal } from '@/lib/companion-local'
import type { ScheduleItem } from '@/lib/companion-local'

export function ScheduleGenerator({ open, onClose, characterId = 'maodie' }: { open: boolean; onClose: () => void; characterId?: string }) {
  const [loading, setLoading] = useState(false)
  const [schedule, setSchedule] = useState<ScheduleItem[] | null>(null)
  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')

  const generate = async () => {
    setLoading(true)
    setError('')
    setSchedule(null)
    setSummary('')

    try {
      // 获取当前状态作为上下文
      const charState = companionLocal.getCharacterState(characterId)
      const history = companionLocal.getScheduleHistory(characterId)
      const lastSchedule = companionLocal.getLastSchedule(characterId)

      const result = await companionApi.generateSchedule({
        character_id: characterId,
        last_schedule: lastSchedule?.items || charState.schedule,
        history_summary: history.currentSummary,
        interact_count: history.totalInteractCount + charState.interactCount,
      })

      if (result.schedule && result.schedule.length > 0) {
        setSchedule(result.schedule)
        setSummary(result.summary || '')

        // 保存到本地存储
        companionLocal.saveTodaySchedule(characterId, result.schedule, result.summary || '')
      } else {
        setError('生成失败，请重试')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败')
    } finally {
      setLoading(false)
    }
  }

  const acceptSchedule = () => {
    if (schedule) {
      companionLocal.saveTodaySchedule(characterId, schedule, summary)
      onClose()
    }
  }

  return (
    <Panel open={open} onClose={onClose} title="AI 日程生成" icon={<Sparkles className="size-5" />}>
      <div className="flex flex-col gap-4">
        <p className="font-cute text-sm text-muted-foreground">
          让 AI 根据角色性格、历史记录和当前时间，生成今天的专属日程～
        </p>

        {!schedule && !loading && (
          <button
            onClick={generate}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-primary bg-primary/10 py-4 font-cute text-primary transition-all hover:bg-primary/20 active:scale-95"
          >
            <Sparkles className="size-5" />
            立即生成今日日程
          </button>
        )}

        {loading && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="size-8 animate-spin text-primary" />
            <p className="font-cute text-sm text-muted-foreground">AI 正在思考今天怎么安排...</p>
          </div>
        )}

        {error && (
          <div className="rounded-2xl border-2 border-red-200 bg-red-50 p-4">
            <div className="flex items-center gap-2 text-red-600">
              <X className="size-4" />
              <span className="font-cute text-sm">{error}</span>
            </div>
            <button
              onClick={generate}
              className="mt-2 rounded-full bg-red-100 px-4 py-1.5 font-cute text-xs text-red-600 transition-colors hover:bg-red-200"
            >
              重试
            </button>
          </div>
        )}

        {schedule && !loading && (
          <div className="flex flex-col gap-3">
            {/* 历史摘要 */}
            {summary && (
              <div className="rounded-2xl border border-border/50 bg-muted/40 p-3">
                <p className="font-cute text-xs text-muted-foreground mb-1">📋 角色状态摘要</p>
                <p className="text-xs text-foreground/80 leading-relaxed">{summary}</p>
              </div>
            )}

            {/* 生成的日程列表 */}
            <div className="rounded-2xl border-2 border-primary/20 bg-primary/5 p-3">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="size-4 text-primary" />
                <span className="font-cute text-sm text-primary">生成的日程</span>
              </div>
              <div className="flex flex-col gap-2">
                {schedule.map((item) => (
                  <div
                    key={item.time}
                    className="flex items-start gap-2 rounded-xl bg-card/80 p-2.5"
                  >
                    <span className="font-cute text-xs text-primary">{item.time}</span>
                    <div className="flex-1">
                      <p className="text-sm text-foreground">{item.activity}</p>
                      {item.thought && (
                        <p className="text-xs text-muted-foreground/70 italic mt-0.5">💭 {item.thought}</p>
                      )}
                      {item.location && (
                        <p className="text-xs text-muted-foreground/60">📍 {item.location}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex gap-2">
              <button
                onClick={acceptSchedule}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl bg-primary py-3 font-cute text-sm text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95"
              >
                <Check className="size-4" />
                采用这个日程
              </button>
              <button
                onClick={generate}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-2xl border-2 border-border bg-card py-3 font-cute text-sm text-foreground transition-colors hover:bg-muted active:scale-95"
              >
                <Sparkles className="size-4" />
                重新生成
              </button>
            </div>
          </div>
        )}
      </div>
    </Panel>
  )
}
