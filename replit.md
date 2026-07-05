# 喵屋 · 我的治愈小房间

A cozy pixel-art cat room + multiplayer isometric shopping game migrated from Next.js to Replit pnpm workspace.

## Run & Operate

- `pnpm --filter @workspace/miao-room run dev` — run the frontend (React + Vite, port from $PORT)
- `pnpm --filter @workspace/api-server run dev` — run the API server (Express, port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Required env: `VITE_LIVEBLOCKS_PUBLIC_KEY` — Liveblocks public key for multiplayer
- Required env: `SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN` — Shopify for the in-game shop

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite 7 (`artifacts/miao-room`)
- API: Express 5 (`artifacts/api-server`)
- Realtime: Liveblocks (`@liveblocks/client`, `@liveblocks/react`)
- Shopify Storefront API (GraphQL)
- Build: esbuild (CJS bundle for API)

## Where things live

- `artifacts/miao-room/src/components/room/` — CozyRoom (cat room scene, entry point)
- `artifacts/miao-room/src/components/game/` — Game (full isometric multiplayer Shopify game)
- `artifacts/miao-room/src/components/ui/` — Shared UI components
- `artifacts/miao-room/src/lib/shopify-client.ts` — Client-side Shopify fetch wrappers
- `artifacts/miao-room/src/lib/checkout.ts` — Client-side checkout helper
- `artifacts/miao-room/src/lib/liveblocks.config.ts` — Liveblocks config (uses VITE_ env var)
- `artifacts/api-server/src/routes/chat.ts` — `/api/chat/moderate` — text moderation + rate limiting
- `artifacts/api-server/src/routes/shop.ts` — `/api/shop/info`, `/api/shop/categories`, `/api/checkout`
- `artifacts/api-server/src/lib/game-data.ts` — Category metadata shared with shop routes

## Architecture decisions

- All Next.js `'use server'` / `'use client'` directives are harmless string literals in Vite — left in place, no side effects.
- Shopify is called server-side only (api-server routes) to keep the Storefront Access Token out of the browser bundle. The frontend calls `/api/shop/*` and `/api/checkout`.
- Liveblocks public key is exposed via `VITE_LIVEBLOCKS_PUBLIC_KEY` (Vite env var pattern).
- `SportShoe` is not in lucide-react; replaced with `Footprints`.
- `@base-ui/react` Button replaced with a standard React forwardRef button using class-variance-authority.
- Chat moderation route has in-process rate limiting (2 msgs/3s burst, 15 msgs/60s sustained per IP).

## Product

- **CozyRoom** — pixel art isometric cat room the user can click to explore; interactive items with hover states and tooltips.
- **Game** — full isometric multiplayer game with Liveblocks presence (see other players in real time), NPC shopkeeper stalls, Shopify cart/checkout, and in-game AI chat moderation.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- The Vite dev server must use `server.allowedHosts: true` (already set) for the Replit iframe proxy.
- API server reads `$PORT` env var for its port; defaults to 8080 in dev.
- Shopify routes gracefully fall back to empty/placeholder data when env vars are not set.
- `pnpm --filter @workspace/db run push` is in the default README but there is no DB in this project — ignore it.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
