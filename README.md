# 🐾 Ghost Mail UI — AI 幽灵邮件 Web 前端

> 与 AI 角色的 Web 交互空间。接收信件、查看日程、收藏附件、培养关系。

## 核心概念

Ghost Mail UI 是 Ghost Mail 系统的 Web 前端。它不只是"查看邮件"——它是一个**虚拟角色的陪伴空间**。

### 两大模式

1. **Shopify 商店街**（`components/game/`）
   - 等距视角的像素风商店街
   - 6 家店铺：鞋子、衬衫、卫衣、裤子、帽子、包包
   - 连接 Shopify Storefront API，实时拉取商品数据
   - 支持购物车、结账

2. **Cozy Room 陪伴空间**（`components/room/`）
   - 与 AI 角色互动的温馨房间
   - 角色选择器、状态面板、日程面板、记忆面板、商店面板
   - 点击互动、拖拽移动、气泡对话

### 核心功能（连接后端）

| 功能 | 说明 | 后端 API |
|------|------|---------|
| **信件收件箱** | 查看 AI 角色发来的邮件历史 | 待接入 `/api/companion/letters` |
| **角色日程** | 查看角色今天/明天的活动安排 | `/api/companion/user/characters/{id}/status` |
| **对话记忆** | 查看与角色的历史对话 | 待接入 `/api/companion/conversations` |
| **附件相册** | 收藏 AI 生成的图片附件 | 待接入 `/api/companion/attachments` |
| **关系值** | 查看角色与你的关系值 | 待接入 `/api/companion/user/characters/{id}/status` |
| **角色状态** | 角色位置、心情、状态值 | `/api/companion/characters` + 本地状态 |
| **手动触发** | 在 Web 端让 AI 立即发一封信 | 待接入 `/api/dispatch` |

## 技术栈

- **框架**：React 19 + TypeScript + Vite
- **路由**：wouter
- **样式**：Tailwind CSS 4 + shadcn/ui
- **状态**：localStorage（本地状态）+ 后端 API（云端配置）
- **部署**：Vercel

## 目录结构

```
src/
├── App.tsx              # 路由入口
├── main.tsx             # 应用挂载
├── pages/
│   └── not-found.tsx
├── components/
│   ├── game/            # 商店街游戏（Shopify 集成）
│   │   ├── game.tsx
│   │   ├── shop-dialog.tsx
│   │   └── cart-panel.tsx
│   ├── room/            # Cozy Room 陪伴空间
│   │   ├── cozy-room.tsx         # 主房间
│   │   ├── character-selector.tsx # 角色选择
│   │   ├── schedule-panel.tsx   # 日程面板
│   │   ├── memories-panel.tsx   # 记忆面板
│   │   ├── album-panel.tsx      # 相册/附件收藏
│   │   ├── shop-panel.tsx       # 商店面板
│   │   └── ...
│   └── ui/              # shadcn/ui 组件
├── lib/
│   ├── companion-api.ts     # 陪伴系统 API 封装
│   ├── companion-data.ts  # 角色数据定义
│   ├── game-data.ts       # 商店街数据
│   ├── shopify-client.ts  # Shopify API 客户端
│   └── checkout.ts        # 结账逻辑
└── hooks/
    └── ...
```

## 部署

```bash
cd artifacts/miao-room
pnpm install
pnpm run build
```

Vercel 设置：
- **Root Directory**：`artifacts/miao-room`
- **Build Command**：`pnpm run build`
- **Output Directory**：`dist/public`

## API 连接

前端通过 `vercel.json` rewrite 代理到后端：

```json
{
  "rewrites": [
    { "source": "/api/companion/:path*", "destination": "https://random-ai-mail-ghost.vercel.app/api/companion/:path*" },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

前端调用相对路径 `/api/companion/characters`，Vercel 自动代理到后端。

## 本地开发

```bash
pnpm install
pnpm run dev
```

开发服务器：`http://localhost:5173`

## 与后端的关系

前端负责展示和交互，后端负责 AI 计算和邮件调度：

```
前端 (Vercel)          后端 (Vercel Flask)
   │                          │
   │  GET /api/companion/...  │
   │─────────────────────────►│
   │                          │
   │  角色列表、日程、状态      │
   │◄─────────────────────────│
   │                          │
   │  POST /api/dispatch      │
   │─────────────────────────►│  GitHub Actions
   │                          │  触发 AI 发信
```

## 待实现功能

- [ ] 信件收件箱（展示 AI 发来的邮件历史）
- [ ] 对话记忆同步（读取后端 conversation.enc）
- [ ] 附件相册（展示 AI 生成的图片）
- [ ] 关系值可视化（从后端获取实时关系值）
- [ ] 手动触发发信按钮（调用 `/api/dispatch`）
- [ ] 用户认证（当前用 device_id 匿名标识）
