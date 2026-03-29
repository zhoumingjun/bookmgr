## 架构决策

### 1. 共享 Feature 文件

Feature 文件（中文 Gherkin）放在项目根目录 `features/`，E2E 和 API 层消费同一份 Gherkin。用标签区分层级：
- `@e2e-only`：仅 E2E 层执行（如 UI 交互、响应式布局）
- `@api-only`：仅 API 层执行（如参数校验、错误码验证）
- 无标签：两层都执行

### 2. E2E 层：Playwright + playwright-bdd

- `playwright-bdd` 的 `defineBddConfig()` 内置支持 `language: 'zh-CN'`
- `e2e/` 目录是独立 Node.js 项目，不污染前端生产依赖
- Auth fixture：通过 API 直接获取 JWT 注入 localStorage，避免每个场景都走 UI 登录
- 数据准备：通过 `helpers/api-client.ts` 直接 HTTP 调用创建测试数据

### 3. API 层：Go godog

- `github.com/cucumber/godog` 原生解析 `# language: zh-CN`
- 放在 `backend/test/bdd/`，使用 `//go:build bdd` 构建标签隔离
- Scenario state 模式：每个场景独立的 `TestClient`，包含 HTTP client、token、name-to-ID 映射
- `LoginAs("admin"|"user")` helper 封装认证流程

### 4. 环境管理

prod 和 test 环境通过 Docker Compose 项目名 + 端口完全隔离，可同时运行：

| 维度 | prod | test |
|------|------|------|
| 配置目录 | `ops/cd/prod/` | `ops/cd/test/` |
| Docker 项目名 | `bookmgr` | `bookmgr-test` |
| 对外端口 | 8000 | 9000 |
| 数据库 | `bookmgr` + 持久化卷 | `bookmgr_test` + tmpfs |
| 文件存储 | Docker volume | tmpfs（每次清空） |
| JWT 密钥 | 生产配置 | `test-secret-deterministic` |
| Admin 密码 | 生产配置 | `changeme` |

每个环境目录下的 `docker-compose.yml` 是完全独立的文件（非 overlay），通过 `scripts/env.sh` 统一管理。

### 5. 数据隔离

- 每个场景通过 Given 步骤调用 API 创建测试数据，无共享可变状态
- test 环境使用 tmpfs，每次 `env.sh test up` 都是干净的数据库
- 场景间不共享数据：每个场景创建唯一的测试用户/图书

## 项目结构

```
bookmgr/
├── features/                          # 共享中文 Gherkin（zh-CN）
│   ├── 认证/
│   │   ├── 注册.feature
│   │   └── 登录.feature
│   ├── 图书管理/
│   │   ├── 图书浏览.feature
│   │   ├── 图书详情.feature
│   │   ├── 图书增删改.feature
│   │   └── 图书上传下载.feature
│   ├── 用户管理/
│   │   ├── 用户列表.feature
│   │   ├── 用户编辑.feature
│   │   └── 用户删除.feature
│   ├── 权限控制/
│   │   └── 角色权限.feature
│   └── 界面布局/
│       ├── 导航栏.feature
│       └── 国际化.feature
│
├── e2e/                               # Playwright BDD
│   ├── playwright.config.ts
│   ├── package.json
│   ├── tsconfig.json
│   ├── fixtures/test-fixtures.ts      # authenticatedPage fixture
│   ├── steps/
│   │   ├── common.steps.ts
│   │   ├── auth.steps.ts
│   │   ├── book.steps.ts
│   │   ├── user.steps.ts
│   │   └── layout.steps.ts
│   ├── helpers/
│   │   ├── api-client.ts
│   │   └── test-data.ts
│   └── global-setup.ts
│
├── backend/test/bdd/                  # Go godog BDD
│   ├── features_test.go              # godog.TestSuite 入口
│   ├── steps/
│   │   ├── common_steps.go
│   │   ├── auth_steps.go
│   │   ├── book_steps.go
│   │   └── user_steps.go
│   ├── helpers/
│   │   ├── client.go
│   │   └── testdata.go
│   └── testdata/sample.pdf
│
├── ops/
│   └── cd/
│       ├── prod/
│       │   ├── docker-compose.yml
│       │   ├── .env.example
│       │   └── kong/kong.yml
│       └── test/
│           ├── docker-compose.yml
│           ├── .env
│           └── kong/kong.yml
│
└── scripts/
    └── env.sh                         # 环境管理脚本
```

## Feature 文件清单

| Feature 文件 | 场景数 | 层级 |
|---|---|---|
| 认证/注册.feature | 5 | 混合（2 E2E + 3 API） |
| 认证/登录.feature | 5 | 混合（3 E2E + 2 API） |
| 图书管理/图书浏览.feature | 4 | 混合 |
| 图书管理/图书详情.feature | 5 | 混合 |
| 图书管理/图书增删改.feature | 6 | 混合 |
| 图书管理/图书上传下载.feature | 4 | 混合 |
| 用户管理/用户列表.feature | 3 | 混合 |
| 用户管理/用户编辑.feature | 4 | 混合 |
| 用户管理/用户删除.feature | 4 | 混合 |
| 权限控制/角色权限.feature | 4 | 混合（含场景大纲） |
| 界面布局/导航栏.feature | 3 | E2E only |
| 界面布局/国际化.feature | 3 | E2E only |

**总计**: 12 个 Feature 文件，~50 个场景

## 管理脚本

```bash
# prod 环境
./scripts/env.sh prod up        # 启动 prod（端口 8000）
./scripts/env.sh prod down      # 停止 prod
./scripts/env.sh prod logs      # 查看日志
./scripts/env.sh prod rebuild   # 重建并启动

# test 环境
./scripts/env.sh test up        # 启动 test（端口 9000，干净数据）
./scripts/env.sh test down      # 停止 test
./scripts/env.sh test run       # up → 等待健康 → API BDD + E2E BDD → down
./scripts/env.sh test run-api   # 只跑 API BDD
./scripts/env.sh test run-e2e   # 只跑 E2E BDD

# 状态查看
./scripts/env.sh status         # 两个环境运行状态
```
