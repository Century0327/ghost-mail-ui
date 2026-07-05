'use client'

import { useEffect, useRef, useState } from 'react'
import { Music, Bell, Moon, Info, LogOut, User } from 'lucide-react'

type Toggle = { key: string; label: string; icon: typeof Music; on: boolean }

export function SettingsMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [toggles, setToggles] = useState<Toggle[]>([
    { key: 'music', label: '背景音乐', icon: Music, on: true },
    { key: 'notify', label: '想法提醒', icon: Bell, on: true },
    { key: 'night', label: '夜间灯光', icon: Moon, on: false },
  ])
  const [showLogin, setShowLogin] = useState(false)

  useEffect(() => {
    if (!open) {
      setShowLogin(false)
      return
    }
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
      className="animate-bubble-in absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-3xl border-2 border-border bg-card p-2 text-card-foreground shadow-2xl"
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
      
      {/* 登录区域 */}
      <div className="mt-2 border-t-2 border-border/50 pt-2">
        {!showLogin ? (
          <button
            onClick={() => setShowLogin(true)}
            className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 transition-colors hover:bg-secondary/50"
          >
            <User className="size-4 text-primary" />
            <span className="font-cute flex-1 text-left text-sm text-foreground">登录账号</span>
          </button>
        ) : (
          <div className="px-3 py-2 space-y-2">
            <p className="font-cute text-xs text-muted-foreground">选择登录方式</p>
            <div className="grid grid-cols-2 gap-2">
              <button className="rounded-xl bg-secondary/50 px-2 py-1.5 text-xs font-cute hover:bg-secondary">手机号</button>
              <button className="rounded-xl bg-secondary/50 px-2 py-1.5 text-xs font-cute hover:bg-secondary">微信</button>
              <button className="rounded-xl bg-secondary/50 px-2 py-1.5 text-xs font-cute hover:bg-secondary">邮箱</button>
              <button className="rounded-xl bg-secondary/50 px-2 py-1.5 text-xs font-cute hover:bg-secondary">Google</button>
              <button className="rounded-xl bg-secondary/50 px-2 py-1.5 text-xs font-cute hover:bg-secondary">GitHub</button>
              <button className="rounded-xl border border-dashed border-border px-2 py-1.5 text-xs font-cute text-muted-foreground hover:bg-secondary/30">跳过</button>
            </div>
            <p className="text-[10px] text-destructive/80">跳过登录可能导致本地数据丢失</p>
            <button onClick={() => setShowLogin(false)} className="text-xs text-muted-foreground hover:text-foreground">← 返回</button>
          </div>
        )}
        <button
          className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 transition-colors hover:bg-secondary/50 text-destructive/80"
        >
          <LogOut className="size-4" />
          <span className="font-cute flex-1 text-left text-sm">登出</span>
        </button>
      </div>
      
      <div className="mt-1 flex items-center gap-3 rounded-2xl px-3 py-2 text-muted-foreground">
        <Info className="size-4" />
        <span className="text-xs leading-relaxed">喵屋 v1.0 · 一只陪着你的小猫</span>
      </div>
    </div>
  )
}
