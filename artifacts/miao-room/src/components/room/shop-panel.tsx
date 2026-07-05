
import { useState, useCallback } from 'react'
import { ShoppingBag, Package, Check, X, RotateCw, Eye, EyeOff, Move, CircleDollarSign } from 'lucide-react'
import { SHOP_ITEMS, type ShopItem } from '@/lib/companion-data'

type Tab = 'warehouse' | 'shop'

export type InventoryItem = ShopItem & {
  position?: { x: number; y: number }
  rotation?: number
  hidden?: boolean
  preview?: boolean
}

// 物品图标：优先使用图片，否则退回色块
function ItemIcon({
  item,
  size = 'md',
  style,
}: {
  item: ShopItem
  size?: 'sm' | 'md'
  style?: React.CSSProperties
}) {
  const dim = size === 'sm' ? 'h-12 w-12' : 'h-16 w-16'
  const inner = size === 'sm' ? 'size-8' : 'size-10'

  return (
    <div
      className={`${dim} flex items-center justify-center rounded-xl overflow-hidden`}
      style={{ backgroundColor: item.emojiColor + '33', ...style }}
    >
      {item.image ? (
        <img
          src={item.image}
          alt={item.name}
          className={`pixelated ${inner} object-contain`}
        />
      ) : (
        <span className={`${inner} rounded-xl border-2 border-border/60`} style={{ backgroundColor: item.emojiColor }} />
      )}
    </div>
  )
}

export function ShopPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currentTab, setCurrentTab] = useState<Tab>('warehouse')
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [previewItem, setPreviewItem] = useState<InventoryItem | null>(null)

  const handleBuy = useCallback((item: ShopItem) => {
    const newItem: InventoryItem = {
      ...item,
      position: { x: 50, y: 50 },
      rotation: 0,
      hidden: false,
      preview: false,
    }
    setInventory((prev) => [...prev, newItem])
    setPreviewItem(null)
  }, [])

  const handlePreview = useCallback((item: ShopItem) => {
    setPreviewItem({ ...item, position: { x: 50, y: 50 }, rotation: 0, hidden: false, preview: true })
  }, [])

  const cancelPreview = useCallback(() => setPreviewItem(null), [])

  const handleRotate = useCallback((item: InventoryItem) => {
    setInventory((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, rotation: ((i.rotation || 0) + 90) % 360 } : i))
    )
  }, [])

  const handleToggleVisibility = useCallback((item: InventoryItem) => {
    setInventory((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, hidden: !i.hidden } : i))
    )
  }, [])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="max-h-[72dvh] w-full rounded-t-3xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标签切换栏 + 关闭按钮 */}
        <div className="flex items-center border-b border-border shrink-0">
          <button
            onClick={() => setCurrentTab('warehouse')}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3.5 font-cute text-base transition-colors ${
              currentTab === 'warehouse'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="size-5" />
            仓库
            {inventory.length > 0 && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs text-primary">{inventory.length}</span>
            )}
          </button>
          <button
            onClick={() => { setPreviewItem(null); setCurrentTab('shop') }}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3.5 font-cute text-base transition-colors ${
              currentTab === 'shop'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingBag className="size-5" />
            商店
          </button>
          <button
            onClick={onClose}
            className="mr-3 flex size-8 shrink-0 items-center justify-center rounded-full hover:bg-secondary"
            aria-label="关闭"
          >
            <X className="size-4 text-muted-foreground" />
          </button>
        </div>

        {/* 内容区域 - 横向滑动 */}
        <div className="overflow-x-auto px-4 py-4 scrollbar-hide flex-1">
          {currentTab === 'warehouse' ? (
            inventory.length === 0 ? (
              <div className="flex min-h-32 flex-col items-center justify-center py-8 text-center">
                <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-secondary/50">
                  <Package className="size-7 text-muted-foreground" />
                </span>
                <p className="font-cute text-muted-foreground">空空如也~</p>
                <p className="mt-1 text-xs text-muted-foreground/70">去商店看看吧</p>
              </div>
            ) : (
              <div className="flex gap-3 pb-2">
                {inventory.map((item) => (
                  <div
                    key={item.id}
                    className={`flex w-28 shrink-0 flex-col items-center rounded-2xl border-2 p-3 transition-all ${
                      item.hidden ? 'border-dashed border-border/50 bg-secondary/30' : 'border-border bg-background/60'
                    }`}
                  >
                    <div style={{ transform: `rotate(${item.rotation || 0}deg)`, opacity: item.hidden ? 0.4 : 1, transition: 'transform 0.3s' }}>
                      <ItemIcon item={item} size="sm" />
                    </div>
                    <p className="mt-2 font-cute text-center text-xs text-foreground line-clamp-1">{item.name}</p>
                    <div className="mt-2 flex gap-1">
                      <button
                        onClick={() => handleRotate(item)}
                        title="旋转"
                        className="flex size-7 items-center justify-center rounded-lg bg-secondary/50 transition hover:bg-secondary"
                      >
                        <RotateCw className="size-3.5 text-muted-foreground" />
                      </button>
                      <button
                        onClick={() => handleToggleVisibility(item)}
                        title={item.hidden ? '显示' : '隐藏'}
                        className="flex size-7 items-center justify-center rounded-lg bg-secondary/50 transition hover:bg-secondary"
                      >
                        {item.hidden ? <Eye className="size-3.5 text-muted-foreground" /> : <EyeOff className="size-3.5 text-muted-foreground" />}
                      </button>
                      <button
                        title="放置"
                        className="flex size-7 items-center justify-center rounded-lg bg-primary/10 transition hover:bg-primary/20"
                      >
                        <Move className="size-3.5 text-primary" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            <div className="flex gap-3 pb-2">
              {SHOP_ITEMS.map((item) => {
                const owned = inventory.some((i) => i.id === item.id)
                const isPreviewing = previewItem?.id === item.id
                return (
                  <div
                    key={item.id}
                    className={`flex w-32 shrink-0 flex-col items-center rounded-2xl border-2 bg-background/60 p-3 transition-all ${
                      owned ? 'opacity-60' : isPreviewing ? 'border-primary shadow-md' : 'border-border hover:border-primary/40 hover:shadow-sm'
                    }`}
                  >
                    <ItemIcon item={item} />
                    <p className="mt-2 font-cute text-center text-xs text-foreground line-clamp-1">{item.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-center text-[10px] text-muted-foreground">{item.desc}</p>

                    {owned ? (
                      <div className="mt-2 flex items-center gap-1 text-primary">
                        <Check className="size-3" />
                        <span className="text-xs">已获得</span>
                      </div>
                    ) : isPreviewing ? (
                      <div className="mt-2 flex gap-1">
                        <button
                          onClick={() => handleBuy(item)}
                          className="flex items-center gap-1 rounded-full bg-primary px-3 py-1 text-xs text-primary-foreground transition hover:brightness-105"
                        >
                          <CircleDollarSign className="size-3" />¥{item.price}
                        </button>
                        <button
                          onClick={cancelPreview}
                          className="flex size-7 items-center justify-center rounded-full bg-secondary transition hover:bg-secondary/80"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handlePreview(item)}
                        className="mt-2 rounded-full bg-primary/10 px-4 py-1.5 text-xs text-primary transition hover:bg-primary/20"
                      >
                        预览
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* 预览提示 */}
        {previewItem && currentTab === 'shop' && (
          <div className="border-t border-border bg-secondary/30 px-4 py-2 text-center text-xs text-muted-foreground shrink-0">
            预览中：{previewItem.name} · 点击购买或取消
          </div>
        )}
      </div>
    </div>
  )
}
