
import { useCallback, useEffect, useRef, useState } from 'react'
import { Eye, EyeOff, Heart } from 'lucide-react'
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

// 等比例覆盖在像素画某个物件上的透明热区按钮
function RoomHotspot({
  label,
  onClick,
  style,
  uiHidden,
  size = '16%',
}: {
  label: string
  onClick: () => void
  style: React.CSSProperties
  uiHidden: boolean
  size?: string
}) {
  return (
    <button
      onClick={onClick}
      style={{ ...style, width: size, aspectRatio: '1' }}
      className="group absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-end focus:outline-none"
      aria-label={label}
    >
      <span
        className={`ui-fade mb-1 rounded-full border-2 border-border bg-card/95 px-3 py-0.5 font-cute text-sm text-card-foreground shadow-md transition-opacity ${
          uiHidden ? 'ui-hidden' : ''
        }`}
      >
        {label}
      </span>
    </button>
  )
}

// 角色信息条 — 跟随猫的位置
function CharacterInfoBar({
  visible,
  name,
  statValue,
  statName,
  position,
}: {
  visible: boolean
  name: string
  statValue: number
  statName: string
  position: { x: number; y: number }
}) {
  if (!visible) return null
  return (
    <div
      className="animate-bubble-in pointer-events-none absolute z-30 w-48"
      style={{ left: `${position.x}%`, top: `${position.y - 26}%`, transform: 'translate(-50%, 0)' }}
    >
      <div className="rounded-2xl border-2 border-border bg-card/95 px-4 py-3 shadow-lg">
        <div className="flex items-center justify-between mb-1.5">
          <span className="font-cute text-sm font-bold text-foreground">{name}</span>
          <span className="font-cute text-xs text-muted-foreground">悠闲阶段</span>
        </div>
        <div className="flex items-center gap-2">
          <Heart className="size-3.5 text-primary fill-primary" />
          <div className="flex-1 h-2.5 rounded-full bg-border overflow-hidden">
            <div className="h-full rounded-full bg-primary transition-all duration-700" style={{ width: `${statValue}%` }} />
          </div>
          <span className="font-cute text-xs text-primary font-bold">{statValue}</span>
        </div>
        <p className="mt-1 text-[10px] text-muted-foreground">{statName}</p>
      </div>
    </div>
  )
}

// 等轴投影地板区域 — 用于判断点击是否在可行走区域内
const WALKABLE = { xMin: 20, xMax: 88, yMin: 44, yMax: 88 }

// 可跳上的家具区域：定义各平台的屏幕坐标范围和上抬量(%)
const PLATFORMS = [
  { name: 'sofa', x1: 19, x2: 46, y1: 45, y2: 65, liftPct: -8 },
  { name: 'stool', x1: 64, x2: 78, y1: 56, y2: 70, liftPct: -6 },
]

function getPlatform(x: number, y: number) {
  return PLATFORMS.find((p) => x >= p.x1 && x <= p.x2 && y >= p.y1 && y <= p.y2) ?? null
}

