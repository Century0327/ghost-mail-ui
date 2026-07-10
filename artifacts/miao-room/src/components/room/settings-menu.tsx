
import { useEffect, useRef, useState } from 'react'
import { Music, Bell, Moon, Info, LogOut, User, Check, LogIn } from 'lucide-react'
import { companionLocal } from '@/lib/companion-local'

type Toggle = { key: string; label: string; icon: typeof Music; on: boolean }

export function SettingsMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [toggles, setToggles] = useState<Toggle[]>([
    { key: 'music', label: '背景音乐', icon: Music, on: true },
    { key: 'notify', label: '想法提醒', icon: Bell, on: true },
    { key: 'night', label: '夜间灯光', icon: Moon, on: false },
  ])
  const [isGuest, setIsGuest] = useState(false)
  const [steamName, setSteamName] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setIsGuest(companionLocal.isGuestMode())
    setSteamName(localStorage.getItem('steam_name'))
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open, onClose])

  const handleLogout = () => {
    localStorage.removeItem('steam_id')
    localStorage.removeItem('steam_name')
    setSteamName(null)
    companionLocal.setGuestMode(false)
    window.location.href = '/'
  }

  const goToLogin = () => {
    onClose()
    window.location.href = '/'
  }

  if (!open) return null

  const isLoggedIn = !!steamName

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

      {/* 开关选项 */}
      <div className="flex flex-col gap-1">
        {toggles.map((t) => {
          const Icon = t.icon
          return (
            <button
              key={t.key}
              role="menuitemcheckbox"
              aria-checked={t.on}
              onClick={() => setToggles((prev) => prev.map((p) => (p.key === t.key ? { ...p, on: !p.on } : p)))}
              className="flex items-center gap-3 rounded-2xl px-3 py-2 transition-colors hover:bg-secondary/50"
            >
              <Icon className="size-4 text-primary" />
              <span className="font-cute flex-1 text-left text-sm text-foreground">{t.label}</span>
              <span className={`relative h-5 w-9 rounded-full transition-colors ${t.on ? 'bg-primary' : 'bg-border'}`}>
                <span className={`absolute top-0.5 size-4 rounded-full bg-card transition-all ${t.on ? 'left-[1.15rem]' : 'left-0.5'}`} />
              </span>
            </button>
          )
        })}
      </div>

      {/* 用户区域 */}
      <div className="mt-2 border-t-2 border-border/50 pt-2">
        {isLoggedIn ? (
          <div className="space-y-1">
            <div className="flex items-center gap-3 rounded-2xl px-3 py-2">
              <div className="flex size-9 items-center justify-center rounded-full bg-primary/10">
                <User className="size-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-cute text-sm text-foreground truncate">{steamName}</p>
                <p className="text-[10px] text-muted-foreground">已登录</p>
              </div>
              <Check className="size-4 text-primary" />
            </div>
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-destructive/80 transition-colors hover:bg-secondary/50"
            >
              <LogOut className="size-4" />
              <span className="font-cute text-sm">退出登录</span>
            </button>
          </div>
        ) : isGuest ? (
          <div className="space-y-1">
            <div className="flex items-center gap-3 rounded-2xl px-3 py-2">
              <div className="flex size-9 items-center justify-center rounded-full bg-secondary">
                <User className="size-4 text-muted-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-cute text-sm text-foreground">游客模式</p>
                <p className="text-[10px] text-muted-foreground">数据存本地，不会同步</p>
              </div>
            </div>
            <button
              onClick={goToLogin}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 transition-colors hover:bg-secondary/50"
            >
              <LogIn className="size-4 text-primary" />
              <span className="font-cute text-sm text-foreground">前往登录</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <button
              onClick={goToLogin}
              className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 transition-colors hover:bg-secondary/50"
            >
              <LogIn className="size-4 text-primary" />
              <span className="font-cute flex-1 text-left text-sm text-foreground">前往登录</span>
            </button>
            <p className="px-3 text-[10px] text-muted-foreground">登录后可保存数据到云端，换设备也能继续~</p>
          </div>
        )}
      </div>

      <div className="mt-1 flex items-center gap-3 rounded-2xl px-3 py-2 text-muted-foreground">
        <Info className="size-4" />
        <span className="text-xs leading-relaxed">喵屋 v1.0 · 一只陪着你的小猫</span>
      </div>
    </div>
  )
}
