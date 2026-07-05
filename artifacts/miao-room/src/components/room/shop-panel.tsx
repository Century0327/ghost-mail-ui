

import { useState, useCallback } from 'react'
import { ShoppingBag, Package, Check, X, RotateCw, Eye, EyeOff, Move, CircleDollarSign } from 'lucide-react'
import { SHOP_ITEMS, type ShopItem } from '@/lib/companion-data'

type Tab = 'warehouse' | 'shop'

// 仓库物品类型
export type InventoryItem = ShopItem & {
  id: string
  name: string
  desc: string
  price: number
  emojiColor: string
  position?: { x: number; y: number } // 在房间的位置（百分比）
  rotation?: number // 旋转角度
  hidden?: boolean // 是否隐藏
  preview?: boolean // 是否在预览中
}

// 底部抽屉式物品栏
export function ShopPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currentTab, setCurrentTab] = useState<Tab>('warehouse')
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [previewItem, setPreviewItem] = useState<InventoryItem | null>(null)

  // 购买物品
  const handleBuy = useCallback((item: ShopItem) => {
    const newItem: InventoryItem = {
      ...item,
      position: { x: 50, y: 50 }, // 默认在房间中心
      rotation: 0,
      hidden: false,
      preview: false,
    }
    setInventory((prev) => [...prev, newItem])
    setPreviewItem(null)
  }, [])

  // 开始预览（点击商店物品）
  const handlePreview = useCallback((item: ShopItem) => {
    const previewInventory: InventoryItem = {
      ...item,
      position: { x: 50, y: 50 },
      rotation: 0,
      hidden: false,
      preview: true,
    }
    setPreviewItem(previewInventory)
  }, [])

  // 取消预览
  const cancelPreview = useCallback(() => {
    setPreviewItem(null)
  }, [])

  // 放置物品到房间
  const handlePlace = useCallback((item: InventoryItem) => {
    setInventory((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, hidden: false } : i))
    )
  }, [])

  // 旋转物品
  const handleRotate = useCallback((item: InventoryItem) => {
    setInventory((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, rotation: ((i.rotation || 0) + 90) % 360 } : i
      )
    )
  }, [])

  // 切换物品显示/隐藏
  const handleToggleVisibility = useCallback((item: InventoryItem) => {
    setInventory((prev) =>
      prev.map((i) =>
        i.id === item.id ? { ...i, hidden: !i.hidden } : i
      )
    )
  }, [])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/20 backdrop-blur-[2px] animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="max-h-[70dvh] w-full rounded-t-3xl border border-border bg-card shadow-2xl animate-in slide-in-from-bottom duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标签切换栏 */}
        <div className="flex border-b border-border">
          <button
            onClick={() => setCurrentTab('warehouse')}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 font-cute text-base transition-colors ${
              currentTab === 'warehouse'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Package className="size-5" />
            仓库
            {inventory.length > 0 && (
              <span className="rounded-full bg-primary/20 px-2 py-0.5 text-xs">{inventory.length}</span>
            )}
          </button>
          <button
            onClick={() => setCurrentTab('shop')}
            className={`flex flex-1 items-center justify-center gap-2 px-4 py-3 font-cute text-base transition-colors ${
              currentTab === 'shop'
                ? 'border-b-2 border-primary text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ShoppingBag className="size-5" />
            商店
          </button>
        </div>

        {/* 内容区域 - 横向滑动 */}
        <div className="overflow-x-auto px-4 py-4 scrollbar-hide">
          {currentTab === 'warehouse' ? (
            // 仓库视图
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
                    {/* 物品图标 */}
                    <div
                      className="mb-2 flex h-16 w-16 items-center justify-center rounded-xl"
                      style={{
                        backgroundColor: item.emojiColor + '55',
                        transform: `rotate(${item.rotation || 0}deg)`,
                        opacity: item.hidden ? 0.4 : 1,
                      }}
                    >
                      <span
                        className="size-10 rounded-xl border-2 border-border/60"
                        style={{ backgroundColor: item.emojiColor }}
                        aria-hidden="true"
                      />
                    </div>

                    {/* 物品名称 */}
                    <p className="font-cute text-center text-xs text-foreground line-clamp-1">{item.name}</p>

                    {/* 操作按钮 */}
                    <div className="mt-2 flex gap-1">
                      <button
                        onClick={() => handlePlace(item)}
                        title="放置"
                        className="flex size-7 items-center justify-center rounded-lg bg-primary/10 transition hover:bg-primary/20"
                      >
                        <Move className="size-3.5 text-primary" />
                      </button>
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
                        {item.hidden ? (
                          <Eye className="size-3.5 text-muted-foreground" />
                        ) : (
                          <EyeOff className="size-3.5 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )
          ) : (
            // 商店视图
            <div className="flex gap-3 pb-2">
              {SHOP_ITEMS.map((item) => {
                const owned = inventory.some((i) => i.id === item.id)
                const isPreviewing = previewItem?.id === item.id
                return (
                  <div
                    key={item.id}
                    className={`flex w-32 shrink-0 flex-col items-center rounded-2xl border-2 bg-background/60 p-3 transition-all ${
                      owned ? 'opacity-60' : isPreviewing ? 'border-primary' : 'border-border'
                    }`}
                  >
                    {/* 物品图标 */}
                    <div
                      className="mb-2 flex h-16 w-16 items-center justify-center rounded-xl"
                      style={{ backgroundColor: item.emojiColor + '55' }}
                    >
                      <span
                        className="size-10 rounded-xl border-2 border-border/60"
                        style={{ backgroundColor: item.emojiColor }}
                        aria-hidden="true"
                      />
                    </div>

                    {/* 物品名称和描述 */}
                    <p className="font-cute text-center text-xs text-foreground line-clamp-1">{item.name}</p>
                    <p className="mt-0.5 line-clamp-2 text-center text-[10px] text-muted-foreground">{item.desc}</p>

                    {/* 购买/预览按钮 */}
                    {owned ? (
                      <div className="mt-2 flex items-center gap-1 text-accent">
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
          <div className="border-t border-border bg-secondary/30 px-4 py-2 text-center text-xs text-muted-foreground">
            预览中：{previewItem.name} · 点击购买或取消
          </div>
        )}
      </div>
    </div>
  )
}
