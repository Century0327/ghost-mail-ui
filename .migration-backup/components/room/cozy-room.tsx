'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Heart, Image, Users } from 'lucide-react'
import { CAT_SAYINGS, CAT_THOUGHTS, OFFICIAL_CHARACTERS, type Character } from '@/lib/companion-data'
import { SpeechBubble } from './speech-bubble'
import { ThoughtBubble } from './thought-bubble'
import { MemoriesPanel } from './memories-panel'
import { ShopPanel } from './shop-panel'
import { SchedulePanel } from './schedule-panel'
import { SettingsMenu } from './settings-menu'
import { AlbumPanel } from './album-panel'
import { CharacterSelector } from './character-selector'

type PanelKind = 'memories' | 'shop' | 'schedule' | 'album' | 'character' | null

// 房间里的一件可互动物品：像素精灵 + 圆润标签。
function RoomObject({
  src,
  alt,
  label,
  onClick,
  style,
  size,
  uiHidden,
  float = false,
}: {
  src: string
  alt: string
  label: string
  onClick: () => void
  style: React.CSSProperties
  size: string
  uiHidden: boolean
  float?: boolean
}) {
  return (
    <button
      onClick={onClick}
      style={style}
      className={`group absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center focus:outline-none ${float ? 'animate-float' : ''}`}
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

// 角色信息条（血条样式）- 跟随角色位置
function CharacterInfoBar({
  visible,
  name,
  statValue,
  statName,
  stage,
  position,
}: {
  visible: boolean
  name: string
  statValue: number
  statName: string
  stage: string
  position: { x: number; y: number }
}) {
  if (!visible) return null
  return (
    <div
      className="animate-bubble-in pointer-events-none absolute z-30 w-48"
      style={{
        left: `${position.x}%`,
        top: `${position.y - 25}%`,
        transform: 'translate(-50%, 0)'
      }}
    >
      <div className="rounded-2xl border-2 border-border bg-card/95 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-cute text-sm font-bold text-foreground">{name}</span>
          <span className="font-cute text-xs text-muted-foreground">{stage}</span>
        </div>
        <div className="flex items-center gap-2">
          <Heart className="size-3.5 text-primary fill-primary" />
          <div className="flex-1 h-2.5 rounded-full bg-border overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-700"
              style={{ width: `${statValue}%` }}
            />
          </div>
          <span className="font-cute text-xs text-primary font-bold">{statValue}</span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">{statName}</p>
      </div>
    </div>
  )
}

export function CozyRoom() {
  const [uiHidden, setUiHidden] = useState(false)
  const [panel, setPanel] = useState<PanelKind>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [speech, setSpeech] = useState<string | null>(null)
  const [thought, setThought] = useState<string | null>(null)
  const [infoBarVisible, setInfoBarVisible] = useState(false)
  const [isNight, setIsNight] = useState(false)

  // 当前角色
  const [currentCharacter, setCurrentCharacter] = useState<Character>(OFFICIAL_CHARACTERS[0])
  const [ownedCharacterIds, setOwnedCharacterIds] = useState<string[]>(['char-kitty']) // 默认拥有第一个角色

  // 猫的位置（可拖动）
  const [catPos, setCatPos] = useState({ x: 50, y: 60 }) // 百分比
  const [isDragging, setIsDragging] = useState(false)
  const dragStartRef = useRef<{ x: number; y: number; catX: number; catY: number } | null>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const roomRef = useRef<HTMLDivElement>(null)

  const speechTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const infoBarTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const lastTouchTimeRef = useRef<number>(0)
  const touchCountRef = useRef<number>(0)

  // 自动夜间模式
  useEffect(() => {
    const hour = new Date().getHours()
    setIsNight(hour >= 18 || hour < 6)
  }, [])

  // 点击猫：随机说一句话（对话气泡），几秒后消失。
  const petCat = useCallback(() => {
    if (isDragging) return
    const line = CAT_SAYINGS[Math.floor(Math.random() * CAT_SAYINGS.length)]
    setSpeech(line)
    setThought(null)
    setInfoBarVisible(false)
    if (speechTimer.current) clearTimeout(speechTimer.current)
    speechTimer.current = setTimeout(() => setSpeech(null), 3600)
  }, [isDragging])

  // PC端：鼠标悬停显示信息条
  const handleMouseEnter = useCallback(() => {
    if (isDragging) return
    // 延迟300ms显示，避免误触
    hoverTimerRef.current = setTimeout(() => {
      setSpeech(null)
      setThought(null)
      setInfoBarVisible(true)
      if (infoBarTimer.current) clearTimeout(infoBarTimer.current)
      infoBarTimer.current = setTimeout(() => setInfoBarVisible(false), 4000)
    }, 300)
  }, [isDragging])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
  }, [])

  // 移动端：双击或双指单击显示信息条
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const now = Date.now()
    const touchCount = e.touches.length

    // 双指单击：显示信息条
    if (touchCount >= 2) {
      e.preventDefault()
      setSpeech(null)
      setThought(null)
      setInfoBarVisible(true)
      if (infoBarTimer.current) clearTimeout(infoBarTimer.current)
      infoBarTimer.current = setTimeout(() => setInfoBarVisible(false), 4000)
      touchCountRef.current = 0
      lastTouchTimeRef.current = 0
      return
    }

    // 单指双击检测
    if (now - lastTouchTimeRef.current < 400 && touchCountRef.current === 1) {
      // 双击：显示信息条
      e.preventDefault()
      setSpeech(null)
      setThought(null)
      setInfoBarVisible(true)
      if (infoBarTimer.current) clearTimeout(infoBarTimer.current)
      infoBarTimer.current = setTimeout(() => setInfoBarVisible(false), 4000)
      touchCountRef.current = 0
      lastTouchTimeRef.current = 0
    } else {
      touchCountRef.current = 1
      lastTouchTimeRef.current = now
    }
  }, [])

  // 猫偶尔自己冒出的想法
  useEffect(() => {
    if (uiHidden || infoBarVisible) {
      setThought(null)
      return
    }
    let hideTimer: ReturnType<typeof setTimeout>
    const show = () => {
      setThought((prev) => {
        if (speech || infoBarVisible) return prev
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
  }, [uiHidden, speech, infoBarVisible])

  useEffect(() => {
    return () => {
      if (speechTimer.current) clearTimeout(speechTimer.current)
      if (infoBarTimer.current) clearTimeout(infoBarTimer.current)
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
    }
  }, [])

  // 长按拖动逻辑
  const handleCatPointerDown = useCallback((e: React.PointerEvent) => {
    if (!roomRef.current) return
    const rect = roomRef.current.getBoundingClientRect()
    const clientX = e.clientX
    const clientY = e.clientY
    
    longPressTimer.current = setTimeout(() => {
      setIsDragging(true)
      setSpeech(null)
      setThought(null)
      setInfoBarVisible(false)
      dragStartRef.current = {
        x: clientX,
        y: clientY,
        catX: catPos.x,
        catY: catPos.y,
      }
      // 改变光标
      if (roomRef.current) roomRef.current.style.cursor = 'grabbing'
    }, 500)
  }, [catPos])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current || !roomRef.current) return
    const rect = roomRef.current.getBoundingClientRect()
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    const newX = dragStartRef.current.catX + (dx / rect.width) * 100
    const newY = dragStartRef.current.catY + (dy / rect.height) * 100
    setCatPos({
      x: Math.max(10, Math.min(90, newX)),
      y: Math.max(20, Math.min(85, newY)),
    })
  }, [isDragging])

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    if (isDragging) {
      setIsDragging(false)
      dragStartRef.current = null
      if (roomRef.current) roomRef.current.style.cursor = 'default'
    }
  }, [isDragging])

  const showThought = !uiHidden && !!thought && !speech && !infoBarVisible && !isDragging

  // 切换夜间模式
  const toggleNight = useCallback(() => {
    setIsNight((v) => !v)
  }, [])

  return (
    <div className={`relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-3 ${isNight ? 'dark' : ''}`}>
      <div className={`absolute inset-0 transition-colors duration-700 ${isNight ? 'bg-[#2a2420]' : 'bg-background'}`} />

      {/* 一键收起：眼睛按钮 */}
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

      {/* 左上角：相册入口 */}
      <button
        onClick={() => setPanel('album')}
        className={`ui-fade fixed left-4 top-20 z-40 flex items-center gap-2 rounded-full border-2 border-border bg-card/90 px-3 py-2 shadow-lg backdrop-blur transition-transform hover:scale-105 active:scale-95 ${uiHidden ? 'ui-hidden' : ''}`}
      >
        <Image className="size-4 text-primary" />
        <span className="font-cute text-sm">相册</span>
      </button>

      {/* 左下角：角色切换入口 */}
      <button
        onClick={() => setPanel('character')}
        className={`ui-fade fixed left-4 bottom-20 z-40 flex items-center gap-2 rounded-full border-2 border-border bg-card/90 px-3 py-2 shadow-lg backdrop-blur transition-transform hover:scale-105 active:scale-95 ${uiHidden ? 'ui-hidden' : ''}`}
      >
        <Users className="size-4 text-primary" />
        <span className="font-cute text-sm">角色</span>
      </button>

      {/* 房间舞台 */}
      <div
        ref={roomRef}
        className="relative aspect-square w-full max-w-[min(88dvh,40rem)] select-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* 房间背景 */}
        <img
          src={isNight ? '/room/room-bg-night.png' : '/room/room-bg.png'}
          alt="温暖的像素小房间"
          className="pixelated absolute inset-0 size-full rounded-[2rem] object-contain"
          draggable={false}
        />
        
        {/* 夜间模式遮罩 */}
        {isNight && (
          <div className="absolute inset-0 rounded-[2rem] bg-[#1a1510]/40 pointer-events-none" />
        )}

        {/* 台灯（可点击切换夜间模式） */}
        <button
          onClick={toggleNight}
          className={`group absolute z-30 flex flex-col items-center focus:outline-none ${uiHidden ? 'ui-hidden' : ''}`}
          style={{ left: '22%', top: '38%' }}
        >
          <div className="relative">
            <div className={`w-8 h-10 rounded-full transition-all duration-500 ${isNight ? 'bg-[#ffe4a0] shadow-[0_0_20px_rgba(255,228,160,0.6)]' : 'bg-[#d4c4a8]'}`} />
            <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 rounded-full px-2 py-0.5 font-cute text-[10px] whitespace-nowrap transition-opacity ${uiHidden ? 'opacity-0' : 'opacity-100'}`}>
              {isNight ? '关灯' : '开灯'}
            </div>
          </div>
        </button>

        {/* 记忆 → 地板上的信 */}
        <RoomObject
          src="/room/letter.png"
          alt="记忆信件"
          label="记忆"
          size="12%"
          style={{ left: '45%', top: '82%' }}
          uiHidden={uiHidden}
          onClick={() => setPanel('memories')}
        />

        {/* 商店 → 右下角（保留，等待大改） */}
        <RoomObject
          src="/room/cart.png"
          alt="喵屋小店"
          label="物品"
          size="14%"
          style={{ left: '88%', top: '78%' }}
          uiHidden={uiHidden}
          onClick={() => setPanel('shop')}
        />

        {/* 日程 → 书架上的便利贴 */}
        <RoomObject
          src="/room/sticky-note.png"
          alt="日程便利贴"
          label="日程"
          size="10%"
          style={{ left: '78%', top: '28%' }}
          uiHidden={uiHidden}
          onClick={() => setPanel('schedule')}
          float
        />

        {/* 猫咪/角色：可点击、PC端悬停显示信息、移动端双击/双指显示信息、长按拖动 */}
        <button
          onClick={petCat}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onPointerDown={handleCatPointerDown}
          aria-label={`摸摸${currentCharacter.name}`}
          className={`absolute z-20 flex flex-col items-center focus:outline-none ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
          style={{ left: `${catPos.x}%`, top: `${catPos.y}%`, transform: 'translate(-50%, -50%)' }}
        >
          <img
            src={currentCharacter.image}
            alt={currentCharacter.name}
            style={{ width: '30%', minWidth: '150px' }}
            className={`pixelated drop-shadow-[0_10px_14px_rgba(90,60,40,0.3)] ${isDragging ? '' : 'animate-breathe'}`}
            draggable={false}
          />
        </button>

        {/* 对话气泡（点击猫时）—— 跟随猫 */}
        {speech && (
          <div
            className="pointer-events-none absolute z-20 -translate-y-full"
            style={{ left: `${catPos.x}%`, top: `${catPos.y - 18}%` }}
          >
            <SpeechBubble text={speech} />
          </div>
        )}

        {/* 想法气泡（猫自己冒出）—— 跟随猫 */}
        {showThought && (
          <div
            className="absolute z-20 -translate-y-full"
            style={{ left: `${catPos.x + 12}%`, top: `${catPos.y - 22}%` }}
          >
            <ThoughtBubble text={thought!} onClick={() => setPanel('schedule')} />
          </div>
        )}

        {/* 角色信息条（PC悬停/移动端双击或双指时）—— 跟随猫 */}
        <CharacterInfoBar
          visible={infoBarVisible}
          name={currentCharacter.name}
          statValue={72}
          statName={currentCharacter.statName}
          stage="悠闲阶段"
          position={catPos}
        />
      </div>

      {/* 底部小提示 */}
      <p
        className={`ui-fade fixed bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full border-2 border-border bg-card/90 px-4 py-1.5 text-center font-cute text-xs text-muted-foreground shadow-md backdrop-blur sm:hidden ${
          uiHidden ? 'ui-hidden' : ''
        }`}
      >
        点击物品探索 · 双击/双指摸{currentCharacter.name}查看状态 · 长按拖动
      </p>
      <p
        className={`ui-fade fixed bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full border-2 border-border bg-card/90 px-4 py-1.5 text-center font-cute text-xs text-muted-foreground shadow-md backdrop-blur hidden sm:block ${
          uiHidden ? 'ui-hidden' : ''
        }`}
      >
        点击物品探索 · 悬停{currentCharacter.name}查看状态 · 长按拖动
      </p>

      {/* 功能弹窗 */}
      <MemoriesPanel open={panel === 'memories'} onClose={() => setPanel(null)} />
      <ShopPanel open={panel === 'shop'} onClose={() => setPanel(null)} />
      <SchedulePanel open={panel === 'schedule'} onClose={() => setPanel(null)} />
      <AlbumPanel open={panel === 'album'} onClose={() => setPanel(null)} />
      <CharacterSelector
        open={panel === 'character'}
        onClose={() => setPanel(null)}
        currentCharacterId={currentCharacter.id}
        ownedCharacterIds={ownedCharacterIds}
        onSelectCharacter={(char) => {
          setCurrentCharacter(char)
          if (!ownedCharacterIds.includes(char.id)) {
            setOwnedCharacterIds((ids) => [...ids, char.id])
          }
          setPanel(null)
        }}
      />
    </div>
  )
}
