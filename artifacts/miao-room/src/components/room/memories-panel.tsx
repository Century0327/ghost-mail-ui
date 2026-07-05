import { useState, useEffect } from 'react'
import { Mail, ChevronLeft, Heart, Star, Calendar, Image, ZoomIn } from 'lucide-react'
import { Panel } from './panel'
import { companionApi } from '@/lib/companion-api'
import { companionLocal } from '@/lib/companion-local'

type LetterCategory = 'all' | 'favorite' | 'event'

interface DisplayLetter {
  id: string
  title: string
  date: string
  preview: string
  body: string
  image?: string
  category: LetterCategory
}

const TABS: { key: LetterCategory; label: string; icon: typeof Mail }[] = [
  { key: 'all', label: '全部', icon: Mail },
  { key: 'favorite', label: '收藏', icon: Heart },
  { key: 'event', label: '活动', icon: Calendar },
]

export function MemoriesPanel({ open, onClose, characterId = 'maodie' }: { open: boolean; onClose: () => void; characterId?: string }) {
  const [active, setActive] = useState<DisplayLetter | null>(null)
  const [currentTab, setCurrentTab] = useState<LetterCategory>('all')
  const [zoomed, setZoomed] = useState(false)
  const [letters, setLetters] = useState<DisplayLetter[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!open) return
    loadLetters()
  }, [open, characterId])

  const loadLetters = async () => {
    setLoading(true)
    try {
      // 从后端 API 获取信件
      const result = await companionApi.getLetters(characterId)
      // 从 localStorage 获取收藏状态
      const localLetters = companionLocal.getLetters(characterId)
      const localFavIds = new Set(localLetters.filter((l) => l.isFavorite).map((l) => l.id))
      
      const mapped = result.letters.map((l) => {
        // 优先使用后端返回的 category，如果没有则根据 isFavorite 判断
        let category: LetterCategory = 'all'
        if (l.category === 'event') {
          category = 'event'
        } else if (l.isFavorite || localFavIds.has(l.id)) {
          category = 'favorite'
        }
        
        return {
          id: l.id,
          title: l.subject || '无标题',
          date: l.createdAt ? new Date(l.createdAt).toLocaleDateString('zh-CN') : '未知日期',
          preview: l.body?.slice(0, 30) + (l.body?.length > 30 ? '...' : '') || '',
          body: l.body || '',
          image: l.attachmentUrl,
          category,
        }
      })
      setLetters(mapped)
    } catch (err) {
      console.error('Failed to load letters:', err)
      // 后端失败时回退到 localStorage
      const localLetters = companionLocal.getLetters(characterId)
      setLetters(localLetters.map((l) => ({
        id: l.id,
        title: l.subject || '无标题',
        date: l.createdAt ? new Date(l.createdAt).toLocaleDateString('zh-CN') : '未知日期',
        preview: l.body?.slice(0, 30) + (l.body?.length > 30 ? '...' : '') || '',
        body: l.body || '',
        image: l.attachmentUrl,
        category: (l.isFavorite ? 'favorite' : 'all') as LetterCategory,
      })))
    } finally {
      setLoading(false)
    }
  }

  const toggleFavorite = async (letterId: string) => {
    companionLocal.toggleFavorite(letterId)
    // 立即更新本地状态，不等待后端刷新
    setLetters((prev) =>
      prev.map((l) =>
        l.id === letterId
          ? { ...l, category: l.category === 'favorite' ? 'all' : 'favorite' }
          : l
      )
    )
  }

  const handleClose = () => {
    setActive(null)
    setZoomed(false)
    onClose()
  }

  const filteredLetters = letters.filter((l) =>
    currentTab === 'all' ? true : l.category === currentTab
  )

  return (
    <Panel open={open} onClose={handleClose} title="记忆信箱" icon={<Mail className="size-5" />}>
      {active ? (
        <div className="animate-bubble-in">
          <button
            onClick={() => {
              if (zoomed) {
                setZoomed(false)
              } else {
                setActive(null)
              }
            }}
            className="mb-3 inline-flex items-center gap-1 rounded-full bg-secondary/70 px-3 py-1.5 font-cute text-sm text-secondary-foreground transition-colors hover:bg-secondary"
          >
            <ChevronLeft className="size-4" /> {zoomed ? '返回信件' : '返回'}
          </button>

          <div className="relative overflow-hidden rounded-2xl border-2 border-border bg-muted p-5 shadow-lg sm:p-6"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 27px, color-mix(in oklch, var(--border) 40%, transparent) 27px, color-mix(in oklch, var(--border) 40%, transparent) 28px)`,
            }}
          >
            <div className="absolute left-0 top-0 size-8 border-l-2 border-t-2 border-primary/30" />
            <div className="absolute right-0 top-0 size-8 border-r-2 border-t-2 border-primary/30" />
            <div className="absolute bottom-0 left-0 size-8 border-b-2 border-l-2 border-primary/30" />
            <div className="absolute bottom-0 right-0 size-8 border-b-2 border-r-2 border-primary/30" />

            <p className="font-cute text-right text-xs text-muted-foreground">{active.date}</p>
            <h3 className="font-cute mt-2 text-center text-xl text-foreground">{active.title}</h3>

            {active.image && (
              <div
                className={`my-4 overflow-hidden rounded-xl border border-border/50 ${zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
                onClick={() => setZoomed(!zoomed)}
              >
                <img
                  src={active.image}
                  alt={active.title}
                  className={`w-full object-contain transition-transform duration-300 ${zoomed ? 'scale-150' : ''}`}
                  style={{ maxHeight: zoomed ? '50vh' : '30vh' }}
                />
                {!zoomed && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white/80 backdrop-blur-sm">
                    <ZoomIn className="size-3" /> 点击放大
                  </div>
                )}
              </div>
            )}

            <p className="mt-4 text-sm leading-8 text-foreground/85 sm:text-base">
              {active.body}
            </p>

            <div className="mt-6 flex items-center justify-center gap-2 border-t border-dashed border-border pt-4">
              <button
                onClick={() => toggleFavorite(active.id)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 font-cute text-sm transition-colors ${
                  active.category === 'favorite'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
                }`}
              >
                <Heart className={`size-4 ${active.category === 'favorite' ? 'fill-current' : ''}`} />
                {active.category === 'favorite' ? '已珍藏' : '珍藏'}
              </button>
              {active.image && (
                <button
                  onClick={() => {
                    // TODO: 添加到相册
                  }}
                  className="flex items-center gap-1.5 rounded-full bg-secondary/50 px-4 py-2 font-cute text-sm text-secondary-foreground transition-colors hover:bg-secondary"
                >
                  <Image className="size-4" />
                  存入相册
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="font-cute text-sm text-muted-foreground">我把和你相处的点滴都写进了信里～</p>

          <div className="flex gap-1 rounded-full bg-secondary/30 p-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.key}
                  onClick={() => setCurrentTab(tab.key)}
                  className={`flex flex-1 items-center justify-center gap-1 rounded-full py-2 font-cute text-sm transition-colors ${
                    currentTab === tab.key
                      ? 'bg-card text-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Icon className={`size-4 ${tab.key === 'favorite' && currentTab === tab.key ? 'fill-current' : ''}`} />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="mb-3 flex size-16 items-center justify-center rounded-full bg-secondary/50">
                <Mail className="size-8 text-muted-foreground animate-pulse" />
              </span>
              <p className="font-cute text-muted-foreground">正在加载信件...</p>
            </div>
          ) : filteredLetters.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <span className="mb-3 flex size-16 items-center justify-center rounded-full bg-secondary/50">
                <Mail className="size-8 text-muted-foreground" />
              </span>
              <p className="font-cute text-muted-foreground">这里还没有信件~</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filteredLetters.map((letter) => (
                <button
                  key={letter.id}
                  onClick={() => setActive(letter)}
                  className="group flex items-start gap-3 rounded-2xl border border-border/50 bg-muted/60 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted hover:shadow-md sm:p-4"
                >
                  {letter.image ? (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/30 sm:h-14 sm:w-14">
                      <img src={letter.image} alt="" className="pixelated size-full object-cover" />
                    </div>
                  ) : (
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary/50 sm:size-14">
                      <Mail className="size-5 text-muted-foreground sm:size-6" />
                    </span>
                  )}

                  <span className="min-w-0 flex-1 py-0.5">
                    <span className="flex items-center gap-1.5">
                      <span className="font-cute text-base text-foreground sm:text-lg">{letter.title}</span>
                      {letter.category === 'favorite' && (
                        <Heart className="size-3.5 fill-primary text-primary" />
                      )}
                      {letter.category === 'event' && (
                        <Star className="size-3.5 fill-accent text-accent" />
                      )}
                    </span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">{letter.date}</span>
                    <span className="mt-1 line-clamp-2 text-xs text-muted-foreground/80 sm:text-sm">
                      {letter.preview}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}
