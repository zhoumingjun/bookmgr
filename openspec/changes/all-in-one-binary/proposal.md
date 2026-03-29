## Why

当前 bookmgr 部署需要 Docker Compose 编排 4 个容器（PostgreSQL、Backend、Frontend、Kong），对于个人用户或小团队场景过于重量级。需要一个零依赖的单文件发行版，下载即用，降低部署和运维门槛。

## What Changes

- **新增独立入口**: 新增 `backend/cmd/standalone/main.go`，作为 all-in-one 二进制的入口点，与现有 `cmd/server` 并存
- **嵌入前端静态资源**: 通过 `go:embed` 将前端构建产物嵌入 Go 二进制，由 Chi router 直接提供静态文件服务（替代 nginx + Kong）
- **SQLite 数据库支持**: 新增 SQLite 数据库驱动，作为 standalone 模式的默认数据库（需要 CGO 用于 go-sqlite3，或使用纯 Go 的 modernc.org/sqlite）
- **SQLite 迁移适配**: 将现有 PostgreSQL 迁移 SQL 转写为 SQLite 兼容版本，或使用 Ent 的 auto-migrate 能力
- **CLI 参数支持**: 通过命令行 flag 配置数据目录（`--data-dir`）、监听端口（`--port`）、JWT secret 等，同时保留环境变量支持
- **构建脚本**: 新增 Makefile target 或 build 脚本，一键完成前端构建 + Go 编译 + 嵌入打包
- 现有 Docker Compose 部署方式**不受影响**，`cmd/server` 保持不变

## Capabilities

### New Capabilities
- `sqlite-database`: SQLite 数据库驱动集成，包括连接管理、迁移执行、与 Ent ORM 适配
- `embed-frontend`: 前端静态资源嵌入和服务，通过 go:embed 打包 React 构建产物并由 Go HTTP server 直接提供
- `standalone-entrypoint`: 独立二进制入口点，包括 CLI flag 解析、数据目录初始化、统一 router（API + 静态文件）

### Modified Capabilities
（无现有 capability 的需求变更，所有变更为新增能力）

## Impact

- **代码**: 新增 `cmd/standalone/`、`database/sqlite.go`、`frontend/embed.go` 等文件，不修改现有 `cmd/server` 和 `database/database.go`
- **依赖**: 新增 `modernc.org/sqlite`（纯 Go SQLite 驱动，避免 CGO 依赖）或 `entgo.io/ent` 的 SQLite dialect
- **构建**: 需要先 `npm run build` 前端，再将 `frontend/dist/` 嵌入 Go 二进制；新增构建脚本协调两步
- **API**: 所有 REST API 端点保持不变（`/api/v1/*`），无 **BREAKING** 变更
- **数据库**: SQLite 模式使用独立的迁移文件，与 PostgreSQL 迁移互不影响
- **部署**: 产出单个二进制文件，运行时仅需指定一个数据目录，适用于 Linux/macOS/Windows 跨平台分发
