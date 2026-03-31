# 提案：绘本审核流程 (05-book-review)

## 1. 背景

bookmgr 线上绘本库当前缺少内容审核机制，任何用户创建绘本后即可直接上架展示。在教育场景下，
绘本内容的质量、适龄性和合规性至关重要。引入审核流程可以：

- 确保绘本内容符合平台规范（无违规信息、图文质量达标、适龄分级准确）
- 防止劣质或不当内容直接暴露给终端用户
- 为管理员提供可追溯的审核记录，明确责任归属
- 支持多角色协作：教师/家长创作绘本，专业管理员审核把关

## 2. 审核状态机

绘本（Book）新增 `status` 字段，支持以下状态及转换：

```
draft ──提交审核──→ pending ──审核通过──→ approved
                          ↘审核拒绝↗
                            rejected
                            │
                     重新提交──→ pending
                                   │
                     超级管理员打回──→ rejected（approved 也可打回）
```

| 状态 | 含义 | 可执行操作 | 可编辑 |
|------|------|----------|--------|
| `draft` | 草稿，未提交 | 提交审核 | 是 |
| `pending` | 待审核，已提交 | 审核通过 / 审核拒绝 / 撤回 | 否 |
| `approved` | 已通过，可展示 | 超级管理员打回 | 否 |
| `rejected` | 已拒绝，附原因 | 重新提交 | 是 |

状态机规则：

1. `draft` → `pending`：仅绘本的创建者可发起
2. `pending` → `approved` / `rejected`：仅管理员可操作
3. `rejected` → `pending`：仅绘本创建者可重新提交
4. `approved` → `rejected`：仅超级管理员可操作（特殊复核权限）
5. `pending` → `draft`：撤回，仅提交人可操作

## 3. MVP 范围

### 包含
- Book 表新增 `status` 字段（draft/pending/approved/rejected），默认 `draft`
- BookReview 表（审核记录）：记录每次状态变更的来源、目标、原因、时间、操作人
- 4 个审核操作 API：提交审核、审核通过、审核拒绝、撤回审核
- 审核历史记录查询 API
- 完整的权限控制（角色 + 身份校验）
- BDD 测试覆盖状态机所有合法/非法转换

### 不包含
- 审核超时自动提醒
- 审核队列和优先级排序
- 批量审核操作
- 审核状态变更的通知推送

## 4. 影响范围

### 数据模型变更

#### Book 表（修改）
- 新增 `status` 字段：`VARCHAR(20) DEFAULT 'draft'`，枚举值同状态机
- 审核相关字段（可选先行设计）：
  - `submitter_id`（FK）：记录最后提交审核的用户
  - `current_reviewer_id`（FK）：当前审核人

#### BookReview 表（新增）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | UUID | 主键 |
| book_id | UUID | FK → Book |
| reviewer_id | UUID | FK → User（审核操作人） |
| status_from | VARCHAR(20) | 状态来源 |
| status_to | VARCHAR(20) | 状态目标 |
| reason | TEXT | 审核意见/拒绝原因，可为空 |
| reviewed_at | TIMESTAMP | 操作时间 |
| created_by | UUID | FK → User（提交审核时记录） |

### 服务层变更

- `service/book_review.go`：审核业务逻辑、状态机校验
- `repository/book_review.go`：BookReview 的 CRUD + 按 book_id 查询
- `handler/book_review.go`：gRPC service 实现
- `middleware/auth.go`：增强角色判断逻辑

### 前端变更

- 管理员审核列表页（`/admin/reviews`）
- 绘本审核详情/操作弹窗（通过/拒绝/打回按钮 + 理由输入）
- 用户端提交审核按钮（草稿页）
- 审核历史记录展示

## 5. 验收标准

### 功能验收

- [ ] Book 初始 status 为 `draft`，创建后不可见
- [ ] 仅创建者可提交审核（draft → pending）
- [ ] pending 状态下绘本不可编辑
- [ ] 仅管理员可审核（pending → approved/rejected）
- [ ] 拒绝时必须填写 reason
- [ ] 仅提交人可撤回（pending → draft）
- [ ] rejected 绘本仅创建者可重新提交（rejected → pending）
- [ ] 仅超级管理员可打回已通过绘本（approved → rejected）
- [ ] 每次状态变更均生成 BookReview 记录
- [ ] 审核历史记录 API 返回正确的变更链

### 权限验收

- [ ] 教师/家长：无法审核他人的绘本
- [ ] 普通管理员：无法打回超级管理员审核的绘本（后续扩展）
- [ ] 超级管理员：可复核任意审核决定
- [ ] 未登录用户：无法调用任何审核 API

### API 验收

- [ ] POST /api/v1/books/{book}:submit 返回 200（draft→pending）
- [ ] POST /api/v1/books/{book}:approve 返回 200（pending→approved）
- [ ] POST /api/v1/books/{book}:reject 返回 200（pending→rejected），reason 必填
- [ ] POST /api/v1/books/{book}:recall 返回 200（pending→draft）
- [ ] GET /api/v1/books/{book}/reviews 返回审核历史列表

### BDD 验收

- [ ] 状态机所有合法转换均通过 @api-only feature 测试
- [ ] 权限越界场景（@e2e）正确返回 403
- [ ] 非法状态转换返回 409 Conflict
