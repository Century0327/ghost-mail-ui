# Changelog — Ghost Mail UI

> Changelog for AI tracking. Categorized by component scope for easy parsing.

## [Unreleased]

### Room (Cozy Room)
- `feat` — Initial Cozy Room layout with isometric perspective
- `feat` — Character selector with 4 characters (Kitty, Puppy, Foxy, Birb)
- `feat` — Schedule panel with real-time status flow
- `feat` — Memories panel with letter categorization (all/favorite/event)
- `feat` — Album panel for attachment collection
- `feat` — Shop panel with item purchase
- `feat` — Character click interaction (drag, bubble dialog)
- `fix` — Tab switching overlap in memories panel
- `refactor` — 商店系统重构：移除购物车，改为点击预览/预购买模式
- `feat` — 物品布局持久化到 localStorage
- `feat` — 关闭商店时未保存更改提示
- `fix` — 信件图片相对路径未转换为后端完整URL导致加载失败
- `fix` — 批量购买接口走 Vercel rewrite 代理，解决 CORS 导致的支付失败

### API Integration
- `feat` — companion-api.ts wrapper for all backend endpoints
- `feat` — Character data definitions (companion-data.ts)
- `fix` — API_BASE path resolution for Vercel rewrite
- `fix` — buyItems 添加错误处理，避免异常直接抛出
- `feat` — 资源URL自动补全函数 resolveAssetUrl

### Game (Shopify Store)
- `feat` — Isometric store street with 6 shops
- `feat` — Shop dialog with product display
- `feat` — Cart panel with checkout flow

### UI System
- `feat` — shadcn/ui component library setup
- `feat` — Pixel-art color tokens (Tailwind config)
- `feat` — Game cursor (SVG paw)

### Build & Deploy
- `feat` — Vite + React 19 + TypeScript setup
- `feat` — Vercel deployment config (vercel.json)
- `feat` — Electron renderer integration (pet.html)

## [0.1.0] - 2026-07-09

### Initial Release
- Project scaffold with pnpm monorepo
- Tailwind CSS 4 + shadcn/ui
- wouter routing
