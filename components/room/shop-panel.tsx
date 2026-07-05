'use client'

import { useState } from 'react'
import { ShoppingBag, Check } from 'lucide-react'
import { Panel } from './panel'
import { SHOP_ITEMS } from '@/lib/companion-data'

export function ShopPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [bought, setBought] = useState<Record<string, boolean>>({})

  return (
    <Panel open={open} onClose={onClose} title="喵屋小店" icon={<ShoppingBag className="size-5" />}>
      <p className="font-cute mb-3 text-sm text-muted-foreground">给小屋和猫咪添点温暖的小物吧～</p>
      <div className="grid grid-cols-2 gap-3">
        {SHOP_ITEMS.map((item) => {
          const owned = bought[item.id]
          return (
            <div
              key={item.id}
              className="flex flex-col rounded-3xl border-2 border-border bg-background/60 p-3"
            >
              <div
                className="mb-2 flex h-20 items-center justify-center rounded-2xl"
                style={{ backgroundColor: item.emojiColor + '55' }}
              >
                <span
                  className="size-10 rounded-xl border-2 border-border/60"
                  style={{ backgroundColor: item.emojiColor }}
                  aria-hidden="true"
                />
              </div>
              <h3 className="font-cute text-sm text-foreground">{item.name}</h3>
              <p className="mt-0.5 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
                {item.desc}
              </p>
              <button
                onClick={() => setBought((b) => ({ ...b, [item.id]: true }))}
                disabled={owned}
                className={`mt-2 flex items-center justify-center gap-1 rounded-full py-2 font-cute text-sm transition-all ${
                  owned
                    ? 'bg-accent/50 text-accent-foreground'
                    : 'bg-primary text-primary-foreground hover:brightness-105 active:scale-95'
                }`}
              >
                {owned ? (
                  <>
                    <Check className="size-4" /> 已带回家
                  </>
                ) : (
                  <>¥{item.price} 带走</>
                )}
              </button>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}
