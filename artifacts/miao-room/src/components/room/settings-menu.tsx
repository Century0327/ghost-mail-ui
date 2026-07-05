

import { useEffect, useRef, useState } from 'react'
import { Music, Bell, Moon, Info, LogOut, User, Phone, Mail, MessageCircle, Globe, Code, TriangleAlert as AlertTriangle, Check, X } from 'lucide-react'

type Toggle = { key: string; label: string; icon: typeof Music; on: boolean }

// 登录方式配置
const LOGIN_METHODS = [
  { id: 'phone', label: '手机号', icon: Phone, color: '#10b981' },
  { id: 'wechat', label: '微信', icon: MessageCircle, color: '#07c160' },
  { id: 'email', label: '邮箱', icon: Mail, color: '#ea580c' },
  { id: 'google', label: 'Google', icon: Globe, color: '#4285f4' },
  { id: 'github', label: 'GitHub', icon: Code, color: '#333' },
]

// 跳过登录确认弹窗
function SkipLoginAlert({
  open,
  onConfirm,
  onCancel,
}: {
  open: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-foreground/30 backdrop-blur-sm animate-in fade-in">
      <div
        className="mx-4 w-full max-w-sm rounded-3xl border border-border bg-card p-5 shadow-2xl animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="size-5 text-destructive" />
          </span>
          <h3 className="font-cute text-lg text-foreground">确定跳过登录？</h3>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          跳过登录可能导致本地数据丢失，包括：
        </p>
        <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-destructive" />
            角色进度和数据
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-destructive" />
            收藏的信件和相册
          </li>
          <li className="flex items-center gap-2">
            <span className="size-1.5 rounded-full bg-destructive" />
            仓库中的物品
          </li>
        </ul>
        <div className="mt-4 flex gap-2">
          <button
            onClick={onCancel}
            className="flex-1 rounded-xl border border-border py-2 font-cute text-sm text-muted-foreground transition hover:bg-secondary"
          >
            返回登录
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 rounded-xl bg-destructive py-2 font-cute text-sm text-destructive-foreground transition hover:brightness-110"
          >
            确定跳过
          </button>
        </div>
      </div>
    </div>
  )
}

