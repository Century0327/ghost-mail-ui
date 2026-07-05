export type CategoryMeta = {
  id: string
  handle: string
  name: string
  npcName: string
  greeting: string
  color: string
  icon: string
  tile: { x: number; y: number }
  swatch: string
}

export const CATEGORY_META: CategoryMeta[] = [
  { id: 'shoes', handle: 'shoes', name: 'Shoes', npcName: 'Sole, the sneaker guide', greeting: 'Fresh pairs just landed.', color: '#3e9bd6', icon: 'shoe', tile: { x: 2, y: 2 }, swatch: '#3e9bd6' },
  { id: 'shirts', handle: 'shirts', name: 'Shirts', npcName: 'Tess, the print maker', greeting: 'Soft tees, crisp shirts.', color: '#e0598b', icon: 'shirt', tile: { x: 9, y: 2 }, swatch: '#e0598b' },
  { id: 'hoodies', handle: 'hoodies', name: 'Hoodies', npcName: 'Hood, the fleece curator', greeting: 'Cozy layer season is always open.', color: '#9b6bd6', icon: 'hoodie', tile: { x: 16, y: 2 }, swatch: '#9b6bd6' },
  { id: 'pants', handle: 'pants', name: 'Pants', npcName: 'Denim, the fit specialist', greeting: 'Straight, relaxed, cargo, or tapered.', color: '#315476', icon: 'pants', tile: { x: 2, y: 9 }, swatch: '#315476' },
  { id: 'hats', handle: 'hats', name: 'Hats', npcName: 'Cap, the hat keeper', greeting: 'Caps, beanies, and brims.', color: '#e0c23e', icon: 'hat', tile: { x: 9, y: 9 }, swatch: '#e0c23e' },
  { id: 'bags', handle: 'bags', name: 'Bags', npcName: 'Carry, the pack designer', greeting: 'Daily carry, weekend carry.', color: '#e0823e', icon: 'bag', tile: { x: 16, y: 9 }, swatch: '#e0823e' },
]
