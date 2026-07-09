# Contributing to Ghost Mail UI

感谢你对 Ghost Mail 前端的贡献！

## 开发环境

```bash
cd artifacts/miao-room
pnpm install
pnpm dev
```

开发服务器：`http://localhost:5173`

## 项目结构

```
src/
├── components/
│   ├── room/       # Cozy Room 陪伴空间
│   ├── game/       # 商店街游戏
│   └── ui/         # shadcn/ui 组件
├── lib/            # 工具库、API 封装
└── hooks/          # React Hooks
```

## 提交规范

同后端仓库，使用 [Conventional Commits](https://www.conventionalcommits.org/)。

示例：

```bash
git commit -m "feat(room): add letter reading animation"
git commit -m "fix(schedule): correct time format display"
```

## PR 流程

1. Fork 仓库
2. 创建分支：`git checkout -b feat/your-feature`
3. 开发 → 测试 → 提交
4. Push 并创建 PR

## 美术资源规范

- 像素风，与现有 `public/room/` 资源风格统一
- 角色立绘：512×512px PNG 透明底
- 物品图标：128×128px PNG 透明底
- 配色参考角色定义中的 `statColor`

## 报告问题

使用 GitHub Issues 报告 Bug 或功能建议。
