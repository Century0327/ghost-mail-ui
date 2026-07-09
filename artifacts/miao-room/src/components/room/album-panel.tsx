import { useState, useEffect } from 'react'
import { Image, X, Heart, ZoomIn, ChevronLeft, Trash2 } from 'lucide-react'
import { Panel } from './panel'
import { companionApi } from '@/lib/companion-api'
import { companionLocal } from '@/lib/companion-local'

export type AlbumImage = {
  id: string
  src: string
  title: string
  date: string
  fromLetter?: string
}

export function AlbumPanel({ open, onClose, characterId = 'maodie' }: { open: boolean; onClose: () => void; characterId?: string }) {
  const [selectedImage, setSelectedImage] = useState<AlbumImage | null>(null)
  const [zoomed, setZoomed] = useState(false)
  const [images, setImages] = useState<AlbumImage[]>([])
  const [loading, setLoading] = useState(false)
  const [imageErrors, setImageErrors] = useState<Set<string>>(new Set())

  const handleImageError = (src: string) => {
    setImageErrors(prev => new Set(prev).add(src))
  }

  useEffect(() => {
    if (!open) return
    loadImages()
  }, [open, characterId])

  const loadImages = async () => {
    setLoading(true)
    try {
      const result = await companionApi.getAttachments(characterId)
      const mapped = (result.attachments || []).map((a: any) => ({
        id: a.id || a.src,
        src: a.src || a.attachment_url || '',
        title: a.title || '美好瞬间',
        date: a.createdAt
          ? new Date(a.createdAt).toLocaleDateString('zh-CN')
          : (a.created_at ? new Date(a.created_at).toLocaleDateString('zh-CN') : '未知日期'),
        fromLetter: a.letterId || a.letter_id,
      }))
      setImages(mapped)
    } catch (err) {
      console.error('Failed to load attachments:', err)
      const localAttachments = companionLocal.getAttachments(characterId)
      setImages(localAttachments.map(a => ({
        id: a.id,
        src: a.src,
        title: a.title || '美好瞬间',
        date: a.createdAt ? new Date(a.createdAt).toLocaleDateString('zh-CN') : '未知日期',
        fromLetter: a.letterId,
      })))
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setSelectedImage(null)
    setZoomed(false)
    onClose()
  }

  const handleDelete = async (img: AlbumImage, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm('确定要删除这张图片吗？')) return
    // 本地删除（后端暂无删除接口，先保证 UI 可用）
    companionLocal.deleteAttachment?.(img.id)
    setImages(prev => prev.filter(i => i.id !== img.id))
    if (selectedImage?.id === img.id) {
      setSelectedImage(null)
      setZoomed(false)
    }
  }

  if (loading) {
    return (
      <Panel open={open} onClose={handleClose} title="我的相册" icon={<Image className="size-5" />}>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="mb-4 flex size-20 items-center justify-center rounded-full bg-secondary/50">
            <Image className="size-10 text-muted-foreground animate-pulse" />
          </span>
          <p className="font-cute text-base text-muted-foreground">正在加载相册...</p>
        </div>
      </Panel>
    )
  }

  return (
    <Panel open={open} onClose={handleClose} title="我的相册" icon={<Image className="size-5" />}>
      {selectedImage ? (
        <div className="animate-bubble-in">
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => {
                if (zoomed) {
                  setZoomed(false)
                } else {
                  setSelectedImage(null)
                }
              }}
              className="inline-flex items-center gap-1 rounded-full bg-secondary/70 px-3 py-1.5 font-cute text-sm text-secondary-foreground transition-colors hover:bg-secondary"
            >
              <ChevronLeft className="size-4" /> {zoomed ? '返回列表' : '返回'}
            </button>
            <span className="font-cute text-sm text-muted-foreground">
              {images.findIndex(i => i.id === selectedImage.id) + 1} / {images.length}
            </span>
          </div>

          <div
            className={`relative overflow-hidden rounded-3xl border-2 border-border bg-background/60 ${
              zoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'
            }`}
            onClick={() => setZoomed(!zoomed)}
          >
            <div className={`${zoomed ? 'scale-150' : ''} transition-transform duration-300`}>
              {imageErrors.has(selectedImage.src) ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Image className="size-16 mb-2 opacity-50" />
                  <span className="text-sm">图片加载失败</span>
                </div>
              ) : (
                <img
                  src={selectedImage.src}
                  alt={selectedImage.title}
                  className="w-full object-contain"
                  style={{ maxHeight: zoomed ? '60vh' : '40vh' }}
                  onError={() => handleImageError(selectedImage.src)}
                />
              )}
            </div>

            {!zoomed && !imageErrors.has(selectedImage.src) && (
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
            <div className="flex items-center gap-2">
              <button
                onClick={(e) => handleDelete(selectedImage, e)}
                className="flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1.5 text-destructive transition-colors hover:bg-destructive/20"
              >
                <Trash2 className="size-4" />
                <span className="font-cute text-xs">删除</span>
              </button>
              <span className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-primary">
                <Heart className="size-4 fill-primary" />
                <span className="font-cute text-xs">已收藏</span>
              </span>
            </div>
          </div>
        </div>
      ) : images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <span className="mb-4 flex size-20 items-center justify-center rounded-full bg-secondary/50">
            <Image className="size-10 text-muted-foreground" />
          </span>
          <p className="font-cute text-base text-muted-foreground">空空如也~</p>
          <p className="mt-2 text-sm text-muted-foreground/70">在记忆信件里放大图片，点击“存入相册”，会在这里显示哦</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="font-cute text-sm text-muted-foreground">收藏的美好瞬间~</p>
            <span className="rounded-full bg-secondary/50 px-2.5 py-1 text-xs text-muted-foreground">{images.length} 张</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {images.map((img) => (
              <button
                key={img.id}
                onClick={() => setSelectedImage(img)}
                className="group relative overflow-hidden rounded-2xl border-2 border-border bg-background/60 text-left transition-all hover:-translate-y-1 hover:border-primary/50 hover:shadow-lg"
              >
                <div className="aspect-square overflow-hidden bg-secondary/20">
                  {imageErrors.has(img.src) ? (
                    <div className="flex h-full items-center justify-center text-muted-foreground">
                      <Image className="size-8 opacity-50" />
                    </div>
                  ) : (
                    <img
                      src={img.src}
                      alt={img.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      onError={() => handleImageError(img.src)}
                    />
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 pt-6 opacity-0 transition-opacity group-hover:opacity-100">
                  <p className="truncate font-cute text-xs text-white">{img.title}</p>
                  <p className="mt-0.5 text-[10px] text-white/80">{img.date}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </Panel>
  )
}
