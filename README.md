# MindReminder

基于间隔重复算法的智能复习桌面应用

## 技术栈

- **框架**: Electron + Vite
- **前端**: React 19 + TypeScript
- **UI库**: Ant Design 6
- **数据库**: SQLite (better-sqlite3)
- **状态管理**: Zustand

## 开发环境要求

- Node.js 18+
- pnpm 8+
- Windows 10+ / macOS 10.14+

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 启动开发服务器

```bash
pnpm dev
```

### 构建生产版本

```bash
pnpm build
```

### 预览生产版本

```bash
pnpm preview
```

## 项目结构

```
MindReminder/
├── src/
│   ├── main/           # 主进程代码
│   │   ├── index.ts    # 主进程入口
│   │   ├── services/   # 业务服务
│   │   └── repositories/ # 数据访问层
│   ├── renderer/       # 渲染进程代码
│   │   └── src/        # React应用
│   └── preload/        # 预加载脚本
│       └── index.ts    # Context Bridge
├── docs/               # 项目文档
├── electron.vite.config.ts
├── package.json
└── tsconfig.json
```

## 开发规范

- 遵循TypeScript严格模式
- 使用ESLint和Prettier格式化代码
- 提交前运行`pnpm build`确保编译通过

## 文档

- [PRD文档](docs/prd.md)
- [架构文档](docs/architecture.md)
- [Epic和Stories](docs/stories/README.md)
- [Sprint计划](docs/sprint-artifacts/sprint-1-plan.md)

## License

MIT
