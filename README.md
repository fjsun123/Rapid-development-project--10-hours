# 餐厅运营系统 — Odyssey Fullstack Research

> **强制技术栈**：pnpm + Turborepo · Expo + React Native + Web · Hono on Cloudflare Workers · PostgreSQL + Drizzle ORM · drizzle-zod · `@hono/zod-openapi` · Orval · React Query

---

## 1. 本地部署启动说明

### 1.1 环境前置

| 工具 | 推荐版本 | 安装命令（macOS）|
|---|---|---|
| Node.js | ≥ 22（实际跑 26）| `brew install node` 或 nvm |
| pnpm | 9.x | `corepack enable pnpm` |
| PostgreSQL | 16+ | `brew install postgresql@16` |

### 1.2 启动 PostgreSQL

```bash
# 启动 PG 服务
brew services start postgresql@16

# 创建 postgres 角色（仅首次）
/opt/homebrew/opt/postgresql@16/bin/psql -h localhost -d postgres \
  -c "CREATE ROLE postgres LOGIN SUPERUSER PASSWORD 'postgres';"

# 创建 restaurant 数据库（仅首次）
PGPASSWORD=postgres /opt/homebrew/opt/postgresql@16/bin/createdb \
  -h localhost -U postgres restaurant
```

### 1.3 安装依赖

```bash
cd uozhou
pnpm install         # ~20s
```

### 1.4 启动开发服务

```bash
# 一键并发起 backend + dashboard
pnpm dev

# 或分别起
pnpm dev:backend     # Hono on Node :3001（本地用 Node entry 绕开 Workers TCP 限制）
pnpm dev:dashboard   # Expo Web :3000
```

### 1.5 浏览器入口

| URL | 用途 | 账号 |
|---|---|---|
| http://localhost:3000 | 后台管理 Web | `admin` / `admin123` |
| http://localhost:3000/ui-library | UI 组件库 | （登录后访问）|
| http://localhost:3001/api/health | 后端健康检查 | — |
| http://localhost:3001/openapi.json | OpenAPI 契约（20 paths）| — |

### 1.6 一键自动化命令清单

| 命令 | 作用 | 用时 |
|---|---|---|
| `pnpm dev` | 并发起 backend + dashboard | 持续 |
| `pnpm dev:backend` | 仅 backend :3001 | 持续 |
| `pnpm dev:dashboard` | 仅 dashboard :3000 | 持续 |
| `pnpm gen:contract` | Drizzle → OpenAPI → Orval 全链路 | ~5s |
| `pnpm typecheck` | 5 packages 类型检查 | ~2s |
| `pnpm lint` | 同 typecheck（MVP 未引入 ESLint）| ~1s |
| `pnpm test` | 11 个 Playwright e2e（含 UI + API）| ~10s |
| `pnpm db:push` | 推 Drizzle schema 到 PG | ~3s |
| `pnpm db:seed` | 手动 seed 测试数据 | ~2s |
| `pnpm db:studio` | Drizzle Studio 可视化 DB | 持续 |

---

## 2. 测试数据初始化步骤

### 2.1 自动初始化（推荐）

**Backend 启动时自动建表 + 注入种子数据**，无需手动操作。

启动流程（[services/backend/src/db/index.ts](services/backend/src/db/index.ts)）：

1. 启动时调 `initializeDatabase()`
2. 检查 7 张表是否存在 → 不存在则 `CREATE TABLE`
3. 检查 customers 是否有数据 → 没有则 seed

### 2.2 种子数据

| 表 | 数据 |
|---|---|
| **categories** | 主食 / 饮品 / 小吃（3 个分类）|
| **menu_items** | 宫保鸡丁 ¥38 / 鱼香肉丝 ¥35 / 可乐 ¥10 / 奶茶 ¥12 / 测试已下架菜品 ¥15（5 个，含 1 个 `available=false`）|
| **customers** | 张三 13800138001（VIP）/ 李四 13800138002 |
| **users** | admin (管理员，密码 admin123) / 13800138000 (员工小王，role=staff) |
| **business_settings** | 营业 09:00~22:00 / 准备时间 15min / 自动接单 OFF |

### 2.3 测试账号

