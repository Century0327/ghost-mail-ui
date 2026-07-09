import { useState, useEffect, useRef, useCallback } from 'react'
import { Mail, ChevronLeft, Heart, Star, Calendar, Image, ZoomIn, Check } from 'lucide-react'
import { Panel } from './panel'
import { companionApi, resolveAssetUrl } from '@/lib/companion-api'
import { companionLocal } from '@/lib/companion-local'
import { cleanLetterBody, extractImagesFromHtml, formatLetterPreview } from '@/lib/letter-utils'

type LetterCategory = 'all' | 'favorite' | 'event'

interface DisplayLetter {
  id: string
  title: string
  date: string
  preview: string
  body: string
  images: string[]
  category: LetterCategory
}

interface MemoriesPanelProps {
  open: boolean
  onClose: () => void
  characterId?: string
  onImageSaved?: () => void
}

const TABS: { key: LetterCategory; label: string; icon: typeof Mail }[] = [
  { key: 'all', label: '全部', icon: Mail },
  { key: 'favorite', label: '收藏', icon: Heart },
  { key: 'event', label: '活动', icon: Calendar },
]

const PAGE_SIZE = 5

export function MemoriesPanel({ open, onClose, characterId = 'maodie', onImageSaved }: MemoriesPanelProps) {
  const [active, setActive] = useState<DisplayLetter | null>(null)
  const [currentTab, setCurrentTab] = useState<LetterCategory>('all')
  const [zoomed, setZoomed] = useState(false)
  const [activeImageIndex, setActiveImageIndex] = useState(0)
  const [allLetters, setAllLetters] = useState<DisplayLetter[]>([])
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [favAnimating, setFavAnimating] = useState(false)
  const [albumAnimating, setAlbumAnimating] = useState(false)
  const [savingToAlbum, setSavingToAlbum] = useState(false)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())
  const listRef = useRef<HTMLDivElement>(null)

  const handleImageError = (src: string) => {
    setImageErrors(prev => new Set(prev).add(src))
  }

  useEffect(() => {
    if (!open) {
      setDisplayCount(PAGE_SIZE)
      return
    }
    loadLetters()
  }, [open, characterId])

  useEffect(() => {
    setDisplayCount(PAGE_SIZE)
  }, [currentTab])

  const loadLetters = async () => {
    setLoading(true)
    try {
      const localLetters = companionLocal.getLetters(characterId)
      const favMap = new Map<string, boolean>()
      localLetters.forEach((l) => favMap.set(l.id, !!l.isFavorite))
      
      const result = await companionApi.getLetters(characterId)
      
      const mapped = result.letters.map((l: any) => {
        let category: LetterCategory = 'all'
        if (l.source === 'event' || (l as any).category === 'event') {
          category = 'event'
        } else if (favMap.get(l.id)) {
          category = 'favorite'
        }
        
        const rawBody = l.body || ''
        const images: string[] = []
        if (l.attachmentUrl) {
          const resolved = resolveAssetUrl(l.attachmentUrl)
          if (resolved) images.push(resolved)
        }
        if (l.attachment_url) {
          const resolved = resolveAssetUrl(l.attachment_url)
          if (resolved && !images.includes(resolved)) images.push(resolved)
        }
        const extracted = extractImagesFromHtml(rawBody)
        extracted.forEach(img => {
          const resolved = resolveAssetUrl(img)
          if (resolved && !images.includes(resolved)) images.push(resolved)
        })
        
        return {
          id: l.id,
          title: l.subject || '无标题',
          date: l.createdAt ? new Date(l.createdAt).toLocaleDateString('zh-CN') : (l.created_at ? new Date(l.created_at).toLocaleDateString('zh-CN') : '未知日期'),
          preview: formatLetterPreview(rawBody, 30),
          body: cleanLetterBody(rawBody),
          images,
          category,
        }
      })
      setAllLetters(mapped)
    } catch (err) {
      console.error('Failed to load letters:', err)
      const localLetters = companionLocal.getLetters(characterId)
      setAllLetters(localLetters.map((l: any) => {
        const imgs: string[] = []
        if (l.attachmentUrl) {
          const resolved = resolveAssetUrl(l.attachmentUrl)
          if (resolved) imgs.push(resolved)
        }
        return {
          id: l.id,
          title: l.subject || '无标题',
          date: l.createdAt ? new Date(l.createdAt).toLocaleDateString('zh-CN') : '未知日期',
          preview: formatLetterPreview(l.body || '', 30),
          body: cleanLetterBody(l.body || ''),
          images: imgs,
          category: (l.isFavorite ? 'favorite' : 'all') as LetterCategory,
        }
      }))
    } finally {
      setLoading(false)
    }
  }

  const loadMore = useCallback(() => {
    if (loadingMore) return
    const filtered = allLetters.filter((l) =>
      currentTab === 'all' ? true : l.category === currentTab
    )
    if (displayCount >= filtered.length) return
    
    setLoadingMore(true)
    setTimeout(() => {
      setDisplayCount((prev) => Math.min(prev + PAGE_SIZE, filtered.length))
      setLoadingMore(false)
    }, 300)
  }, [loadingMore, allLetters, currentTab, displayCount])

  useEffect(() => {
    const list = listRef.current
    if (!list) return

    const handleScroll = () => {
      if (loadingMore) return
      const { scrollTop, scrollHeight, clientHeight } = list
      if (scrollTop + clientHeight >= scrollHeight - 50) {
        loadMore()
      }
    }

    list.addEventListener('scroll', handleScroll)
    return () => list.removeEventListener('scroll', handleScroll)
  }, [loadingMore, loadMore])

  const toggleFavorite = async (letterId: string) => {
    setFavAnimating(true)
    companionLocal.toggleFavorite(letterId)
    setAllLetters((prev) =>
      prev.map((l) =>
        l.id === letterId
          ? { ...l, category: l.category === 'favorite' ? 'all' : 'favorite' }
          : l
      )
    )
    if (active && active.id === letterId) {
      setActive((prev) => prev ? { ...prev, category: prev.category === 'favorite' ? 'all' : 'favorite' } : null)
    }
    setTimeout(() => setFavAnimating(false), 600)
  }

  const isImageInAlbum = (imgSrc: string): boolean => {
    const existing = companionLocal.getAttachments(characterId)
    return existing.some(a => a.src === imgSrc)
  }

  const saveImageToAlbum = async (imgSrc: string) => {
    if (savingToAlbum || isImageInAlbum(imgSrc)) return
    setSavingToAlbum(true)
    setAlbumAnimating(true)
    try {
      await companionApi.createAttachment({
        character_id: characterId,
        src: imgSrc,
        title: active?.title || '美好瞬间',
        letter_id: active?.id,
      })
    } catch (err) {
      console.error('存入相册失败:', err)
      // 后端失败时，至少保存到本地，避免用户完全无法使用
      companionLocal.addAttachment({
        characterId,
        letterId: active?.id,
        src: imgSrc,
        title: active?.title || '美好瞬间',
        createdAt: new Date().toISOString(),
      })
    } finally {
      setSavingToAlbum(false)
      setTimeout(() => setAlbumAnimating(false), 600)
      // 通知父组件相册有新内容，需要刷新
      onImageSaved?.()
    }
  }

  const handleClose = () => {
    setActive(null)
    setZoomed(false)
    setActiveImageIndex(0)
    onClose()
  }

  const filteredLetters = allLetters.filter((l) =>
    currentTab === 'all' ? true : l.category === currentTab
  )

  const displayedLetters = filteredLetters.slice(0, displayCount)
  const hasMore = displayCount < filteredLetters.length

  const renderBody = (body: string) => {
    const lines = body.split('\n')
    return lines.map((line, i) => {
      if (!line.trim()) return <div key={i} className="h-4" />
      
      let content = line
      const isBold = content.startsWith('**') && content.endsWith('**')
      if (isBold) {
        content = content.slice(2, -2)
      }
      
      const isItalic = content.startsWith('*') && content.endsWith('*') && !isBold
      if (isItalic) {
        content = content.slice(1, -1)
      }
      
      return (
        <p key={i} className={`text-sm leading-8 sm:text-base ${isBold ? 'font-bold text-foreground' : 'text-foreground/85'} ${isItalic ? 'italic' : ''}`}>
          {content}
        </p>
      )
    })
  }

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
                setActiveImageIndex(0)
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

            {active.images.length > 0 && (
              <div className="my-4">
                {zoomed ? (
                  <div className="rounded-xl border border-border/50 bg-secondary/20 p-1">
                    <div
                      className="relative overflow-hidden rounded-lg cursor-zoom-out"
                      onClick={() => setZoomed(false)}
                    >
                      {imageErrors.has(active.images[activeImageIndex]) ? (
                        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                          <Image className="size-16 mb-2 opacity-50" />
                          <span className="text-sm">图片加载失败</span>
                        </div>
                      ) : (
                        <img
                          src={active.images[activeImageIndex]}
                          alt=""
                          className="w-full object-contain"
                          style={{ maxHeight: '50vh' }}
                          onError={() => handleImageError(active.images[activeImageIndex])}
                        />
                      )}
                      <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white/80 backdrop-blur-sm">
                        <ZoomIn className="size-3" /> 点击缩小
                      </div>
                      {active.images.length > 1 && (
                        <div className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/50 px-2 py-1 text-xs text-white/80 backdrop-blur-sm">
                          {activeImageIndex + 1} / {active.images.length}
                        </div>
                      )}
                    </div>

                    {/* 大图模式下显示存入相册按钮 */}
                    <div className="mt-3 flex items-center justify-center">
                      {(() => {
                        const currentImg = active.images[activeImageIndex]
                        const inAlbum = isImageInAlbum(currentImg)
                        return (
                          <button
                            onClick={() => saveImageToAlbum(currentImg)}
                            disabled={inAlbum || savingToAlbum}
                            className={`flex h-11 items-center gap-2 rounded-full px-5 font-cute text-base transition-all active:scale-95 ${
                              inAlbum
                                ? 'bg-primary/15 text-primary cursor-default'
                                : 'bg-primary text-primary-foreground shadow-md hover:brightness-110'
                            } ${albumAnimating ? 'scale-105' : ''}`}
                          >
                            <span className="relative flex size-5 items-center justify-center">
                              <Image
                                className={`size-5 transition-all ${albumAnimating && !inAlbum ? 'scale-125' : ''}`}
                                fill={inAlbum ? 'currentColor' : 'none'}
                              />
                              {albumAnimating && !inAlbum && (
                                <Image className="size-5 absolute animate-ping opacity-50" />
                              )}
                            </span>
                            <span>{inAlbum ? '已存入相册' : savingToAlbum ? '保存中...' : '存入相册'}</span>
                          </button>
                        )
                      })()}
                    </div>
                  </div>
                ) : (
                  <div className={`grid gap-2 ${active.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
                    {active.images.map((img, idx) => (
                      <div
                        key={idx}
                        className="group relative overflow-hidden rounded-xl border border-border/50 cursor-zoom-in bg-secondary/20 aspect-video"
                        onClick={() => { setActiveImageIndex(idx); setZoomed(true) }}
                      >
                        {imageErrors.has(img) ? (
                          <div className="flex h-full items-center justify-center text-muted-foreground">
                            <Image className="size-6 opacity-50" />
                          </div>
                        ) : (
                          <img
                            src={img}
                            alt=""
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                            onError={() => handleImageError(img)}
                          />
                        )}
                        <div className="absolute bottom-1 right-1 flex items-center gap-1 rounded-full bg-black/50 px-2 py-0.5 text-[10px] text-white/80 backdrop-blur-sm opacity-80 group-hover:opacity-100">
                          <ZoomIn className="size-3" /> 放大
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 space-y-1">
              {renderBody(active.body)}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3 border-t border-dashed border-border pt-4">
              <button
                onClick={() => toggleFavorite(active.id)}
                className={`flex h-11 items-center gap-2 rounded-full px-5 font-cute text-base transition-all active:scale-95 ${
                  active.category === 'favorite'
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'bg-secondary/50 text-secondary-foreground hover:bg-secondary'
                } ${favAnimating ? 'scale-105' : ''}`}
              >
                <span className="relative flex size-5 items-center justify-center">
                  {active.category === 'favorite' ? (
                    <Check className="size-5" />
                  ) : (
                    <>
                      <Heart className={`size-5 transition-all ${favAnimating ? 'scale-125' : ''}`} />
                      {favAnimating && (
                        <Heart className="size-5 absolute animate-ping opacity-50" />
                      )}
                    </>
                  )}
                </span>
                <span>{active.category === 'favorite' ? '已珍藏' : '珍藏这封信'}</span>
              </button>
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
                  onClick={() => { setActive(null); setCurrentTab(tab.key); }}
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
            <div
              ref={listRef}
              className="flex flex-col gap-2 max-h-[40vh] overflow-y-auto pr-2 scrollbar-thin"
            >
              {displayedLetters.map((letter) => (
                <button
                  key={letter.id}
                  onClick={() => setActive(letter)}
                  className="group flex items-start gap-3 rounded-2xl border border-border/50 bg-muted/60 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:bg-muted hover:shadow-md sm:p-4"
                >
                  {letter.images.length > 0 ? (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/30 bg-secondary/30 sm:h-14 sm:w-14">
                      {imageErrors.has(letter.images[0]) ? (
                        <div className="flex h-full items-center justify-center">
                          <Image className="size-4 text-muted-foreground opacity-50" />
                        </div>
                      ) : (
                        <img
                          src={letter.images[0]}
                          alt=""
                          className="pixelated size-full object-cover"
                          onError={() => handleImageError(letter.images[0])}
                        />
                      )}
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
              {hasMore && (
                <div className="flex items-center justify-center py-3">
                  {loadingMore ? (
                    <Mail className="size-4 text-muted-foreground animate-pulse" />
                  ) : (
                    <span className="font-cute text-xs text-muted-foreground">加载更多...</span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Panel>
  )
}
