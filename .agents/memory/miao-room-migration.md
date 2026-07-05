---
name: Miao-room Next.js→Vite migration notes
description: Key decisions and sharp edges from migrating 喵屋 from Next.js to React+Vite on Replit
---

## Decisions

**'use client' / 'use server' directives** — These are harmless string literals in Vite. They are ignored at runtime and do NOT need to be removed. Leave them in place.

**Why:** Removing them would be churn with no benefit; they're valid JS string expressions.

**Shopify kept server-side** — Storefront Access Token is only used in `artifacts/api-server` (Express routes `/api/shop/*`, `/api/checkout`). The frontend only ever calls these API routes.

**Why:** Prevents the token from leaking into the Vite bundle/browser.

**Liveblocks env var** — `NEXT_PUBLIC_LIVEBLOCKS_PUBLIC_KEY` renamed to `VITE_LIVEBLOCKS_PUBLIC_KEY` in `src/lib/liveblocks.config.ts`.

**Why:** Vite requires the `VITE_` prefix to expose env vars to the client bundle.

## Sharp Edges

**`SportShoe` icon** — Does not exist in lucide-react. Replaced with `Footprints`.

**`@base-ui/react`** — Not installed (Next.js-only dep). Replaced Button with a standard React `forwardRef` + `class-variance-authority` button.

**Chat moderation** — Original Next.js route used the `ai` SDK + Gemini. Replit version uses simple regex sanitization + in-process rate limiting in Express (no AI SDK needed for basic moderation).

**Game vs Room** — App has two modes: `CozyRoom` (simple pixel room, entry point at `/`) and `Game` (full multiplayer Shopify isometric game). App.tsx routes only CozyRoom; Game can be reached if wired up separately.