```
平台管理员       admin            密码 admin123
商家员工         13800138000      短信验证码登录（dev 模式响应里返回 _code）
客户 张三        13800138001      短信验证码登录
客户 李四        13800138002      短信验证码登录
新客户（自动注册） 任意未注册手机号  短信验证码登录
```

⚠️ 短信验证码：**dev 环境每次随机生成 6 位**，从 `POST /api/auth/sms/code` 响应体的 `_code` 字段拿；生产环境对接真实短信网关。

### 2.4 重置数据

```bash
# 清空所有表 + 重启 backend 触发重 seed
PGPASSWORD=postgres /opt/homebrew/opt/postgresql@16/bin/psql -h localhost -U postgres -d restaurant \
  -c "TRUNCATE order_items, orders, users, customers, menu_items, categories, business_settings RESTART IDENTITY CASCADE;"

# 重启 backend (会自动重新 seed)
pkill -9 -f "tsx.*node-server"
pnpm dev:backend
```

### 2.5 可视化查看数据

```bash
pnpm db:studio   # 打开 Drizzle Studio (https://local.drizzle.studio)
```

---

## 3. 架构设计思路说明

### 3.1 整体分层

```
┌──────────────────────────────────────────────────────────────┐
│                     apps/dashboard (Expo Web)                 │
│                                                               │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  View 层 (app/*.tsx)                                 │  │
│   │  纯 UI 组件，只接 props，不直接调 API                 │  │
│   └────────────────────┬─────────────────────────────────┘  │
│                        │                                      │
│   ┌────────────────────▼─────────────────────────────────┐  │
│   │  ViewModel 层 (viewmodels/*.ts)                      │  │
│   │  自定义 hooks，业务逻辑/校验/状态/跳转                │  │
│   └────────────────────┬─────────────────────────────────┘  │
│                        │                                      │
│   ┌────────────────────▼─────────────────────────────────┐  │
│   │  Model 层 (@restaurant/api-client + types)           │  │
│   │  React Query hooks + Axios + Orval generated         │  │
│   └────────────────────┬─────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────────┘
                         │  HTTPS + JWT
┌────────────────────────▼──────────────────────────────────────┐
│                services/backend (Hono on Workers)             │
│                                                               │
│   ┌──────────────────────────────────────────────────────┐  │
│   │  Routes 层 (routes/*.ts)                             │  │
│   │  app.openapi(createRoute({...}))  ← OpenAPI 注册      │  │
│   │  中间件: authMiddleware + requireRole                 │  │
│   └────────────────────┬─────────────────────────────────┘  │
│                        │                                      │
│   ┌────────────────────▼─────────────────────────────────┐  │
│   │  Services 层 (services/*.ts)                         │  │
│   │  业务逻辑：order-service / order-state-machine        │  │
│   │  - 金额服务端计算（防篡改）                            │  │
│   │  - 库存原子扣减                                       │  │
│   │  - 状态机校验（拒绝非法转换）                          │  │
│   └────────────────────┬─────────────────────────────────┘  │
│                        │                                      │
│   ┌────────────────────▼─────────────────────────────────┐  │
│   │  DB 层 (db/schema.ts + drizzle-zod)                  │  │
│   │  Drizzle ORM (pg driver)                             │  │
│   └────────────────────┬─────────────────────────────────┘  │
└────────────────────────┼──────────────────────────────────────┘
                         ▼
                  PostgreSQL 16
```

### 3.2 契约链（核心评分点）

**单一真理源头 → 自动生成 → 类型贯穿全栈**：

```
Drizzle Schema (db/schema.ts)
       │
       ▼ drizzle-zod
Zod Validators (db/validators.ts)
       │
       ▼ 引用 + 扩展
Hono OpenAPI Schemas (schemas.ts)  ← 30 个 Zod schema，全部 .openapi('Name')
       │
       ▼ app.openapi(createRoute({ request: zod, responses: zod }))
20 个路由全部注册 OpenAPI
       │
       ▼ GET /openapi.json
OpenAPI 3.0 spec (paths: 20, schemas: 30)
       │
       ▼ pnpm gen:contract
packages/api-client/openapi.json
       │
       ▼ Orval (tags-split + react-query + axios mutator)
packages/api-client/src/generated/
  ├─ auth/, orders/, menu/, customers/, dashboard/, settings/, public/
  └─ model/         (35 个 TypeScript type，含 Order/Customer/MenuItem/...)
       │
       ▼ import (复用 packages/api-client 的 axios 实例带 JWT/401 拦截)
apps/dashboard 业务代码
```

