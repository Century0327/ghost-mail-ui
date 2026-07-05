'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { CAT_SAYINGS, CAT_THOUGHTS } from '@/lib/companion-data'
import { SpeechBubble } from './speech-bubble'
import { ThoughtBubble } from './thought-bubble'
import { MemoriesPanel } from './memories-panel'
import { ShopPanel } from './shop-panel'
import { SchedulePanel } from './schedule-panel'
import { SettingsMenu } from './settings-menu'

type PanelKind = 'memories' | 'shop' | 'schedule' | null

// 房间里的一件可互动物品：像素精灵 + 圆润标签。
function RoomObject({
  src,
  alt,
  label,
  onClick,
  style,
  size,
  uiHidden,
}: {
  src: string
  alt: string
  label: string
  onClick: () => void
  style: React.CSSProperties
  size: string
  uiHidden: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={style}
      className="group absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center focus:outline-none"
      aria-label={label}
    >
      <img
        src={src || '/placeholder.svg'}
        alt={alt}
        style={{ width: size }}
        className="pixelated drop-shadow-[0_6px_10px_rgba(90,60,40,0.28)] transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105"
      />
      <span
        className={`ui-fade mt-1 rounded-full border-2 border-border bg-card/95 px-3 py-0.5 font-cute text-sm text-card-foreground shadow-md ${
          uiHidden ? 'ui-hidden' : ''
        }`}
      >
        {label}
      </span>
    </button>
  )
}

export function CozyRoom() {
  const [uiHidden, setUiHidden] = useState(false)
  const [panel, setPanel] = useState<PanelKind>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [speech, setSpeech] = useState<string | null>(null)
  const [thought, setThought] = useState<string | null>(null)
  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // 点击猫：随机说一句话（对话气泡），几秒后消失。
  const petCat = useCallback(() => {
    const line = CAT_SAYINGS[Math.floor(Math.random() * CAT_SAYINGS.length)]
    setSpeech(line)
    setThought(null)
    if (speechTimer.current) clearTimeout(speechTimer.current)
    speechTimer.current = setTimeout(() => setSpeech(null), 3600)
  }, [])

  // 猫偶尔自己冒出的想法（想法气泡）。收起 UI 或有对话时不显示。
  useEffect(() => {
    if (uiHidden) {
      setThought(null)
      return
    }
    let hideTimer: ReturnType<typeof setTimeout>
    const show = () => {
      setThought((prev) => {
        if (speech) return prev
        return CAT_THOUGHTS[Math.floor(Math.random() * CAT_THOUGHTS.length)]
      })
      hideTimer = setTimeout(() => setThought(null), 5200)
    }
    const first = setTimeout(show, 1800)
    const loop = setInterval(show, 9000)
    return () => {
      clearTimeout(first)
      clearTimeout(hideTimer)
      clearInterval(loop)
    }
  }, [uiHidden, speech])

  useEffect(() => {
    return () => {
      if (speechTimer.current) clearTimeout(speechTimer.current)
    }
  }, [])

  const showThought = !uiHidden && !!thought && !speech

  return (
    <div className="relative flex min-h-[100dvh] items-center justify-center overflow-hidden bg-background p-3">
      {/* 一键收起：眼睛按钮（始终可见，用于恢复 UI） */}
      <button
        onClick={() => {
          setUiHidden((v) => !v)
          setSettingsOpen(false)
        }}
        aria-label={uiHidden ? '显示界面' : '隐藏界面'}
        className="fixed left-4 top-4 z-40 flex size-11 items-center justify-center rounded-full border-2 border-border bg-card/90 text-foreground shadow-lg backdrop-blur transition-transform hover:scale-105 active:scale-95"
      >
        {uiHidden ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>

      {/* 右上角：用户头像 + 设置菜单 */}
      <div className={`ui-fade fixed right-4 top-4 z-40 ${uiHidden ? 'ui-hidden' : ''}`}>
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          aria-label="设置"
          aria-expanded={settingsOpen}
          className="flex size-11 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-secondary text-secondary-foreground shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <span className="font-cute text-lg">喵</span>
        </button>
        <SettingsMenu open={settingsOpen && !uiHidden} onClose={() => setSettingsOpen(false)} />
      </div>

      {/* 房间舞台 */}
      <div className="relative aspect-square w-full max-w-[min(88dvh,40rem)] select-none">
        <img
          src="/room/room-bg.png"
          alt="温暖的像素小房间"
          className="pixelated absolute inset-0 size-full rounded-[2rem] object-contain"
          draggable={false}
        />

        {/* 记忆（信箱） */}
        <RoomObject
          src="/room/mailbox.png"
          alt="记忆信箱"
          label="记忆"
          size="16%"
          style={{ left: '15%', top: '70%' }}
          uiHidden={uiHidden}
          onClick={() => setPanel('memories')}
        />

        {/* 商店（货架小推车） */}
        <RoomObject
          src="/room/cart.png"
          alt="喵屋小店"
          label="商店"
          size="17%"
          style={{ left: '83%', top: '66%' }}
          uiHidden={uiHidden}
          onClick={() => setPanel('shop')}
        />

        {/* 日程（桌上的笔记本） */}
        <RoomObject
          src="/room/notebook.png"
          alt="日程笔记本"
          label="日程"
          size="14%"
          style={{ left: '34%', top: '78%' }}
          uiHidden={uiHidden}
          onClick={() => setPanel('schedule')}
        />

        {/* 猫咪：房间正中央，点击说话 */}
        <button
          onClick={petCat}
          aria-label="摸摸猫咪"
          className="absolute left-1/2 top-[60%] flex -translate-x-1/2 -translate-y-1/2 flex-col items-center focus:outline-none"
        >
          <img
            src="/room/cat.png"
            alt="陪伴你的小猫"
            style={{ width: '30%', minWidth: '150px' }}
            className="pixelated animate-breathe drop-shadow-[0_10px_14px_rgba(90,60,40,0.3)]"
            draggable={false}
          />
        </button>

        {/* 对话气泡（点击猫时） */}
        {speech && (
          <div className="pointer-events-none absolute left-1/2 top-[34%] z-20 -translate-x-1/2 -translate-y-full">
            <SpeechBubble text={speech} />
          </div>
        )}

        {/* 想法气泡（猫自己冒出，可点击展开日程） */}
        {showThought && (
          <div className="absolute left-[70%] top-[30%] z-20 -translate-y-full">
            <ThoughtBubble text={thought!} onClick={() => setPanel('schedule')} />
          </div>
        )}
      </div>

      {/* 底部小提示 */}
      <p
        className={`ui-fade fixed bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full border-2 border-border bg-card/90 px-4 py-1.5 text-center font-cute text-xs text-muted-foreground shadow-md backdrop-blur ${
          uiHidden ? 'ui-hidden' : ''
        }`}
      >
        点击房间里的物品探索 · 摸摸猫咪听它说话
      </p>

      {/* 功能弹窗 */}
      <MemoriesPanel open={panel === 'memories'} onClose={() => setPanel(null)} />
      <ShopPanel open={panel === 'shop'} onClose={() => setPanel(null)} />
      <SchedulePanel open={panel === 'schedule'} onClose={() => setPanel(null)} />
    </div>
  )
}
