import { useState, useCallback, useEffect, useRef } from 'react'
import { ShoppingBag, Package, Check, X, RotateCw, Eye, EyeOff, Save, Trash2 } from 'lucide-react'
import { SHOP_ITEMS, type ShopItem } from '@/lib/companion-data'
import { companionLocal } from '@/lib/companion-local'
import { companionApi } from '@/lib/companion-api'

type Tab = 'warehouse' | 'shop'

export type InventoryItem = ShopItem & {
  position?: { x: number; y: number }
  rotation?: number
  hidden?: boolean
}

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

interface ShopPanelProps {
  open: boolean
  onClose: () => void
  onPreviewChange?: (items: InventoryItem[]) => void
  coins?: number
  onCoinsChange?: (newCoins: number) => void
}

export function ShopPanel({ open, onClose, onPreviewChange, coins = 100, onCoinsChange }: ShopPanelProps) {
  const [currentTab, setCurrentTab] = useState<Tab>('warehouse')
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [pendingShopItemIds, setPendingShopItemIds] = useState<Set<string>>(new Set())
  const [showReceipt, setShowReceipt] = useState(false)
  const [showUnsavedDialog, setShowUnsavedDialog] = useState(false)
  const [isBuying, setIsBuying] = useState(false)

  const inventorySnapshotRef = useRef<InventoryItem[]>([])
  const pendingSnapshotRef = useRef<Set<string>>(new Set())
  const closeTargetRef = useRef<'save' | 'discard' | null>(null)

  // 打开时加载数据并保存快照
  useEffect(() => {
    if (!open) return
    const savedItems = companionLocal.getItems()
    const savedLayout = companionLocal.getItemsLayout()
    
    // 如果有保存的布局，用保存的布局；否则生成默认布局
    let inv: InventoryItem[]
    if (savedLayout.length > 0) {
      inv = savedLayout.map(layout => {
        const shopItem = SHOP_ITEMS.find(s => s.id === layout.itemId)
        return {
          id: layout.id,
          name: shopItem?.name || layout.itemId,
          desc: shopItem?.desc || '',
          price: shopItem?.price || 0,
          emojiColor: shopItem?.emojiColor || '#ccc',
          image: shopItem?.image,
          category: shopItem?.category,
          position: layout.position,
          rotation: layout.rotation,
          hidden: layout.hidden,
        }
      })
    } else {
      inv = savedItems.map((id, idx) => {
        const shopItem = SHOP_ITEMS.find(s => s.id === id)
        return {
          id: `${id}_${idx}`,
          name: shopItem?.name || id,
          desc: shopItem?.desc || '',
          price: shopItem?.price || 0,
          emojiColor: shopItem?.emojiColor || '#ccc',
          image: shopItem?.image,
          category: shopItem?.category,
          position: { x: 30 + (idx % 5) * 10, y: 55 + Math.floor(idx / 5) * 8 },
          rotation: 0,
          hidden: false,
        }
      })
    }
    
    setInventory(inv)
    setPendingShopItemIds(new Set())
    inventorySnapshotRef.current = JSON.parse(JSON.stringify(inv))
    pendingSnapshotRef.current = new Set()
    closeTargetRef.current = null
  }, [open])

  // 计算预览物品：仓库中未隐藏的 + 商店中待购买的
  const previewItems: InventoryItem[] = [
    ...inventory.filter(item => !item.hidden),
    ...Array.from(pendingShopItemIds).map((id, idx) => {
      const shopItem = SHOP_ITEMS.find(s => s.id === id)!
      return {
        ...shopItem,
        id: `pending_${id}_${idx}`,
        position: { x: 50 + (idx % 3) * 8 - 8, y: 58 + Math.floor(idx / 3) * 8 },
        rotation: 0,
        hidden: false,
      }
    }),
  ]

  // 同步预览到父组件
  useEffect(() => {
    if (!onPreviewChange) return
    onPreviewChange(previewItems)
  }, [previewItems, onPreviewChange])

  // 计算待花费代币
  const pendingTotal = Array.from(pendingShopItemIds).reduce((sum, id) => {
    const item = SHOP_ITEMS.find(s => s.id === id)
    return sum + (item?.price || 0)
  }, 0)

  // 检查是否有未保存的更改
  const hasUnsavedChanges = useCallback(() => {
    const invChanged = JSON.stringify(inventory) !== JSON.stringify(inventorySnapshotRef.current)
    const pendingChanged = Array.from(pendingShopItemIds).sort().join(',') !== Array.from(pendingSnapshotRef.current).sort().join(',')
    return invChanged || pendingChanged
  }, [inventory, pendingShopItemIds])

  // 仓库物品点击：切换显示/隐藏
  const toggleWarehouseItem = useCallback((item: InventoryItem) => {
    setInventory(prev =>
      prev.map(i => i.id === item.id ? { ...i, hidden: !i.hidden } : i)
    )
  }, [])

  // 商店物品点击：切换待购买状态
  const toggleShopItem = useCallback((item: ShopItem) => {
    setPendingShopItemIds(prev => {
      const next = new Set(prev)
      if (next.has(item.id)) {
        next.delete(item.id)
      } else {
        next.add(item.id)
      }
      return next
    })
  }, [])

  // 旋转物品
  const handleRotate = useCallback((itemId: string) => {
    setInventory(prev =>
      prev.map(i => i.id === itemId ? { ...i, rotation: ((i.rotation || 0) + 90) % 360 } : i)
    )
  }, [])

  // 移除仓库物品
  const handleRemove = useCallback((itemId: string) => {
    setInventory(prev => prev.filter(i => i.id !== itemId))
  }, [])

  // 保存当前状态（仅显示/隐藏，不涉及代币）
  const saveLayoutOnly = useCallback(() => {
    const newInv = [...inventory]
    // 保存布局到 localStorage
    const layout = newInv.map(item => ({
      id: item.id,
      itemId: item.id.split('_')[0],
      position: item.position || { x: 50, y: 50 },
      rotation: item.rotation || 0,
      hidden: item.hidden || false,
    }))
    companionLocal.saveItemsLayout(layout)
    // 同时更新物品列表（确保新购买的物品也被保存）
    const itemIds = Array.from(new Set(newInv.map(i => i.id.split('_')[0])))
    itemIds.forEach(id => companionLocal.addItem(id))
    
    inventorySnapshotRef.current = JSON.parse(JSON.stringify(newInv))
    pendingSnapshotRef.current = new Set(pendingShopItemIds)
  }, [inventory, pendingShopItemIds])

  // 执行购买
  const doPurchase = useCallback(async () => {
    if (pendingTotal === 0) {
      saveLayoutOnly()
      return true
    }

    setIsBuying(true)
    try {
      const items = Array.from(pendingShopItemIds).map(id => ({
        item_id: id,
        quantity: 1,
        price: SHOP_ITEMS.find(s => s.id === id)?.price || 0,
      }))
      const result = await companionApi.buyItems(items)
      if (result.status === 'ok') {
        // 计算新的仓库物品：原来的 + 新购买的
        const newItems: InventoryItem[] = Array.from(pendingShopItemIds).map((id, idx) => {
          const shopItem = SHOP_ITEMS.find(s => s.id === id)!
          return {
            ...shopItem,
            id: `${id}_${Date.now()}_${idx}`,
            position: { x: 50 + (idx % 3) * 8 - 8, y: 58 + Math.floor(idx / 3) * 8 },
            rotation: 0,
            hidden: false,
          }
        })
        const newInv = [...inventory, ...newItems]
        setInventory(newInv)

        // 更新本地存储
        newInv.forEach(item => {
          const baseId = item.id.split('_')[0]
          companionLocal.addItem(baseId)
        })

        // 更新代币
        const newCoins = result.coins ?? (coins - pendingTotal)
        companionLocal.setCoins(newCoins)
        onCoinsChange?.(newCoins)

        // 清空待购买
        setPendingShopItemIds(new Set())

        // 更新快照
        inventorySnapshotRef.current = JSON.parse(JSON.stringify(newInv))
        pendingSnapshotRef.current = new Set()

        return true
      } else {
        alert(result.message || '购买失败')
        return false
      }
    } catch (err) {
      console.error('购买失败:', err)
      alert('购买失败，请稍后重试')
      return false
    } finally {
      setIsBuying(false)
    }
  }, [pendingShopItemIds, inventory, coins, pendingTotal, onCoinsChange, saveLayoutOnly])

  // 点击保存按钮
  const handleSave = useCallback(() => {
    if (pendingTotal > 0) {
      setShowReceipt(true)
    } else {
      saveLayoutOnly()
    }
  }, [pendingTotal, saveLayoutOnly])

  // 小票确认支付
  const confirmReceipt = useCallback(async () => {
    const ok = await doPurchase()
    if (ok) {
      setShowReceipt(false)
    }
  }, [doPurchase])

  // 尝试关闭（检查未保存）
  const tryClose = useCallback(() => {
    if (hasUnsavedChanges()) {
      setShowUnsavedDialog(true)
    } else {
      onClose()
    }
  }, [hasUnsavedChanges, onClose])

  // 未保存对话框：保存并退出
  const handleSaveAndClose = useCallback(async () => {
    closeTargetRef.current = 'save'
    if (pendingTotal > 0) {
      setShowUnsavedDialog(false)
      setShowReceipt(true)
    } else {
      saveLayoutOnly()
      setShowUnsavedDialog(false)
      onClose()
    }
  }, [pendingTotal, saveLayoutOnly, onClose])

  // 未保存对话框：直接退出
  const handleDiscardAndClose = useCallback(() => {
    // 恢复快照
    setInventory(JSON.parse(JSON.stringify(inventorySnapshotRef.current)))
    setPendingShopItemIds(new Set(pendingSnapshotRef.current))
    setShowUnsavedDialog(false)
    onClose()
  }, [onClose])

  // 小票取消后，如果是从关闭触发的，继续关闭流程
  useEffect(() => {
    if (!showReceipt && closeTargetRef.current === 'save') {
      closeTargetRef.current = null
      // 检查是否购买成功（通过比较快照）
      if (!hasUnsavedChanges()) {
        onClose()
      }
    }
  }, [showReceipt, hasUnsavedChanges, onClose])

  if (!open) return null

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-40" onClick={tryClose} />
      
      <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-3 sm:bottom-6">
        <div className="mx-3 w-full max-w-2xl">
          <div className="max-h-[62dvh] w-full rounded-3xl border-2 border-border bg-card/95 shadow-2xl backdrop-blur-md flex flex-col animate-in slide-in-from-bottom duration-300">
            <div className="flex items-center border-b-2 border-border/70 bg-secondary/50 shrink-0">
              <button
                onClick={() => setCurrentTab('warehouse')}
                className={`flex flex-1 items-center justify-center gap-2 px-4 py-3.5 font-pixel text-sm transition-colors ${
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
                onClick={() => setCurrentTab('shop')}
                className={`flex flex-1 items-center justify-center gap-2 px-4 py-3.5 font-pixel text-sm transition-colors ${
                  currentTab === 'shop'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ShoppingBag className="size-5" />
                商店
              </button>
              <div className="flex items-center gap-2 px-3">
                <span className={`flex items-center gap-1 rounded-full px-3 py-1 font-pixel text-sm ${
                  pendingTotal > 0 ? 'bg-amber-100 text-amber-800' : 'bg-amber-50 text-amber-600'
                }">
                  <span className="text-base">🥫</span>
                  {coins}
                  {pendingTotal > 0 && (
                    <span className="text-amber-500"> (-{pendingTotal})</span>
                  )}
                </span>
                <button
                  onClick={tryClose}
                  className="flex size-8 shrink-0 items-center justify-center rounded-full bg-secondary/70 transition hover:bg-secondary"
                  aria-label="关闭"
                >
                  <X className="size-4 text-muted-foreground" />
                </button>
              </div>
            </div>

            <div className="overflow-y-auto px-4 py-4 scrollbar-hide flex-1">
              {currentTab === 'warehouse' ? (
                inventory.length === 0 ? (
                  <div className="flex min-h-32 flex-col items-center justify-center py-8 text-center">
                    <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-secondary/50">
                      <Package className="size-7 text-muted-foreground" />
                    </span>
                    <p className="font-pixel text-muted-foreground">空空如也~</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">去商店看看吧</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-4 gap-3 pb-2 sm:grid-cols-6">
                    {inventory.map((item) => {
                    const isShowing = !item.hidden
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleWarehouseItem(item)}
                        className={`relative flex cursor-pointer flex-col items-center rounded-2xl border-2 p-2.5 transition-all ${
                          isShowing
                            ? 'border-primary bg-primary/10 shadow-md scale-[1.02]'
                            : 'border-dashed border-border/50 bg-secondary/30 opacity-60 hover:opacity-80'
                        }`}
                      >
                        {isShowing && (
                          <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                            <Eye className="size-3" />
                          </span>
                        )}
                        <div style={{ transform: `rotate(${item.rotation || 0}deg)`, transition: 'transform 0.3s' }}>
                          <ItemIcon item={item} size="sm" />
                        </div>
                        <p className="mt-1.5 w-full truncate text-center font-pixel text-[10px] text-foreground">{item.name}</p>
                        
                        <div className="mt-1.5 flex w-full gap-0.5">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRotate(item.id); }}
                            title="旋转"
                            className="flex flex-1 items-center justify-center rounded-md bg-secondary/50 py-1 transition hover:bg-secondary"
                          >
                            <RotateCw className="size-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleWarehouseItem(item); }}
                            title={item.hidden ? '显示' : '隐藏'}
                            className="flex flex-1 items-center justify-center rounded-md bg-secondary/50 py-1 transition hover:bg-secondary"
                          >
                            {item.hidden ? <Eye className="size-3 text-muted-foreground" /> : <EyeOff className="size-3 text-muted-foreground" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                            title="移除"
                            className="flex flex-1 items-center justify-center rounded-md bg-red-100 py-1 transition hover:bg-red-200"
                          >
                            <Trash2 className="size-3 text-red-500" />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                  </div>
                )
              ) : (
                <div className="grid grid-cols-4 gap-3 pb-2 sm:grid-cols-6">
                  {SHOP_ITEMS.map((item) => {
                    const isPending = pendingShopItemIds.has(item.id)
                    const canAfford = coins >= item.price
                    return (
                      <div
                        key={item.id}
                        onClick={() => toggleShopItem(item)}
                        className={`relative flex flex-col items-center rounded-2xl border-2 bg-background/60 p-2.5 transition-all cursor-pointer ${
                          isPending
                            ? 'border-amber-500 bg-amber-50 shadow-md scale-[1.02]'
                            : canAfford
                              ? 'border-border hover:border-primary/40 hover:shadow-sm'
                              : 'border-border/50 opacity-60'
                        }`}
                      >
                        {isPending && (
                          <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-amber-500 text-white shadow-sm">
                            <Check className="size-3" />
                          </span>
                        )}
                        <ItemIcon item={item} size="sm" />
                        <p className="mt-1.5 w-full truncate text-center font-pixel text-[10px] text-foreground">{item.name}</p>
                        <p className="mt-0.5 line-clamp-2 w-full text-center text-[9px] text-muted-foreground">{item.desc}</p>
                        
                        <div className={`mt-1.5 flex w-full items-center justify-center gap-1 rounded-full px-2 py-1 font-pixel text-[10px] ${
                          canAfford
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-400'
                        }`}>
                          <span>🥫</span>
                          {item.price}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 border-t-2 border-border/70 bg-secondary/40 px-4 py-3 shrink-0">
              <div className="flex-1">
                {pendingTotal > 0 ? (
                  <>
                    <p className="font-pixel text-xs text-muted-foreground">
                      待购买 {pendingShopItemIds.size} 件商品
                    </p>
                    <p className="font-pixel text-sm text-amber-600">
                      合计：🥫 {pendingTotal}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-pixel text-xs text-muted-foreground">
                    调整显示中的物品 {inventory.filter(i => !i.hidden).length} 件
                    </p>
                  </>
                )}
              </div>
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 font-pixel text-sm text-primary-foreground transition hover:brightness-105 active:scale-95"
              >
                <Save className="size-4" />
                保存
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 小票弹窗 */}
      {showReceipt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border-2 border-border bg-card p-6 shadow-2xl animate-bubble-in">
            <h3 className="mb-4 text-center font-pixel text-lg text-foreground">
              {pendingTotal > 0 ? '支付小票' : '确认保存'}
            </h3>
            
            <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-4">
              <div className="mb-3 border-b border-dashed border-border pb-2">
                <p className="font-pixel text-xs text-muted-foreground">
                  {pendingTotal > 0 ? '商品清单' : '布置清单'}
                </p>
              </div>
              
              {pendingTotal > 0 ? (
                <div className="space-y-2">
                  {Array.from(pendingShopItemIds).map(id => {
                  const item = SHOP_ITEMS.find(s => s.id === id)!
                  return (
                    <div key={id} className="flex items-center justify-between">
                      <span className="font-pixel text-xs text-foreground">{item.name}</span>
                      <span className="font-pixel text-xs text-muted-foreground">🥫 {item.price}</span>
                    </div>
                  )
                })}
                </div>
              ) : (
                <p className="py-4 text-center font-pixel text-xs text-muted-foreground">
                  共 {inventory.filter(i => !i.hidden).length} 件物品已摆放
                </p>
              )}
              
              {pendingTotal > 0 && (
                <div className="mt-3 border-t border-dashed border-border pt-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-pixel text-xs text-muted-foreground">合计</span>
                    <span className="font-pixel text-sm text-amber-600">🥫 {pendingTotal}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-pixel text-xs text-muted-foreground">当前余额</span>
                    <span className="font-pixel text-xs text-foreground">🥫 {coins}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-pixel text-xs text-muted-foreground">购买后余额</span>
                    <span className={`font-pixel text-xs ${coins - pendingTotal < 0 ? 'text-red-500' : 'text-foreground'}`}>🥫 {coins - pendingTotal}</span>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowReceipt(false)}
                disabled={isBuying}
                className="flex-1 rounded-full bg-secondary py-2.5 font-pixel text-sm text-secondary-foreground transition hover:bg-secondary/80 disabled:opacity-50"
              >
                取消
              </button>
              <button
                onClick={confirmReceipt}
                disabled={isBuying || (pendingTotal > 0 && coins < pendingTotal)}
                className="flex-1 rounded-full bg-amber-500 py-2.5 font-pixel text-sm text-white transition hover:brightness-105 disabled:opacity-50"
              >
                {isBuying ? '支付中...' : pendingTotal > 0 ? '确认支付' : '确认保存'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 未保存提示弹窗 */}
      {showUnsavedDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border-2 border-border bg-card p-6 shadow-2xl animate-bubble-in">
            <h3 className="mb-2 text-center font-pixel text-lg text-foreground">有未保存的更改</h3>
            <p className="mb-5 text-center text-sm text-muted-foreground">
              当前布置还未保存，确定要退出吗？
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleDiscardAndClose}
                className="flex-1 rounded-full bg-secondary py-2.5 font-pixel text-sm text-secondary-foreground transition hover:bg-secondary/80"
              >
                退出
              </button>
              <button
                onClick={handleSaveAndClose}
                className="flex-1 rounded-full bg-primary py-2.5 font-pixel text-sm text-primary-foreground transition hover:brightness-105"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
