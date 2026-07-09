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

### API Integration
- `feat` — companion-api.ts wrapper for all backend endpoints
- `feat` — Character data definitions (companion-data.ts)
- `fix` — API_BASE path resolution for Vercel rewrite

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
