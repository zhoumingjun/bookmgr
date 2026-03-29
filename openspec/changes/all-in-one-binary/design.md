## Context

Bookmgr 当前的部署架构依赖 Docker Compose 编排 4 个容器（PostgreSQL、Backend Go 服务、Frontend nginx、Kong 网关）。对于个人或小团队使用场景，这套架构部署门槛过高。

现有代码结构已具备良好的分层和 DI 基础：
- `cmd/server/main.go` 通过 fx.New 组装所有模块
- `database/database.go` 使用 `ent.Open("postgres", ...)` 连接 PostgreSQL
- `storage/` 已抽象为接口，LocalStorage 基于文件系统
- Chi router 已处理所有 HTTP 路由（health、upload/download、grpc-gateway mount）

目标是新增一个独立的 `cmd/standalone` 入口，复用现有业务逻辑层，仅替换基础设施层（数据库、静态文件服务）。

## Goals / Non-Goals

**Goals:**
- 产出单个可执行文件，包含前端、后端、SQLite，零外部依赖运行
- 通过 `--data-dir` 指定数据存储位置（SQLite 数据库文件 + 上传文件），默认 `./data`
- 通过 `--port` 指定监听端口，默认 8080
- 保持所有 API 端点 (`/api/v1/*`) 行为一致
- 支持 Linux/macOS/Windows 交叉编译（纯 Go，无 CGO）
- 现有 Docker 部署方式完全不受影响

**Non-Goals:**
- 不做数据库迁移工具（PostgreSQL ↔ SQLite 数据互导）
- 不支持运行时切换数据库类型（standalone 固定使用 SQLite）
- 不对前端代码做任何修改
- 不引入配置文件（保持 flag + 环境变量的简洁方式）
- 不做 Windows service / systemd 集成

## Decisions

### 1. SQLite 驱动选择：`modernc.org/sqlite` (纯 Go)

**选择**: 使用 `modernc.org/sqlite` 而非 `mattn/go-sqlite3`

**替代方案**:
- `mattn/go-sqlite3`: 成熟稳定，但依赖 CGO，交叉编译困难，不利于单文件分发
- `modernc.org/sqlite`: 纯 Go 实现，零 CGO 依赖，支持全平台交叉编译

**理由**: all-in-one 的核心价值是零依赖部署。CGO 会引入 C 编译器依赖和交叉编译复杂度，与目标相悖。Ent ORM 通过标准 `database/sql` 接口支持 SQLite dialect，无需修改 schema。

### 2. 数据库迁移策略：Ent Auto-Migrate

**选择**: standalone 模式下使用 `client.Schema.Create(ctx)` 自动建表，不复用 Atlas SQL 迁移

**替代方案**:
- 维护一套 SQLite 版本的 SQL 迁移文件：工作量大，两套迁移容易不同步
- 转写现有 PostgreSQL 迁移为 SQLite 兼容 SQL：UUID 类型、TIMESTAMPTZ 等不兼容，维护负担重

**理由**: standalone 模式面向轻量使用场景，Ent auto-migrate 能从 schema 定义直接创建/更新表结构，无需手工维护迁移文件。对于个人用户场景，auto-migrate 的 "只增不删" 策略是安全的。

### 3. 前端嵌入方式：`go:embed` + `io/fs`

**选择**: 在 `backend/embed/` 包中声明 `//go:embed frontend/dist/*`，构建时前端产物放到 `backend/frontend_dist/`（或通过构建脚本拷贝到嵌入路径）

**实际结构**:
```
backend/
  cmd/standalone/
    main.go          # standalone 入口
  embed/
    embed.go         # //go:embed frontend_dist
    frontend_dist/   # 构建时由脚本从 frontend/dist 拷贝
```

**路由策略**: Chi router 中，`/api/v1/*` 和 `/healthz` 走 API 处理，其余所有路径 fallback 到嵌入的静态文件（SPA 模式，404 返回 index.html）。

**替代方案**:
- 在项目根目录 embed：Go embed 只能嵌入当前包或子目录的文件，跨 module 不可行
- 运行时读取文件系统：失去"单文件"特性

### 4. 入口点策略：独立 `cmd/standalone`

**选择**: 新建 `backend/cmd/standalone/main.go`，与 `cmd/server/main.go` 并存

**理由**: 两种部署模式的基础设施模块不同（PostgreSQL vs SQLite、无静态文件 vs 嵌入静态文件），使用独立入口清晰地隔离差异。共享所有业务模块（handler、service、repository），仅替换 database module 和添加静态文件 serving。

### 5. CLI Flag 解析：标准库 `flag`

**选择**: 使用 Go 标准库 `flag` 包

**替代方案**: `cobra`、`pflag`、`urfave/cli` — 对于仅需 3-4 个参数的场景过于重量级

**参数设计**:
```
--data-dir   数据目录路径（SQLite DB + 上传文件），默认 ./data
--port       HTTP 监听端口，默认 8080
--jwt-secret JWT 签名密钥，默认生成随机值
--admin-pass 初始管理员密码，默认 changeme
```
同时支持对应的环境变量 `DATA_DIR`、`PORT`、`JWT_SECRET`、`ADMIN_PASSWORD`（flag 优先）。

### 6. 构建流程

```bash
# Makefile target
make standalone

# 等价于:
cd frontend && npm ci && npm run build     # 1. 构建前端
rm -rf backend/embed/frontend_dist         # 2. 清理旧产物
cp -r frontend/dist backend/embed/frontend_dist  # 3. 拷贝到嵌入路径
cd backend && go build -o ../bin/bookmgr ./cmd/standalone  # 4. 编译
```

## Risks / Trade-offs

**[SQLite 并发限制]** → SQLite 写锁是库级的，高并发写入会排队。→ *缓解*: standalone 面向个人/小团队（<10 并发用户），SQLite 足够。启用 WAL 模式提升并发读性能。

**[二进制体积增大]** → 嵌入前端资源和纯 Go SQLite 会增加约 20-30MB。→ *缓解*: 对于零依赖部署场景可接受。可用 `UPX` 压缩或 `-ldflags="-s -w"` 去符号表。

**[Ent auto-migrate 局限性]** → auto-migrate 只增加列/表，不会删除或修改已有列。→ *缓解*: standalone 用户数据量小，schema 变更时删除 SQLite 文件重建即可。

**[PostgreSQL SQL 与 SQLite 差异]** → 现有代码中如果有 PostgreSQL 特有 SQL（如 `$1` 占位符），SQLite 不兼容。→ *缓解*: 全部通过 Ent ORM 操作数据库，Ent 的 SQLite dialect 会自动处理 SQL 差异。检查 `database/database.go` 中的手写迁移 SQL 是否有引用（standalone 不走这条路径）。

**[UUID 类型]** → SQLite 没有原生 UUID 类型，Ent 会将其存为 TEXT。→ *缓解*: 功能无影响，仅存储格式不同。
