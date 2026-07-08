import { useState, useCallback, useEffect } from 'react'
import { ShoppingBag, Package, Check, X, RotateCw, Eye, EyeOff, Save, Trash2, Plus, Minus, ShoppingCart } from 'lucide-react'
import { SHOP_ITEMS, type ShopItem } from '@/lib/companion-data'
import { companionLocal } from '@/lib/companion-local'

type Tab = 'warehouse' | 'shop' | 'cart'

export type InventoryItem = ShopItem & {
  position?: { x: number; y: number }
  rotation?: number
  hidden?: boolean
  preview?: boolean
  selected?: boolean
}

type CartItem = ShopItem & {
  cartId: string
  quantity: number
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
}

export function ShopPanel({ open, onClose, onPreviewChange }: ShopPanelProps) {
  const [currentTab, setCurrentTab] = useState<Tab>('warehouse')
  const [inventory, setInventory] = useState<InventoryItem[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showReceipt, setShowReceipt] = useState(false)
  const [coins, setCoins] = useState(100)
  const [cart, setCart] = useState<CartItem[]>([])

  useEffect(() => {
    if (!open) return
    const saved = companionLocal.getItems()
    const inv: InventoryItem[] = saved.map((id, idx) => {
      const shopItem = SHOP_ITEMS.find(s => s.id === id)
      return {
        id: `${id}_${idx}`,
        name: shopItem?.name || id,
        desc: shopItem?.desc || '',
        price: shopItem?.price || 0,
        emojiColor: shopItem?.emojiColor || '#ccc',
        image: shopItem?.image,
        position: { x: 30 + (idx % 5) * 10, y: 55 + Math.floor(idx / 5) * 8 },
        rotation: 0,
        hidden: false,
        preview: false,
      }
    })
    setInventory(inv)
    setSelectedIds(new Set())
    setCoins(companionLocal.getCoins?.() || 100)
    setCart([])
  }, [open])

  useEffect(() => {
    if (!onPreviewChange) return
    const previewItems = inventory.filter(item => selectedIds.has(item.id))
    onPreviewChange(previewItems)
  }, [selectedIds, inventory, onPreviewChange])

  const toggleSelect = useCallback((item: InventoryItem) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(item.id)) {
        next.delete(item.id)
      } else {
        next.add(item.id)
      }
      return next
    })
  }, [])

  const handleRotate = useCallback((itemId: string) => {
    setInventory(prev =>
      prev.map((i) => (i.id === itemId ? { ...i, rotation: ((i.rotation || 0) + 90) % 360 } : i))
    )
  }, [])

  const handleToggleVisibility = useCallback((itemId: string) => {
    setInventory(prev =>
      prev.map((i) => (i.id === itemId ? { ...i, hidden: !i.hidden } : i))
    )
  }, [])

  const addToCart = useCallback((item: ShopItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id)
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c)
      }
      return [...prev, { ...item, cartId: `${item.id}_${Date.now()}`, quantity: 1 }]
    })
  }, [])

  const removeFromCart = useCallback((cartId: string) => {
    setCart(prev => prev.filter(c => c.cartId !== cartId))
  }, [])

  const decreaseQuantity = useCallback((cartId: string) => {
    setCart(prev => {
      const item = prev.find(c => c.cartId === cartId)
      if (!item) return prev
      if (item.quantity <= 1) {
        return prev.filter(c => c.cartId !== cartId)
      }
      return prev.map(c => c.cartId === cartId ? { ...c, quantity: c.quantity - 1 } : c)
    })
  }, [])

  const increaseQuantity = useCallback((cartId: string) => {
    setCart(prev => prev.map(c => c.cartId === cartId ? { ...c, quantity: c.quantity + 1 } : c))
  }, [])

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)
  const canAffordCart = coins >= cartTotal

  const handleCheckout = useCallback(() => {
    if (!canAffordCart || cart.length === 0) return

    const newInventoryItems: InventoryItem[] = []
    cart.forEach(item => {
      for (let i = 0; i < item.quantity; i++) {
        const newItem: InventoryItem = {
          ...item,
          id: `${item.id}_${Date.now()}_${i}`,
          position: { x: 50 + (Math.random() - 0.5) * 20, y: 60 + (Math.random() - 0.5) * 10 },
          rotation: 0,
          hidden: false,
          preview: false,
        }
        newInventoryItems.push(newItem)
        companionLocal.addItem(item.id)
      }
    })

    setInventory(prev => [...prev, ...newInventoryItems])
    setCoins(prev => prev - cartTotal)
    companionLocal.setCoins?.(coins - cartTotal)
    setCart([])
    setCurrentTab('warehouse')
  }, [cart, coins, canAffordCart])

  const handleRemove = useCallback((itemId: string) => {
    setInventory(prev => prev.filter(i => i.id !== itemId))
    setSelectedIds(prev => {
      const next = new Set(prev)
      next.delete(itemId)
      return next
    })
  }, [])

  const selectedItems = inventory.filter(i => selectedIds.has(i.id))

  const handleSave = () => {
    setShowReceipt(true)
  }

  const confirmSave = () => {
    setShowReceipt(false)
    onClose()
  }

  if (!open) return null

  return (
    <>
      <div className="pointer-events-none fixed inset-0 z-40" onClick={onClose} />
      
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
              <button
                onClick={() => setCurrentTab('cart')}
                className={`flex flex-1 items-center justify-center gap-2 px-4 py-3.5 font-pixel text-sm transition-colors ${
                  currentTab === 'cart'
                    ? 'border-b-2 border-primary text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <ShoppingCart className="size-5" />
                购物车
                {cartCount > 0 && (
                  <span className="rounded-full bg-amber-500 px-2 py-0.5 text-xs text-white">{cartCount}</span>
                )}
              </button>
              <div className="flex items-center gap-2 px-3">
                <span className="flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1 font-pixel text-sm text-amber-800">
                  <span className="text-base">🥫</span>
                  {coins}
                </span>
                <button
                  onClick={onClose}
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
                      const isSelected = selectedIds.has(item.id)
                      return (
                        <div
                          key={item.id}
                          onClick={() => toggleSelect(item)}
                          className={`relative flex cursor-pointer flex-col items-center rounded-2xl border-2 p-2.5 transition-all ${
                            isSelected
                              ? 'border-primary bg-primary/10 shadow-md scale-[1.02]'
                              : item.hidden
                                ? 'border-dashed border-border/50 bg-secondary/30 opacity-60'
                                : 'border-border bg-background/60 hover:border-primary/40 hover:shadow-sm'
                          }`}
                        >
                          {isSelected && (
                            <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-sm">
                              <Check className="size-3" />
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
                              onClick={(e) => { e.stopPropagation(); handleToggleVisibility(item.id); }}
                              title={item.hidden ? '显示' : '隐藏'}
                              className="flex flex-1 items-center justify-center rounded-md bg-secondary/50 py-1 transition hover:bg-secondary"
                            >
                              {item.hidden ? <Eye className="size-3 text-muted-foreground" /> : <EyeOff className="size-3 text-muted-foreground" />}
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
              ) : currentTab === 'shop' ? (
                <div className="grid grid-cols-4 gap-3 pb-2 sm:grid-cols-6">
                  {SHOP_ITEMS.map((item) => {
                    const owned = inventory.some((i) => i.id.startsWith(item.id))
                    const canAfford = coins >= item.price
                    return (
                      <div
                        key={item.id}
                        className={`relative flex flex-col items-center rounded-2xl border-2 bg-background/60 p-2.5 transition-all ${
                          owned ? 'opacity-60' : 'border-border hover:border-primary/40 hover:shadow-sm'
                        }`}
                      >
                        {owned && (
                          <span className="absolute -right-1.5 -top-1.5 flex size-5 items-center justify-center rounded-full bg-green-500 text-white shadow-sm">
                            <Check className="size-3" />
                          </span>
                        )}
                        <ItemIcon item={item} size="sm" />
                        <p className="mt-1.5 w-full truncate text-center font-pixel text-[10px] text-foreground">{item.name}</p>
                        <p className="mt-0.5 line-clamp-2 w-full text-center text-[9px] text-muted-foreground">{item.desc}</p>
                        
                        {owned ? (
                          <span className="mt-1.5 font-pixel text-[10px] text-green-600">已拥有</span>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            disabled={!canAfford}
                            className={`mt-1.5 flex w-full items-center justify-center gap-1 rounded-full px-2 py-1 font-pixel text-[10px] transition ${
                              canAfford
                                ? 'bg-amber-100 text-amber-700 hover:bg-amber-200'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <Plus className="size-3" />
                            <span>🥫</span>
                            {item.price}
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                cart.length === 0 ? (
                  <div className="flex min-h-32 flex-col items-center justify-center py-8 text-center">
                    <span className="mb-3 flex size-14 items-center justify-center rounded-full bg-secondary/50">
                      <ShoppingCart className="size-7 text-muted-foreground" />
                    </span>
                    <p className="font-pixel text-muted-foreground">购物车是空的</p>
                    <p className="mt-1 text-xs text-muted-foreground/70">去商店添加点东西吧</p>
                  </div>
                ) : (
                  <div className="space-y-2 pb-2">
                    {cart.map((item) => (
                      <div
                        key={item.cartId}
                        className="flex items-center gap-3 rounded-2xl border-2 border-border bg-background/60 p-3"
                      >
                        <ItemIcon item={item} size="sm" />
                        <div className="flex-1 min-w-0">
                          <p className="font-pixel text-sm text-foreground truncate">{item.name}</p>
                          <p className="font-pixel text-xs text-amber-600">🥫 {item.price} / 个</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => decreaseQuantity(item.cartId)}
                            className="flex size-7 items-center justify-center rounded-full bg-secondary/50 transition hover:bg-secondary"
                          >
                            <Minus className="size-3 text-muted-foreground" />
                          </button>
                          <span className="font-pixel text-sm w-6 text-center">{item.quantity}</span>
                          <button
                            onClick={() => increaseQuantity(item.cartId)}
                            className="flex size-7 items-center justify-center rounded-full bg-secondary/50 transition hover:bg-secondary"
                          >
                            <Plus className="size-3 text-muted-foreground" />
                          </button>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.cartId)}
                          className="flex size-8 items-center justify-center rounded-full bg-red-100 transition hover:bg-red-200"
                          title="移除"
                        >
                          <Trash2 className="size-4 text-red-500" />
                        </button>
                      </div>
                    ))}
                  </div>
                )
              )}
            </div>

            <div className="flex items-center gap-3 border-t-2 border-border/70 bg-secondary/40 px-4 py-3 shrink-0">
              <div className="flex-1">
                {currentTab === 'cart' ? (
                  <>
                    <p className="font-pixel text-xs text-muted-foreground">
                      购物车 {cartCount} 件商品
                    </p>
                    {cartTotal > 0 && (
                      <p className="font-pixel text-sm text-amber-600">
                        合计：🥫 {cartTotal}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <p className="font-pixel text-xs text-muted-foreground">
                      已选 {selectedItems.length} 件物品
                    </p>
                  </>
                )}
              </div>
              {currentTab === 'cart' ? (
                <button
                  onClick={handleCheckout}
                  disabled={!canAffordCart || cart.length === 0}
                  className={`flex items-center gap-1.5 rounded-full px-5 py-2 font-pixel text-sm transition active:scale-95 ${
                    canAffordCart && cart.length > 0
                      ? 'bg-amber-500 text-white hover:brightness-105'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <ShoppingCart className="size-4" />
                  确认支付
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  className="flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 font-pixel text-sm text-primary-foreground transition hover:brightness-105 active:scale-95"
                >
                  <Save className="size-4" />
                  保存
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {showReceipt && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl border-2 border-border bg-card p-6 shadow-2xl animate-bubble-in">
            <h3 className="mb-4 text-center font-pixel text-lg text-foreground">确认保存</h3>
            
            <div className="rounded-2xl border border-dashed border-border bg-secondary/30 p-4">
              <div className="mb-3 border-b border-dashed border-border pb-2">
                <p className="font-pixel text-xs text-muted-foreground">布置清单</p>
              </div>
              
              {selectedItems.length === 0 ? (
                <p className="py-4 text-center font-pixel text-xs text-muted-foreground">没有选择物品</p>
              ) : (
                <div className="space-y-2">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between">
                      <span className="font-pixel text-xs text-foreground">{item.name}</span>
                      <span className="font-pixel text-xs text-muted-foreground">已摆放</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-5 flex gap-3">
              <button
                onClick={() => setShowReceipt(false)}
                className="flex-1 rounded-full bg-secondary py-2.5 font-pixel text-sm text-secondary-foreground transition hover:bg-secondary/80"
              >
                取消
              </button>
              <button
                onClick={confirmSave}
                className="flex-1 rounded-full bg-primary py-2.5 font-pixel text-sm text-primary-foreground transition hover:brightness-105"
              >
                确认保存
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