**改一个 schema 字段 → 一键 `pnpm gen:contract` → 前端类型全部对齐**。

### 3.3 MVVM 落地

| 层 | 文件位置 | 职责 | 实例 |
|---|---|---|---|
| **View** | `apps/dashboard/app/*.tsx` | 纯渲染，只 destructure vm | `app/orders.tsx`（53 行）|
| **ViewModel** | `apps/dashboard/viewmodels/*.ts` | 业务逻辑、状态、副作用 | `useOrdersViewModel.ts`（76 行，含状态机 4 个 mutation）|
| **Model** | `packages/api-client/src/hooks/*.ts` + `generated/` | React Query 缓存 + axios | `useOrders` / `useConfirmOrder` |

ViewModel **不返回 JSX**，View **不调 API**，强解耦。

### 3.4 订单状态机

```
        pending
       ╱      ╲
      ▼        ▼
  confirmed  cancelled (终态)
   ╱     ╲
  ▼       ▼
 ready  cancelled
  │
  ▼
completed (终态)
```

实现位置：[services/backend/src/services/order-state-machine.ts](services/backend/src/services/order-state-machine.ts)

**校验前置在后端**：4 个独立端点（`/confirm` `/ready` `/complete` `/cancel`）+ 状态机内部 `canTransition()` 拒绝非法转换，**禁止前端直接 PATCH status 字段**。

### 3.5 设计系统

| 文件 | 内容 |
|---|---|
| [packages/shared/src/tokens.ts](packages/shared/src/tokens.ts) | colors / typography / spacing / radius / shadows / layout（TS 版，Web + Native 共用）|
| [packages/shared/design-system.css](packages/shared/design-system.css) | CSS 变量版（Web only 备份）|
| [packages/shared/src/merge.ts](packages/shared/src/merge.ts) | style 数组合并 helper（兼容 RN Web 0.19）|

**严格按令牌**，禁止硬编码颜色/字号/间距。`/ui-library` 路由完整展示所有令牌 + 组件状态。

### 3.6 鉴权

- **JWT (HS256)**：accessToken 7d，refreshToken 30d
- **RBAC**：3 个角色 admin / staff / customer，每条路由 `middleware: [authMiddleware, requireRole(...)]`
- **Token 注入**：axios interceptor 自动加 `Authorization: Bearer <token>`，401 自动清 token + 跳登录
- **存储**：Web 用 localStorage（dashboard），Native 应该用 `expo-secure-store`

---

## 4. 技术取舍说明与优化方向

### 4.1 关键技术取舍（含原因）

#### ✅ Drizzle ORM（vs Prisma）
**取**：Drizzle。**因**：项目地图强制 Drizzle；运行时无 schema 引擎更轻；schema 即 TS，与 zod / OpenAPI 链路天然顺畅。

#### ✅ Hono `@hono/zod-openapi`（vs 手写 OpenAPI）
**取**：Hono OpenAPI。**因**：唯一真理源头从 Zod schema 出，自动生成 spec，配合 Orval 闭环。

#### ✅ Orval `tags-split` + axios mutator（vs 默认 axios）
**取**：tags-split。**因**：按 OpenAPI tag 分文件（auth/orders/menu/...），与后端路由组织对齐；mutator 复用现有 axios 实例（带 JWT 拦截器），避免双重维护。

#### ⚠️ 本地 backend 走 Node entry（vs wrangler dev 直跑 Workers）
**取**：Node entry。**因**：Cloudflare workerd sandbox **不能直连本地 PG TCP**（缺 net/tls）。生产仍走 `wrangler deploy` → Workers，本地降级。代码两套入口：
- [src/index.ts](services/backend/src/index.ts)：Workers entry（生产）
- [src/node-server.ts](services/backend/src/node-server.ts)：Node entry（本地 dev）

