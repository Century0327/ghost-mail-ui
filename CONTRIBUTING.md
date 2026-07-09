# Contributing to Ghost Mail UI — AI Coding Assistant Guide

> This document is optimized for AI coding assistants (GitHub Copilot, Cursor, etc.).
> It defines strict conventions that must be followed when generating or modifying code.

## Project Architecture (Decision Tree)

```
src/
├── components/
│   ├── room/           # Cozy Room ONLY — character interaction, letters, schedules
│   ├── game/           # Shopify store street ONLY — isometric shop UI
│   └── ui/             # shadcn/ui base components — NEVER add business logic here
├── lib/
│   ├── companion-api.ts    # ALL backend API calls go through this
│   ├── companion-data.ts   # Character definitions, static data
│   ├── game-data.ts        # Shop/Item static data
│   └── shopify-client.ts   # Shopify API ONLY
├── hooks/              # Custom React hooks — must start with 'use'
└── pages/              # Route-level components
```

**Rule: When adding a new feature, ask:**
1. Is it character/letter/schedule/shop related? → `components/room/`
2. Is it Shopify store related? → `components/game/`
3. Is it a reusable UI primitive? → `components/ui/`
4. Is it shared logic? → `hooks/` or `lib/`

## Component Development Rules

### 1. File Naming

| Type | Naming | Example |
|------|--------|---------|
| React Component | PascalCase.tsx | `SchedulePanel.tsx` |
| Component folder (multi-file) | kebab-case/ | `schedule-panel/` |
| Hook | useCamelCase.ts | `useCharacterState.ts` |
| Utility | camelCase.ts | `formatDate.ts` |
| Type definition | PascalCase.ts | `CharacterType.ts` |

### 2. Component Structure Template

```tsx
// Every room component MUST follow this pattern:
import { useState, useEffect } from 'react';
import { companionApi } from '@/lib/companion-api';
import type { Character } from '@/lib/companion-data';

interface ComponentNameProps {
  characterId: string;
  // NEVER use 'any' — always define interfaces
}

export function ComponentName({ characterId }: ComponentNameProps) {
  // State: use useState for UI state, use companionApi for server state
  const [localState, setLocalState] = useState(false);
  
  // API calls: ALWAYS use companionApi wrapper, NEVER fetch directly
  const { data, isLoading } = companionApi.useSchedules(characterId);
  
  return (
    <div className="room-panel">
      {/* UI content */}
    </div>
  );
}
```

### 3. Props Interface Rules

```typescript
// ✅ CORRECT — explicit, no any
interface ScheduleItemProps {
  time: string;           // Format: "HH:MM" 24h
  activity: string;
  location?: string;      // Optional = ?
  done: boolean;
  onToggle: (id: string) => void;  // Callbacks always typed
}

// ❌ WRONG — vague types
interface BadProps {
  data: any;              // NEVER use any
  callback: Function;     // NEVER use Function
}
```

### 4. State Management Rules

| State Type | Where | How |
|-----------|-------|-----|
| Server state (API data) | companion-api.ts | React Query pattern (useQuery/useMutation) |
| UI state (modal open, tab) | Component local | useState |
| User preferences (sound, theme) | localStorage | Via electron-store in desktop / localStorage in web |
| Character progress (affection, items) | Backend ONLY | NEVER store in localStorage — always sync via API |

**CRITICAL: Character state (好感度, 位置, 心情) is server-authoritative.**
- Read: `GET /api/companion/user/characters/{id}/status`
- Write: `POST /api/companion/user/characters/{id}/interact`
- NEVER cache character state locally without invalidation

### 5. API Call Pattern

```typescript
// lib/companion-api.ts defines the contract.
// ALL components MUST use these wrappers:

// ✅ CORRECT
const { data: letters } = companionApi.useLetters(characterId);
const mutate = companionApi.useSendLetter();

// ❌ WRONG — never call fetch directly
fetch('/api/companion/letters');
```

### 6. Styling Rules (Pixel Art Theme)

**Color System — ONLY these colors:**

| Token | Hex | Usage |
|-------|-----|-------|
| `--color-kitty` | `#e8a0a0` | Kitty theme elements |
| `--color-puppy` | `#d4b896` | Puppy theme elements |
| `--color-foxy` | `#c9785c` | Foxy theme elements |
| `--color-birb` | `#a0c4d9` | Birb theme elements |
| `--color-bg` | `#efe2d2` | Room background |
| `--color-panel` | `#faf6f0` | Panel/card backgrounds |
| `--color-text` | `#4a3f35` | Primary text |
| `--color-text-muted` | `#8c7e6b` | Secondary text |

**Spacing System — pixel grid:**
- Base unit: 4px
- sm: 8px (2 units)
- md: 16px (4 units)
- lg: 24px (6 units)
- xl: 32px (8 units)

**Border Radius:**
- UI panels: `8px` (soft)
- Buttons: `12px` (pill-like)
- Avatars: `50%` (circular)
- NEVER use `2px` or `4px` — too sharp for cozy theme

### 7. shadcn/ui Extension Rules

```tsx
// When extending shadcn/ui components:
// 1. Copy from components/ui/ as base
// 2. Add pixel-art specific classes
// 3. Export from components/ui/ (don't create parallel structure)

// ✅ CORRECT: Extended Button for pixel theme
export const PixelButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<typeof Button>
>(({ className, ...props }, ref) => (
  <Button
    ref={ref}
    className={cn(
      'rounded-xl border-2 border-amber-800/20 shadow-pixel',
      className
    )}
    {...props}
  />
));
```

## File Location Decision Matrix

| What you're adding | Where | Why |
|-------------------|-------|-----|
| New character interaction feature | `components/room/` | Room is the core experience |
| New shop/item | `components/room/shop-panel.tsx` OR `lib/game-data.ts` | Static data goes to lib, UI goes to components |
| New API endpoint wrapper | `lib/companion-api.ts` | Centralized API layer |
| New reusable animation | `components/ui/` | If used by multiple features |
| Character stat calculation | DON'T — use backend | Frontend NEVER calculates 好感度 |
| Image asset | `public/room/` | Vite serves public/ as root |

## Testing Checklist (Before Commit)

```markdown
- [ ] TypeScript compiles without errors (`pnpm build`)
- [ ] Component renders in both light/dark mode (if applicable)
- [ ] API calls use companionApi wrapper (not raw fetch)
- [ ] No `any` types in props
- [ ] Character state is read from API, not localStorage
- [ ] Pixel colors used from design system (not hardcoded hex)
```

## Commit Message Convention

Same as backend: `type(scope): subject`

| Scope | Usage |
|-------|-------|
| `room` | Cozy Room components |
| `game` | Shopify store components |
| `api` | companion-api.ts changes |
| `ui` | shadcn/ui or design system |
| `asset` | Images, icons, fonts |

Examples:
```bash
feat(room): add letter reading animation
docs(ui): update pixel color tokens
fix(api): correct schedule endpoint URL
```