export function CozyRoom() {
  const [uiHidden, setUiHidden] = useState(false)
  const [panel, setPanel] = useState<PanelKind>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [speech, setSpeech] = useState<string | null>(null)
  const [thought, setThought] = useState<string | null>(null)
  const [infoBarVisible, setInfoBarVisible] = useState(false)
  const [isNight, setIsNight] = useState(false)

  const [currentCharacter, setCurrentCharacter] = useState<Character>(OFFICIAL_CHARACTERS[0])
  const [ownedCharacterIds, setOwnedCharacterIds] = useState<string[]>(['char-kitty'])

  // 猫的位置(百分比) & 动画
  const [catPos, setCatPos] = useState({ x: 50, y: 62 })
  const [isMoving, setIsMoving] = useState(false)
  const [platform, setPlatform] = useState<typeof PLATFORMS[0] | null>(null)

  // 拖动状态
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
    const h = new Date().getHours()
    setIsNight(h >= 18 || h < 6)
  }, [])

  // 猫移动到新位置（点击地板）
  const moveCatTo = useCallback((x: number, y: number) => {
    const plat = getPlatform(x, y)
    setPlatform(plat)
    setIsMoving(true)
    setCatPos({ x, y })
    setTimeout(() => setIsMoving(false), 550)
  }, [])

  // 点击房间背景 → 移动猫
  const handleRoomClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!roomRef.current || isDragging) return
      const target = e.target as HTMLElement
      if (target.closest('button')) return // 点在按钮上不移动
      const rect = roomRef.current.getBoundingClientRect()
      const x = ((e.clientX - rect.left) / rect.width) * 100
      const y = ((e.clientY - rect.top) / rect.height) * 100
      if (x >= WALKABLE.xMin && x <= WALKABLE.xMax && y >= WALKABLE.yMin && y <= WALKABLE.yMax) {
        moveCatTo(x, y)
      }
    },
    [isDragging, moveCatTo],
  )

  // 点击猫 → 随机说话
  const petCat = useCallback(() => {
    if (isDragging || isMoving) return
    const line = CAT_SAYINGS[Math.floor(Math.random() * CAT_SAYINGS.length)]
    setSpeech(line)
    setThought(null)
    setInfoBarVisible(false)
    if (speechTimer.current) clearTimeout(speechTimer.current)
    speechTimer.current = setTimeout(() => setSpeech(null), 3600)
  }, [isDragging, isMoving])

  // PC悬停：显示信息条
  const handleMouseEnter = useCallback(() => {
    if (isDragging || isMoving) return
    hoverTimerRef.current = setTimeout(() => {
      setSpeech(null)
      setThought(null)
      setInfoBarVisible(true)
      if (infoBarTimer.current) clearTimeout(infoBarTimer.current)
      infoBarTimer.current = setTimeout(() => setInfoBarVisible(false), 4000)
    }, 300)
  }, [isDragging, isMoving])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimerRef.current) { clearTimeout(hoverTimerRef.current); hoverTimerRef.current = null }
  }, [])

  // 移动端双击 / 双指 → 信息条
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const now = Date.now()
    if (e.touches.length >= 2) {
      e.preventDefault()
      setInfoBarVisible(true)
      if (infoBarTimer.current) clearTimeout(infoBarTimer.current)
      infoBarTimer.current = setTimeout(() => setInfoBarVisible(false), 4000)
      touchCountRef.current = 0
      return
    }
    if (now - lastTouchTimeRef.current < 400 && touchCountRef.current === 1) {
      e.preventDefault()
      setInfoBarVisible(true)
      if (infoBarTimer.current) clearTimeout(infoBarTimer.current)
      infoBarTimer.current = setTimeout(() => setInfoBarVisible(false), 4000)
      touchCountRef.current = 0
    } else {
      touchCountRef.current = 1
      lastTouchTimeRef.current = now
    }
  }, [])

  // 自动冒出想法气泡
  useEffect(() => {
    if (uiHidden || infoBarVisible) { setThought(null); return }
    let hideTimer: ReturnType<typeof setTimeout>
    const show = () => {
      setThought((prev) => (speech || infoBarVisible) ? prev : CAT_THOUGHTS[Math.floor(Math.random() * CAT_THOUGHTS.length)])
      hideTimer = setTimeout(() => setThought(null), 5200)
    }
    const first = setTimeout(show, 1800)
    const loop = setInterval(show, 9000)
    return () => { clearTimeout(first); clearTimeout(hideTimer); clearInterval(loop) }
  }, [uiHidden, speech, infoBarVisible])

  useEffect(() => {
    return () => {
      if (speechTimer.current) clearTimeout(speechTimer.current)
      if (infoBarTimer.current) clearTimeout(infoBarTimer.current)
      if (longPressTimer.current) clearTimeout(longPressTimer.current)
    }
  }, [])

  // 长按拖动
  const handleCatPointerDown = useCallback((e: React.PointerEvent) => {
    if (!roomRef.current) return
    const clientX = e.clientX
    const clientY = e.clientY
    longPressTimer.current = setTimeout(() => {
      setIsDragging(true)
      setSpeech(null); setThought(null); setInfoBarVisible(false)
      dragStartRef.current = { x: clientX, y: clientY, catX: catPos.x, catY: catPos.y }
    }, 450)
  }, [catPos])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current || !roomRef.current) return
    const rect = roomRef.current.getBoundingClientRect()
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    const newX = Math.max(12, Math.min(88, dragStartRef.current.catX + (dx / rect.width) * 100))
    const newY = Math.max(20, Math.min(86, dragStartRef.current.catY + (dy / rect.height) * 100))
    setCatPos({ x: newX, y: newY })
    setPlatform(getPlatform(newX, newY))
  }, [isDragging])

  const handlePointerUp = useCallback(() => {
    if (longPressTimer.current) { clearTimeout(longPressTimer.current); longPressTimer.current = null }
    if (isDragging) { setIsDragging(false); dragStartRef.current = null }
  }, [isDragging])

  const showThought = !uiHidden && !!thought && !speech && !infoBarVisible && !isDragging

  // 猫的 z-index 根据 y 坐标排序（越靠下越在前面）
  const catZIndex = Math.floor(catPos.y / 8) + 15
  // 在家具上时的上抬量（模拟跳跃）
  const catLift = platform ? platform.liftPct : 0

  return (
    <div className={`relative flex min-h-[100dvh] items-center justify-center overflow-hidden p-3 ${isNight ? 'dark' : ''}`}>
      <div className={`absolute inset-0 transition-colors duration-700 ${isNight ? 'bg-[#2a2420]' : 'bg-background'}`} />

      {/* 眼睛：隐藏/显示 UI */}
      <button
        onClick={() => { setUiHidden((v) => !v); setSettingsOpen(false) }}
        className="fixed left-4 top-4 z-40 flex size-11 items-center justify-center rounded-full border-2 border-border bg-card/90 shadow-lg backdrop-blur transition-transform hover:scale-105 active:scale-95"
      >
        {uiHidden ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
      </button>

      {/* 右上角：用户头像 + 设置 */}
      <div className={`ui-fade fixed right-4 top-4 z-40 ${uiHidden ? 'ui-hidden' : ''}`}>
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          className="flex size-11 items-center justify-center overflow-hidden rounded-full border-2 border-border bg-secondary shadow-lg transition-transform hover:scale-105 active:scale-95"
        >
          <span className="font-cute text-lg">喵</span>
        </button>
        <SettingsMenu open={settingsOpen && !uiHidden} onClose={() => setSettingsOpen(false)} />
      </div>

      {/* 左下角：角色面板 */}
      <button
        onClick={() => setPanel('character')}
        className={`ui-fade fixed bottom-20 left-4 z-40 flex items-center gap-2 rounded-full border-2 border-border bg-card/90 px-3 py-2 shadow-lg backdrop-blur transition-transform hover:scale-105 active:scale-95 ${uiHidden ? 'ui-hidden' : ''}`}
      >
        <span className="font-cute text-sm">👤 角色</span>
      </button>

      {/* 房间舞台 */}
      <div
        ref={roomRef}
        className="relative aspect-square w-full max-w-[min(88dvh,40rem)] select-none cursor-default"
        onClick={handleRoomClick}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        {/* 房间背景 — 夜间用 CSS filter 暗化 */}
        <img
          src="/room/room-bg.png"
          alt="温暖的像素小房间"
          className="pixelated absolute inset-0 size-full rounded-[2rem] object-contain transition-all duration-700"
          style={isNight ? { filter: 'brightness(0.42) sepia(0.25) saturate(0.7)' } : {}}
          draggable={false}
        />
        {isNight && <div className="pointer-events-none absolute inset-0 rounded-[2rem] bg-[#1a0f05]/25 transition-all duration-700" />}

        {/* ── 透明热区按钮：覆盖在像素画对应物件上 ── */}

        {/* 台灯 — 覆盖在左侧茶几上的灯，精确贴合像素灯位置 */}
        <RoomHotspot
          label={isNight ? '关灯' : '开灯'}
          onClick={() => setIsNight((v) => !v)}
          style={{ left: '27%', top: '56%' }}
          size="14%"
          uiHidden={uiHidden}
        />

        {/* 相框 (相册) — 沙发上方左侧墙上的相框 */}
        <RoomHotspot
          label="相册"
          onClick={() => setPanel('album')}
          style={{ left: '20%', top: '27%' }}
          size="15%"
          uiHidden={uiHidden}
        />

        {/* 地板上的信 (记忆) */}
        <RoomHotspot
          label="记忆"
          onClick={() => setPanel('memories')}
          style={{ left: '43%', top: '80%' }}
          size="13%"
          uiHidden={uiHidden}
        />

        {/* 右下角购物车 (物品) */}
        <RoomHotspot
          label="物品"
          onClick={() => setPanel('shop')}
          style={{ left: '87%', top: '77%' }}
          size="14%"
          uiHidden={uiHidden}
        />

        {/* 书架上的便利贴/记事本 (日程) */}
        <RoomHotspot
          label="日程"
          onClick={() => setPanel('schedule')}
          style={{ left: '77%', top: '30%' }}
          size="13%"
          uiHidden={uiHidden}
        />

        {/* 猫咪/角色 */}
        <button
          onClick={(e) => { e.stopPropagation(); petCat() }}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onTouchStart={handleTouchStart}
          onPointerDown={handleCatPointerDown}
          aria-label={`摸摸${currentCharacter.name}`}
          className={`absolute flex flex-col items-center focus:outline-none ${isDragging ? 'cursor-grabbing' : 'cursor-pointer'}`}
          style={{
            left: `${catPos.x}%`,
            top: `${catPos.y}%`,
            transform: `translate(-50%, -50%) translateY(${catLift}%)`,
            transition: isMoving ? 'left 0.52s ease-in-out, top 0.52s ease-in-out' : isDragging ? 'none' : 'transform 0.3s ease',
            zIndex: catZIndex,
          }}
        >
          <img
            src={currentCharacter.image}
            alt={currentCharacter.name}
            style={{ width: '30%', minWidth: '130px' }}
            className={`pixelated drop-shadow-[0_10px_14px_rgba(90,60,40,0.3)] ${
              isMoving ? 'animate-bounce' : isDragging ? 'scale-105' : 'animate-breathe'
            }`}
            draggable={false}
          />
          {/* 在家具上时显示小跳跃提示 */}
          {platform && (
            <span className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 animate-bounce text-base">
              {platform.name === 'sofa' ? '🛋️' : '🪑'}
            </span>
          )}
        </button>

        {/* 对话气泡 — 紧贴猫头部上方 */}
        {speech && !infoBarVisible && (
          <div
            className="pointer-events-none absolute -translate-y-full"
            style={{ left: `${catPos.x}%`, top: `${catPos.y - 17}%`, zIndex: catZIndex + 1 }}
          >
            <SpeechBubble text={speech} />
          </div>
        )}

        {/* 想法气泡 — 紧贴猫右上侧，圆圈连接 */}
        {showThought && (
          <div
            className="absolute -translate-y-full"
            style={{ left: `${catPos.x + 4}%`, top: `${catPos.y - 14}%`, zIndex: catZIndex + 1 }}
          >
            <ThoughtBubble text={thought!} onClick={() => setPanel('schedule')} />
          </div>
        )}

        {/* 角色信息条 */}
        <CharacterInfoBar
          visible={infoBarVisible}
          name={currentCharacter.name}
          statValue={72}
          statName={currentCharacter.statName}
          position={catPos}
        />
      </div>

      {/* 底部提示 */}
      <p className={`ui-fade fixed bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full border-2 border-border bg-card/90 px-4 py-1.5 text-center font-cute text-xs text-muted-foreground shadow-md backdrop-blur sm:hidden ${uiHidden ? 'ui-hidden' : ''}`}>
        点击地板移动 · 双击/双指查状态 · 长按拖动
      </p>
      <p className={`ui-fade fixed bottom-5 left-1/2 z-30 -translate-x-1/2 rounded-full border-2 border-border bg-card/90 px-4 py-1.5 text-center font-cute text-xs text-muted-foreground shadow-md backdrop-blur hidden sm:block ${uiHidden ? 'ui-hidden' : ''}`}>
        点击地板移动{currentCharacter.name} · 悬停查看状态 · 长按拖动
      </p>

      {/* 功能面板 */}
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
          if (!ownedCharacterIds.includes(char.id)) setOwnedCharacterIds((ids) => [...ids, char.id])
          setPanel(null)
        }}
      />
    </div>
  )
}
