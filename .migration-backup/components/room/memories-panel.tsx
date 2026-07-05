'use client'

import { useState } from 'react'
import { Mail, ChevronLeft, Heart, Star, Calendar, Image, ZoomIn } from 'lucide-react'
import { Panel } from './panel'
import { LETTERS, type Letter, type LetterCategory } from '@/lib/companion-data'

// 信件标签页配置
const TABS: { key: LetterCategory; label: string; icon: typeof Mail }[] = [
  { key: 'all', label: '全部', icon: Mail },
  { key: 'favorite', label: '收藏', icon: Heart },
  { key: 'event', label: '活动', icon: Calendar },
]

export function MemoriesPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [active, setActive] = useState<Letter | null>(null)
  const [currentTab, setCurrentTab] = useState<LetterCategory>('all')
  const [zoomed, setZoomed] = useState(false)

  const handleClose = () => {
    setActive(null)
    setZoomed(false)
    onClose()
  }

  // 根据标签筛选信件
  const filteredLetters = LETTERS.filter((l) =>
    currentTab === 'all' ? true : l.category === currentTab
  )

  return (
    <Panel open={open} onClose={handleClose} title="记忆信箱" icon={<Mail className="size-5" />}>
      {active ? (
        // 信件详情视图 - 信纸样式
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

          {/* 信纸样式容器 */}
          <div className="relative overflow-hidden rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 p-5 shadow-lg sm:p-6"
            style={{
              backgroundImage: `repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(0,0,0,0.03) 27px, rgba(0,0,0,0.03) 28px)`,
            }}
          >
            {/* 装饰边角 */}
            <div className="absolute left-0 top-0 size-8 border-l-2 border-t-2 border-primary/30" />
            <div className="absolute right-0 top-0 size-8 border-r-2 border-t-2 border-primary/30" />
            <div className="absolute bottom-0 left-0 size-8 border-b-2 border-l-2 border-primary/30" />
            <div className="absolute bottom-0 right-0 size-8 border-b-2 border-r-2 border-primary/30" />

            {/* 信件头部 */}
            <p className="font-cute text-right text-xs text-muted-foreground">{active.date}</p>
            <h3 className="font-cute mt-2 text-center text-xl text-foreground">{active.title}</h3>

            {/* 信件图片（如果有） */}
            {active.image && (
              <div
                className={`my-4 overflow-hidden rounded-xl border border-border/50 ${
                  zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
                }`}
                onClick={() => setZoomed(!zoomed)}
              >
                <img
                  src={active.image}
                  alt={active.title}
                  className={`w-full object-contain transition-transform duration-300 ${
                    zoomed ? 'scale-150' : ''
                  }`}
                  style={{ maxHeight: zoomed ? '50vh' : '30vh' }}
                />
                {!zoomed && (
                  <div className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white/80 backdrop-blur-sm">
                    <ZoomIn className="size-3" /> 点击放大
                  </div>
                )}
              </div>
            )}

            {/* 信件正文 */}
            <p className="mt-4 text-sm leading-8 text-foreground/85 sm:text-base">
              {active.body}
            </p>

            {/* 收藏按钮 */}
            <div className="mt-6 flex items-center justify-center gap-2 border-t border-dashed border-border pt-4">
              <button
                onClick={() => {
                  // TODO: 切换收藏状态
                }}
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
        // 信件列表视图
        <div className="flex flex-col gap-3">
          <p className="font-cute text-sm text-muted-foreground">我把和你相处的点滴都写进了信里～</p>

          {/* 标签切换 */}
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
                  <Icon
                    className={`size-4 ${
                      tab.key === 'favorite' && currentTab === tab.key ? 'fill-current' : ''
                    }`}
                  />
                  {tab.label}
                </button>
              )
            })}
          </div>

          {/* 筛选后的信件列表 */}
          {filteredLetters.length === 0 ? (
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
                  className="group flex items-start gap-3 rounded-2xl border border-border/50 bg-gradient-to-r from-amber-50/50 to-orange-50/50 p-3 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md sm:p-4"
                >
                  {/* 信件图标或预览图 */}
                  {letter.image ? (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-border/30 sm:h-14 sm:w-14">
                      <img
                        src={letter.image}
                        alt=""
                        className="pixelated size-full object-cover"
                      />
                    </div>
                  ) : (
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-secondary/50 sm:size-14">
                      <Mail className="size-5 text-muted-foreground sm:size-6" />
                    </span>
                  )}

                  {/* 信件内容 */}
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