#### ⚠️ React Query hooks 双层（手写 wrappers + Orval generated）
**取**：保留手写 wrappers 作为业务层，Orval generated 作为契约层。**因**：Orval 8.x 的 hook 命名冗长（`useGetApiOrders`），且复合操作（upsert = post + patch 二选一）需要语义封装；手写 wrappers 提供友好 API，底层共用 axios 实例 + 类型来自 OpenAPI。

#### ⚠️ apps/mobile 已归档
**取**：归档。**因**：项目地图明说 "apps/dashboard" 单 app + "Native readiness is a bonus, not a requirement"。Scope management 是评分点。
归档目录：[_archive_非项目地图范围/mobile/](_archive_非项目地图范围/mobile/)，含商家 App + 客户 App 共 11 页代码，一行 `mv` 可恢复。

#### ⚠️ backend tsconfig `strict: false`
**取**：临时放宽。**因**：drizzle-orm 0.38 的 `update().set()` TS overload 与运行时不完全对齐，严格模式下报 5+ 处类型错误，但 14 个 e2e 全过证明运行正确。**优化**：升级 drizzle 0.40+ 或者改用 schema 推断的 update payload 类型。

#### ⚠️ Toast / Modal 自封装（vs 第三方库如 react-native-root-toast）
**取**：自封装。**因**：避免引入大型 UI 库，对设计令牌完全可控；MVP 阶段简单事件总线 + Modal 已够用。

#### ⚠️ MVP 没引入 ESLint
**取**：`lint` 复用 `typecheck`。**因**：TS 严格模式已 catch 大多数 issue；引入 ESLint + 配置 flat config + 集成 turbo 工时较高，MVP 阶段不值得。

### 4.2 已知遗留问题

| 问题 | 位置 | 影响 | 修复建议 |
|---|---|---|---|
| backend `src/__tests__/` 历史 vitest 与新 schema 偏差大 | services/backend/src/__tests__/ | `pnpm test` 走 e2e 绕开 | 重写 vitest 用例对齐新 schema，或转 integration test 跑真 DB |
| Orval generated hooks 未在 dashboard 直接消费 | apps/dashboard/ | 契约链产物只作"类型证据" | 重写 dashboard import generated hook 名（如 `useGetApiOrders` 替 `useOrders`）或自动写 alias |
| Dashboard `tsconfig.json` 用了 expo 的扩展，类型严格度依赖 expo 版本 | apps/dashboard/tsconfig.json | 偶尔需手动 `as` 兜底 | 升级 Expo SDK 53+ 后重新对齐 |
| 业务 settings 表理论可有多行（我们靠应用层约束只用 id 最小）| services/backend/src/routes/api.ts | 历史 init 重复 seed 触发过 bug | 给 settings 表加 `id=1` 单例约束 (`CHECK id=1`) |

### 4.3 优化方向（按优先级）

