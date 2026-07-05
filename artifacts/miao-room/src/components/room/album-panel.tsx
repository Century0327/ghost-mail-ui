

import { useState } from 'react'
import { Image, X, Heart, ZoomIn, ChevronLeft } from 'lucide-react'
import { Panel } from './panel'

// 相册图片数据类型
export type AlbumImage = {
  id: string
  src: string
  title: string
  date: string
  fromLetter?: string // 来源信件ID
}

// 演示用的相册图片数据
const DEMO_IMAGES: AlbumImage[] = [
  {
    id: 'a1',
    src: '/room/item-fish.png',
    title: '小鱼干的记忆',
    date: '春天 · 第 5 天',
    fromLetter: 'l1',
  },
  {
    id: 'a2',
    src: '/room/item-yarn.png',
    title: '毛线球的午后',
    date: '夏天 · 第 40 天',
    fromLetter: 'l2',
  },
  {
    id: 'a3',
    src: '/room/item-plant.png',
    title: '窗台的小盆栽',
    date: '秋天 · 第 100 天',
    fromLetter: 'l3',
  },
  {
    id: 'a4',
    src: '/room/item-cushion.png',
    title: '温暖的软垫',
    date: '冬天 · 第 200 天',
    fromLetter: 'l4',
  },
]

export function AlbumPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [selectedImage, setSelectedImage] = useState<AlbumImage | null>(null)
  const [zoomed, setZoomed] = useState(false)
  const images = DEMO_IMAGES // 实际使用时从数据库获取

  const handleClose = () => {
    setSelectedImage(null)
    setZoomed(false)
    onClose()
  }

  // 空相册状态
  if (images.length === 0) {
    return (
      <Panel open={open} onClose={handleClose} title="我的相册" icon={<Image className="size-5" />}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="mb-4 flex size-20 items-center justify-center rounded-full bg-secondary/50">
            <Image className="size-10 text-muted-foreground" />
          </span>
          <p className="font-cute text-base text-muted-foreground">空空如也~</p>
          <p className="mt-2 text-sm text-muted-foreground/70">在记忆信件里收藏图片，会在这里显示哦</p>
        </div>
      </Panel>
    )
  }

  return (
    <Panel open={open} onClose={handleClose} title="我的相册" icon={<Image className="size-5" />}>
      {selectedImage ? (
        // 图片详情/放大视图
        <div className="animate-bubble-in">
          <button
            onClick={() => {
              if (zoomed) {
                setZoomed(false)
              } else {
                setSelectedImage(null)
              }
            }}
            className="mb-3 inline-flex items-center gap-1 rounded-full bg-secondary/70 px-3 py-1.5 font-cute text-sm text-secondary-foreground transition-colors hover:bg-secondary"
          >
            <ChevronLeft className="size-4" /> {zoomed ? '返回列表' : '返回'}
          </button>

          <div
            className={`relative overflow-hidden rounded-3xl border-2 border-border bg-background/60 ${
              zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={() => setZoomed(!zoomed)}
          >
            <div className={`${zoomed ? 'scale-150' : ''} transition-transform duration-300`}>
              <img
                src={selectedImage.src}
                alt={selectedImage.title}
                className="w-full object-contain"
                style={{ maxHeight: zoomed ? '60vh' : '40vh' }}
              />
            </div>

            {/* 放大提示 */}
            {!zoomed && (
              <div className="absolute bottom-3 right-3 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 text-xs text-white/80 backdrop-blur-sm">
                <ZoomIn className="size-3" /> 点击放大
              </div>
            )}
          </div>

          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-cute text-lg text-foreground">{selectedImage.title}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{selectedImage.date}</p>
              {selectedImage.fromLetter && (
                <p className="mt-2 text-xs text-primary/80">来自: 记忆信件</p>
              )}
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                // TODO: 取消收藏
              }}
              className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-primary transition-colors hover:bg-primary/20"
            >
              <Heart className="size-4 fill-primary" />
              <span className="font-cute text-xs">已收藏</span>
            </button>
          </div>
        </div>
      ) : (
        // 图片列表
        <div className="flex flex-col gap-3">
          <p className="font-cute text-sm text-muted-foreground">收藏的美好瞬间~</p>
          <div className="grid grid-cols-2 gap-3">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className="group overflow-hidden rounded-2xl border-2 border-border bg-background/60 text-left transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
              >
                <div className="aspect-square overflow-hidden">
                  <img
                    src={img.src}
                    alt={img.title}
                    className="pixelated h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                  />
                </div>
                <div className="p-2">
                  <p className="truncate font-cute text-sm text-foreground">{img.title}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">{img.date}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </Panel>
  )
}
