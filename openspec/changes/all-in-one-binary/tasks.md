## 1. SQLite 数据库支持

- [x] 1.1 添加 `modernc.org/sqlite` 和 Ent SQLite dialect 依赖到 `backend/go.mod`
- [x] 1.2 创建 `backend/database/sqlite.go`：提供 `NewSQLiteEntClient(cfg)` 函数，连接 `<data-dir>/bookmgr.db`，启用 WAL 模式，使用 `client.Schema.Create(ctx)` 自动建表
- [x] 1.3 创建 `backend/database/sqlite_module.go`：导出 `SQLiteModule` fx.Options，提供 SQLite 版的 `*ent.Client`

## 2. 前端资源嵌入

- [x] 2.1 创建 `backend/embed/embed.go`：声明 `//go:embed frontend_dist/*` 并导出 `FS` 变量（`embed.FS`）
- [x] 2.2 创建 `backend/embed/frontend_dist/.gitkeep` 占位文件，确保目录存在于 git 中
- [x] 2.3 创建 `backend/embed/handler.go`：实现 SPA 静态文件 handler —— 精确匹配静态资源返回文件，其余路径 fallback 到 `index.html`

## 3. Standalone 入口点

- [x] 3.1 创建 `backend/cmd/standalone/main.go`：使用 `flag` 包解析 `--data-dir`、`--port`、`--jwt-secret`、`--admin-pass`，同时支持环境变量回退
- [x] 3.2 组装 fx.New：复用 handler/service/repository/middleware/grpcserver 模块，替换 database.Module 为 database.SQLiteModule，添加嵌入前端的静态文件路由
- [x] 3.3 创建 standalone 版 `NewRouter`：在现有 API 路由基础上，挂载 embed handler 作为 fallback 处理所有非 API 路径
- [x] 3.4 实现数据目录初始化逻辑：启动时创建 `<data-dir>/` 和 `<data-dir>/uploads/` 目录
- [x] 3.5 实现随机 JWT secret 生成（未指定时）并输出警告日志

## 4. 构建流程

- [x] 4.1 创建项目根目录 `Makefile`：添加 `standalone` target，编排前端构建 → 拷贝 dist → Go 编译
- [x] 4.2 在 Makefile 中添加 `clean` target 清理 `backend/embed/frontend_dist/` 和 `bin/`
- [x] 4.3 在 `.gitignore` 中添加 `backend/embed/frontend_dist/`（除 .gitkeep）和 `bin/`

## 5. 验证测试

- [x] 5.1 本地执行 `make standalone` 确认构建成功，产出 `bin/bookmgr`
- [x] 5.2 运行 `./bin/bookmgr --data-dir /tmp/bookmgr-test` 验证启动、建表、admin seed
- [x] 5.3 浏览器访问 `http://localhost:8080` 验证前端页面加载正常
- [x] 5.4 通过前端登录 admin 账号，验证 API 调用正常（用户列表、图书 CRUD）
- [x] 5.5 验证现有 Docker Compose 部署（`./scripts/env.sh prod up`）不受影响
