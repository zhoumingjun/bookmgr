# Proposal: 角色权限体系

## 状态
**Proposed** | 优先级: P0

## 背景与问题

bookmgr 线上绘本库当前系统缺乏角色权限控制：
- 所有用户注册后均为平等身份，无法区分管理员与普通用户
- 允许自主注册，任何人都能成为系统用户，安全边界不清
- 缺少教师/家长等业务角色，无法按业务职能分配不同操作权限
- JWT token 中无角色信息，API 无法根据用户身份做权限判断

当前系统只有 `user_service.proto` 中的 `User` 实体和基础登录接口，无法满足多角色绘本管理的业务需求。

## 目标

1. **4 级角色体系**：超级管理员 (super_admin) / 普通管理员 (admin) / 教师 (teacher) / 家长 (parent)
2. **关闭自主注册**：禁止 `/api/v1/users:register` 接口，由超级管理员统一创建用户
3. **JWT 权限控制**：Token claims 包含 `role` 字段，API 层根据 role 决定是否放行
4. **清晰的权限边界**：每级角色的可操作范围严格定义，互不越界

## MVP 范围

本次实现 **仅限角色管理和登录认证**，暂不涉及绘本业务功能（上传、审核、收藏、反馈等）。

MVP 交付物：
- `user_service.proto` 新增 CRUD 方法和 role 枚举
- `auth_service.proto` 移除 Register 方法
- `User` Ent schema 添加 `role` 和 `password_hash` 字段
- JWT 登录返回包含 `role` claim
- API 权限拦截（基于 role 的中间件）
- 前端登录页 + 管理员用户管理页
- BDD 测试覆盖 3 个 feature 文件

## 影响范围

| 层次 | 影响文件 | 修改内容 |
|------|---------|---------|
| Proto API | `api/bookmgr/v1/user_service.proto` | 新增 CreateUser、UpdateUser、DeleteUser、ListUsers；新增 Role 枚举 |
| Proto API | `api/bookmgr/v1/auth_service.proto` | 移除 Register RPC |
| Proto API | `api/bookmgr/v1/user.proto` | User 消息新增 role 字段 |
| Generated | `gen/` | 重新生成 Go 代码、gRPC、gateway、OpenAPI |
| Ent Schema | `backend/ent/schema/user.go` | 新增 role、password_hash 字段 |
| Handler | `backend/handler/` | 实现新的 user_service 方法 |
| Service | `backend/service/user.go` | 用户创建/修改/删除/列表业务逻辑 |
| Repository | `backend/repository/user.go` | Ent 查询封装 |
| Middleware | `backend/middleware/auth.go` | JWT 解析并注入 role 到 context |
| Middleware | 新增 `backend/middleware/rbac.go` | 基于 role 的权限拦截 |
| Config | `backend/config/` | 角色白名单配置 |
| Frontend | `frontend/src/auth/` | AuthContext 包含 role |
| Frontend | `frontend/src/pages/login/` | 登录页 |
| Frontend | `frontend/src/pages/admin/users/` | 用户管理页 |
| Tests | `e2e/features/role-permission/` | 3 个 BDD feature 文件 |

## 非目标（暂不实现）

- 绘本相关的角色权限（如教师可提交审核、家长可阅读等）
- 细粒度的资源级权限（如某本绘本只能某教师操作）
- 角色继承或权限组机制
- 多语言国际化
- 审计日志

## 验收标准

### 功能验收

1. 超级管理员可通过 API 创建 super_admin / admin / teacher / parent 四种角色用户
2. 普通管理员可通过 API 创建 teacher / parent 角色用户（不能创建管理员）
3. 超级管理员可修改任意用户的角色，普通管理员不可修改角色
4. 超级管理员可删除任意用户，普通管理员不可删除用户
5. 教师、家长无法访问任何用户管理 API（返回权限不足）
6. `/api/v1/users:register` 接口返回 404 或 403，不再开放注册
7. 用户登录成功后 JWT payload 包含 `role` 字段，值为角色名（小写字符串）
8. 前端登录后 AuthContext 正确保存 role，路由守卫根据 role 决定跳转

### 技术验收

9. `buf lint` 通过，AIP 规范检查通过
10. `buf breaking --against '.git#branch=main'` 无破坏性变更（本次为新增接口故无破坏性对比）
11. Ent migration diff 生成正确的 ALTER TABLE SQL
12. `go generate ./ent` 生成正确的 Ent 代码
13. `go test ./...` 全部通过
14. API BDD 测试全部通过（@api-only 标签）
15. E2E BDD 测试全部通过（@e2e-only 标签）

## 风险与依赖

- **风险 1**：现有数据库已有用户数据，需要 migration 脚本填充 role 字段（默认 teacher）
- **风险 2**：前端 AuthContext 需要较大改动，需确保与现有登录流程兼容
- **依赖**：无外部依赖，本身为 MVP 无前置依赖

## 实施计划

See `design.md` for implementation details.
