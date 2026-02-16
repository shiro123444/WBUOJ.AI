# WBUOJ.AI - AI Club Online Judge

一个现代化的在线评测系统，专为 AI 社团设计，集成 AI 辅助功能。

## 技术栈

### 前端
- **框架**: React 19 + TypeScript 5.9
- **构建工具**: Vite (rolldown-vite)
- **UI 组件**: HeroUI + TailwindCSS 4
- **状态管理**: Zustand
- **数据请求**: TanStack Query
- **路由**: React Router 7
- **代码编辑器**: Monaco Editor
- **3D 效果**: Three.js + React Three Fiber
- **数学公式**: KaTeX
- **Markdown**: react-markdown + remark-gfm

### 后端
- **运行时**: Node.js + TypeScript
- **框架**: Express 4
- **ORM**: Prisma 6
- **数据库**: PostgreSQL 16
- **缓存**: Redis 7
- **任务队列**: BullMQ
- **AI 集成**: OpenAI SDK / DeepSeek
- **验证**: Zod
- **安全**: Helmet + express-rate-limit

### 评测系统
- **沙箱**: go-judge (Docker 容器化)
- **支持语言**: C++, Python, Java, JavaScript, Go
- **对象存储**: MinIO (测试数据)

## 项目结构

```
ai-club-oj/
├── frontend/          # React 前端
├── backend/           # Express 后端
├── judge/             # 评测沙箱配置
└── docker-compose.yml # 基础设施服务
```

## 快速开始

### 环境要求
- Node.js >= 20
- pnpm >= 9 (推荐) 或 npm
- Docker & Docker Compose
- PostgreSQL 16 (或使用 Docker)
- Redis 7 (或使用 Docker)

### 1. 启动基础设施

```bash
docker compose up -d
```

这会启动 PostgreSQL、Redis、MinIO 和 go-judge 沙箱。

### 2. 后端配置

```bash
cd backend
cp .env.example .env  # 配置环境变量
pnpm install
pnpm db:generate      # 生成 Prisma Client
pnpm db:push          # 同步数据库 schema
pnpm db:seed          # 填充初始数据 (可选)
pnpm dev              # 启动开发服务器
```

### 3. 前端配置

```bash
cd frontend
pnpm install
pnpm dev              # 启动开发服务器 (默认 http://localhost:5173)
```

## 环境变量

### 后端 (.env)

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ai_club_oj"
REDIS_URL="redis://localhost:6379"
JWT_SECRET="your-jwt-secret"
OPENAI_API_KEY="your-openai-key"  # 可选，AI 功能
```

## 功能特性

### 已实现 ✅
- [x] 用户认证 (JWT + Cookie)
- [x] 题目管理 (CRUD + 标签)
- [x] 代码提交与评测
- [x] 多语言支持 (C++/Python/Java/JS/Go)
- [x] 实时评测状态 (WebSocket)
- [x] 题解与讨论区
- [x] 比赛系统
- [x] AI 对话辅助
- [x] 用户等级与积分系统
- [x] 签到与连续打卡
- [x] 公告系统
- [x] 管理后台

### 最新改进（2026-02）🚀
- 后端新增并统一挂载业务模块：签到、徽章、管理后台、讨论区、公告、排行榜、用户资料、比赛。
- 签到系统完善：连续签到奖励、里程碑奖励、经验值/积分累加、签到日历、积分历史接口。
- 徽章系统完善：预置徽章定义、自动发放检查、徽章概览接口、管理员初始化入口。
- 管理后台能力扩展：用户管理（角色/禁用/启用）、系统配置、统计概览、操作日志。
- 讨论区能力扩展：帖子 CRUD、回复树、点赞/点踩、置顶/锁定、分页与标签过滤。
- 公告系统能力扩展：优先级、置顶、发布/下线、已读追踪、未读数统计。
- 前端新增页面与路由：`/checkin`、`/admin`、`/discussions`、`/announcements` 及详情页。
- 前端视觉系统升级：新增 Liquid Glass 设计样式（玻璃卡片、渐变背景、骨架屏、动画过渡）。
- 代码层修正：`submission/solution` 等服务已开始进行 Prisma 命名体系（snake_case / 复数模型）对齐。

### 当前状态（构建检查）
- `backend` 执行 `npm run build` 仍有 TypeScript 错误，主要集中在 Prisma 字段命名迁移与部分导出/引用不一致。
- `frontend` 执行 `npm run build` 仍有 TypeScript 错误，主要集中在角色类型、字段命名与组件 props 对齐问题。
- 结论：功能模块已基本落地，但仍需一轮集中类型收敛与 Prisma 字段统一，才能稳定通过完整构建。

### TODO 📋
- [ ] GitHub OAuth 登录
- [ ] 邮箱验证
- [ ] 排行榜优化
- [ ] 题目导入/导出
- [ ] 代码高亮主题切换
- [ ] 移动端适配
- [ ] 国际化 (i18n)
- [ ] 性能监控 (APM)
- [ ] 单元测试覆盖率提升

## 开发命令

### 后端

```bash
pnpm dev          # 开发模式
pnpm build        # 构建
pnpm start        # 生产模式
pnpm db:studio    # Prisma Studio (数据库 GUI)
pnpm test         # 运行测试
```

### 前端

```bash
pnpm dev          # 开发模式
pnpm build        # 构建
pnpm preview      # 预览构建结果
pnpm test         # 运行测试
```

## 部署

### Docker 部署 (推荐)

```bash
docker compose -f docker-compose.prod.yml up -d
```

### 手动部署

1. 构建前端: `cd frontend && pnpm build`
2. 构建后端: `cd backend && pnpm build`
3. 配置 Nginx 反向代理
4. 使用 PM2 管理后端进程

## 贡献

欢迎提交 Issue 和 Pull Request！

## License

MIT