// 手机号/邮箱登录表单
function LoginForm({
  method,
  onBack,
  onSuccess,
}: {
  method: 'phone' | 'email'
  onBack: () => void
  onSuccess: () => void
}) {
  const [input, setInput] = useState('')
  const [code, setCode] = useState('')
  const [sending, setSending] = useState(false)
  const [countdown, setCountdown] = useState(0)

  const handleSendCode = () => {
    if (sending || countdown > 0) return
    setSending(true)
    // 模拟发送验证码
    setTimeout(() => {
      setSending(false)
      setCountdown(60)
      const timer = setInterval(() => {
        setCountdown((c) => {
          if (c <= 1) {
            clearInterval(timer)
            return 0
          }
          return c - 1
        })
      }, 1000)
    }, 1000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // 模拟登录成功
    onSuccess()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <button
        type="button"
        onClick={onBack}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        ← 返回其他方式
      </button>
      <div>
        <input
          type={method === 'phone' ? 'tel' : 'email'}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={method === 'phone' ? '请输入手机号' : '请输入邮箱'}
          className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="验证码"
          maxLength={6}
          className="flex-1 rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
        <button
          type="button"
          onClick={handleSendCode}
          disabled={sending || countdown > 0 || !input}
          className="shrink-0 rounded-xl bg-primary/10 px-4 py-2.5 text-xs text-primary transition hover:bg-primary/20 disabled:opacity-50"
        >
          {sending ? '发送中...' : countdown > 0 ? `${countdown}s` : '获取验证码'}
        </button>
      </div>
      <button
        type="submit"
        disabled={!input || code.length < 4}
        className="w-full rounded-xl bg-primary py-2.5 font-cute text-sm text-primary-foreground transition hover:brightness-105 disabled:opacity-50"
      >
        登录
      </button>
    </form>
  )
}

export function SettingsMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null)
  const [toggles, setToggles] = useState<Toggle[]>([
    { key: 'music', label: '背景音乐', icon: Music, on: true },
    { key: 'notify', label: '想法提醒', icon: Bell, on: true },
    { key: 'night', label: '夜间灯光', icon: Moon, on: false },
  ])
  const [loginStep, setLoginStep] = useState<'menu' | 'method' | 'phone' | 'email' | 'skip'>('menu')
  const [showSkipAlert, setShowSkipAlert] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState<{ name: string; avatar?: string } | null>(null)

  useEffect(() => {
    if (!open) {
      setLoginStep('menu')
      return
    }
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    window.addEventListener('mousedown', onDown)
    return () => window.removeEventListener('mousedown', onDown)
  }, [open, onClose])

  const handleLoginSuccess = () => {
    setUserInfo({ name: '喵星人' })
    setIsLoggedIn(true)
    setLoginStep('menu')
  }

  const handleLogout = () => {
    setIsLoggedIn(false)
    setUserInfo(null)
  }

  if (!open) return null

  return (
    <>
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

        {/* 用户区域 */}
        <div className="mt-2 border-t-2 border-border/50 pt-2">
          {isLoggedIn && userInfo ? (
            // 已登录状态
            <div className="space-y-1">
              <div className="flex items-center gap-3 rounded-2xl px-3 py-2">
                <div className="flex size-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <User className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-cute text-sm text-foreground truncate">{userInfo.name}</p>
                  <p className="text-[10px] text-muted-foreground">已登录</p>
                </div>
                <Check className="size-4 text-primary" />
              </div>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 text-destructive/80 transition-colors hover:bg-secondary/50"
              >
                <LogOut className="size-4" />
                <span className="font-cute text-sm">登出</span>
              </button>
            </div>
          ) : (
            // 未登录状态
            <div className="space-y-2">
              {loginStep === 'menu' ? (
                <>
                  <button
                    onClick={() => setLoginStep('method')}
                    className="flex w-full items-center gap-3 rounded-2xl px-3 py-2 transition-colors hover:bg-secondary/50"
                  >
                    <User className="size-4 text-primary" />
                    <span className="font-cute flex-1 text-left text-sm text-foreground">登录账号</span>
                  </button>
                  <p className="px-3 text-[10px] text-muted-foreground">
                    登录后可保存数据到云端，换设备也能继续~
                  </p>
                </>
              ) : loginStep === 'method' ? (
                <div className="px-3 py-2 space-y-2">
                  <button
                    onClick={() => setLoginStep('menu')}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    ← 返回
                  </button>
                  <p className="font-cute text-xs text-muted-foreground">选择登录方式</p>
                  <div className="grid grid-cols-2 gap-2">
                    {LOGIN_METHODS.map((method) => {
                      const Icon = method.icon
                      return (
                        <button
                          key={method.id}
                          onClick={() => {
                            if (method.id === 'phone') setLoginStep('phone')
                            else if (method.id === 'email') setLoginStep('email')
                            else {
                              // 第三方登录模拟
                              handleLoginSuccess()
                            }
                          }}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary/50 px-2 py-2 text-xs font-cute transition hover:bg-secondary"
                        >
                          <Icon className="size-3.5" style={{ color: method.color }} />
                          {method.label}
                        </button>
                      )
                    })}
                    <button
                      onClick={() => setShowSkipAlert(true)}
                      className="col-span-2 rounded-xl border border-dashed border-border px-2 py-2 text-xs font-cute text-muted-foreground transition hover:bg-secondary/30"
                    >
                      跳过登录
                    </button>
                  </div>
                  <p className="text-[10px] text-destructive/80">
                    跳过登录可能导致本地数据丢失
                  </p>
                </div>
              ) : loginStep === 'phone' || loginStep === 'email' ? (
                <div className="px-3 py-2">
                  <LoginForm
                    method={loginStep}
                    onBack={() => setLoginStep('method')}
                    onSuccess={handleLoginSuccess}
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>

        <div className="mt-1 flex items-center gap-3 rounded-2xl px-3 py-2 text-muted-foreground">
          <Info className="size-4" />
          <span className="text-xs leading-relaxed">喵屋 v1.0 · 一只陪着你的小猫</span>
        </div>
      </div>

      {/* 跳过登录确认弹窗 */}
      <SkipLoginAlert
        open={showSkipAlert}
        onConfirm={() => {
          setShowSkipAlert(false)
          setLoginStep('menu')
          onClose()
        }}
        onCancel={() => setShowSkipAlert(false)}
      />
    </>
  )
}
