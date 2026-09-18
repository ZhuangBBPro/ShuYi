# 数占易术

一个基于 Vite + React + TypeScript 的轻量单页起卦工具。输入两个整数，可计算本卦、动爻、变卦与两个时空卦。

## 启动

```bash
pnpm install
pnpm dev
```

## 验证

```bash
pnpm test
pnpm build
```

## 自动化

`.github/workflows/deploy.yml` 会在推送到 `main` 或创建 Pull Request 时自动运行测试与构建。`main` 构建通过后会自动发布到 GitHub Pages。

## 目录

- `src/config.ts`：八卦与地支集中配置
- `src/lib/divination.ts`：核心计算逻辑
- `src/lib/divination.test.ts`：算法单元测试
- `src/App.tsx`：页面与交互
- `src/styles.css`：响应式视觉样式
