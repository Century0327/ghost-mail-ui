'use client'

import { useEffect, useRef, useState } from 'react'
import { Music, Bell, Moon, Info } from 'lucide-react'

type Toggle = { key: string; label: string; icon: typeof Music; on: boolean }

export function SettingsMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [toggles, setToggles] = useState<Toggle[]>([
    { key: 'music', label: '背景音乐', icon: Music, on: true },
    { key: 'notify', label: '想法提醒', icon: Bell, on: true },
    { key: 'night', label: '夜间灯光', icon: Moon, on: false },
  ])

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      className="animate-bubble-in absolute right-0 top-full z-50 mt-2 w-56 origin-top-right rounded-3xl border-2 border-border bg-card p-2 text-card-foreground shadow-2xl"
      role="menu"
    >
      <div className="px-3 py-2">
        <p className="font-cute text-base text-foreground">设置</p>
        <p className="text-xs text-muted-foreground">让小屋更合你心意～</p>
      </div>
      <div className="flex flex-col gap-1">
        {toggles.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              role="menuitemcheckbox"
              aria-checked={t.on}
              onClick={() =>
                setToggles((prev) =>
                  prev.map((p) => (p.key === t.key ? { ...p, on: !p.on } : p)),
                )
              }
              className="flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors hover:bg-secondary/50"
            >
              <Icon className="size-4 text-primary" />
              <span className="font-cute flex-1 text-left text-sm text-foreground">{t.label}</span>
              <span
                className={`relative h-5 w-9 rounded-full transition-colors ${
                  t.on ? 'bg-primary' : 'bg-border'
                }`}
              >
                <span
                  className={`absolute top-0.5 size-4 rounded-full bg-card transition-all ${
                    t.on ? 'left-[1.15rem]' : 'left-0.5'
                  }`}
                />
              </span>
            </button>
          )
        })}
      </div>
      <div className="mt-1 flex items-center gap-3 rounded-2xl px-3 py-2 text-muted-foreground">
        <Info className="size-4" />
        <span className="text-xs leading-relaxed">喵屋 v1.0 · 一只陪着你的小猫</span>
      </div>
    </div>
  )
}