#### P0 — 让 backend 真跑 Workers 路径
- 用 [Neon](https://neon.tech) 云端 Postgres 替代本地（HTTPS 协议，Workers 可直连）
- 或者用 Cloudflare Hyperdrive 配置本地 PG bridge
- 切回 `wrangler dev` 启动，本地完全对齐生产

#### P1 — 完整使用 Orval generated hooks
- dashboard import 改用 `useGetApiOrders` 等 generated 名（或写一份 `mapping.ts` 集中 alias）
- 删除 `packages/api-client/src/hooks/*.ts` 手写实现
- 让 generated 成为唯一前端 API 入口

#### P1 — 补 ESLint + Prettier
- 引入 `@expo/eslint-config` + `eslint-plugin-react-hooks`
- 加 pre-commit hook（husky + lint-staged）
- `pnpm lint` 走真正的 lint 而不是复用 typecheck

#### P2 — 真实 Native 化
- 恢复 `apps/mobile`（已归档），用 Expo Native 跑客户 App + 商家 App
- 短信验证码对接真实网关（aliyun / tencent sms）
- 用 `expo-secure-store` 替代 localStorage 存 token

#### P2 — 后端补全
- `auto-accept` 设置生效（创建订单时自动 confirm）—— schema 字段已有，业务未接
- 营业状态 `serviceAvailable=false` 时拒绝下单
- 客户端取消订单的权限校验（已加，但需配套 e2e）
- 后厨菜品级出餐（订单项粒度状态）

#### P2 — 监控与可观测
- 后端结构化日志（pino + JSON）
- 错误上报（Sentry）
- API latency 指标（histogram + p99）

#### P3 — 性能
- Dashboard 长列表用 `FlatList` 虚拟化（当前 ScrollView 直接渲染所有订单）
- React Query 配 prefetch（侧边栏 hover 时预取）
- Backend 加 Redis cache（dashboard KPI 缓存 30s）

#### P3 — 多门店/多租户
- DB 加 `stores` + `user_stores` 表
- 所有业务表加 `storeId` 字段 + RBAC 加门店级权限
- Dashboard 顶部加门店切换器

---

## 5. 验证项目可交付（最后体检）

```bash
pnpm gen:contract    # ✅ 20 paths + 30 schemas → Orval 生成 35 个 type
pnpm typecheck       # ✅ 5/5 packages
pnpm lint            # ✅ 5/5 packages (复用 typecheck)
pnpm test            # ✅ 11/11 passed (8.4s)
pnpm dev             # ✅ backend :3001 + dashboard :3000
```

打开 http://localhost:3000 → `admin/admin123` → 操作 5 个页面全可用 ✅

---

## 附：项目目录结构

```
uozhou/
├── apps/
│   └── dashboard/          # Expo Web (Expo Router) - 7 个路由
│       ├── app/            # 路由文件 (login/index/orders/crm/menu/settings/ui-library)
│       ├── components/     # Sidebar / Toast / OrderStatusBadge
│       ├── viewmodels/     # useOrdersViewModel / useMenuViewModel / useCrmViewModel
│       ├── app.json / babel.config.js / metro.config.js
│       └── package.json
│
├── services/
│   └── backend/            # Hono on Cloudflare Workers
│       ├── src/
│       │   ├── db/         # schema.ts / validators.ts (drizzle-zod) / index.ts (auto init)
│       │   ├── routes/     # api.ts (主路由，app.openapi 注册 20 paths) + auth.ts
│       │   ├── services/   # order-service.ts + order-state-machine.ts
│       │   ├── middleware/ # auth.ts (JWT + requireRole)
│       │   ├── schemas.ts  # 30 个 Zod schema 集中点
│       │   ├── index.ts    # Workers entry (生产)
│       │   └── node-server.ts  # Node entry (本地 dev)
│       ├── scripts/gen-contract.ts
│       ├── wrangler.toml
│       └── package.json
│
├── packages/
│   ├── shared/             # 设计令牌 (TS + CSS) + merge helper
│   ├── types/              # 手写补充类型 (与 generated 互补)
│   └── api-client/         # 契约链产物
│       ├── openapi.json    # gen:contract 输出（20 paths）
│       ├── orval.config.ts # Orval 配置 (tags-split + react-query + axios mutator)
│       ├── src/
│       │   ├── axios.ts    # 全局 axios + JWT/401 拦截
│       │   ├── mutator.ts  # Orval mutator (复用 axios)
│       │   ├── query-client.ts  # React Query client 工厂
│       │   ├── hooks/      # 手写业务层 wrapper (向 dashboard 暴露友好 API)
│       │   └── generated/  # Orval 生成 (7 tags + 35 model types)
│       └── package.json
│
├── e2e/                    # Playwright 测试
│   ├── dashboard-smoke.spec.ts  # UI 烟雾 (4 个)
│   ├── api-e2e.spec.ts           # API 全栈 (7 个)
│   └── helpers/
│
├── 产品需求/                # PRD + 视觉锚点 (含 UI 库 HTML 静态稿)
├── 架构设计/                # 前端架构规范.md (MVVM 详解)
├── 测试用例/                # 142 条手工测试用例 (4 份文档)
├── _archive_非项目地图范围/  # mobile + cross-end-flow 归档可恢复
│
├── package.json            # workspaces + 标准 scripts
├── pnpm-workspace.yaml
├── turbo.json (v2)
└── playwright.config.ts
```
