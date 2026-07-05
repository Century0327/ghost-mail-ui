import type { Category, CategoryMeta, Product } from './game-data'
import { CATEGORY_META } from './game-data'

export type ShopInfo = { name: string; description: string | null }

export async function getShopInfo(): Promise<ShopInfo> {
  try {
    const res = await fetch('/api/shop/info')
    if (!res.ok) return { name: 'Fashion District', description: null }
    return await res.json()
  } catch {
    return { name: 'Fashion District', description: null }
  }
}

export async function getCategoriesWithProducts(): Promise<Category[]> {
  try {
    const res = await fetch('/api/shop/categories')
    if (!res.ok) return CATEGORY_META.map((m) => ({ ...m, products: [] }))
    return await res.json()
  } catch {
    return CATEGORY_META.map((m) => ({ ...m, products: [] }))
  }
}
