# 提案：维度分类管理 (02-dimension-category)

## 状态

| 字段 | 值 |
|------|-----|
| 类型 | feature |
| 状态 | proposed |
| 优先级 | P1（第二批次，依赖角色权限体系） |
| 负责人 | bookmgr team |
| 依赖 | 01-role-permission |

---

## 1. 背景与目标

### 背景

bookmgr 线上绘本库需要引入科学的儿童发展评估维度体系。绘本是儿童教育的重要载体，不同绘本覆盖不同的儿童发展领域。通过维度分类体系，管理员可以为每本绘本标注其所属的发展维度，从而帮助教师和家长根据儿童的发展需求选择合适的绘本。

当前系统仅有基本的用户和绘本管理，缺乏维度分类能力，无法支撑精细化的绘本筛选与推荐场景。

### 目标

1. 建立五大适应维度及二级子分类的完整分类体系
2. 提供维度的增删改查 API，支持树形结构返回
3. 支持管理员通过前端界面管理维度数据
4. 为后续绘本-维度关联（`03-book-dimension`）奠定数据基础

---

## 2. 五大维度及子分类说明

### 一级维度（5 个）

| 序号 | 名称 | Slug | 说明 |
|------|------|------|------|
| 1 | 身心发展 | physical | 身体动作、感知觉、精细动作等身体层面的发展 |
| 2 | 生活自理 | life | 日常生活、卫生习惯、安全防护等自理能力 |
| 3 | 学习准备 | learning | 认知能力、语言表达、前书写准备等学习相关能力 |
| 4 | 社会适应 | social | 人际交往、情绪情感、社会常识等社会化发展 |
| 5 | 情绪行为 | emotional | 情绪管理、行为调节、自我意识等心理层面 |

### 二级子分类（每个一级下 2~4 个）

| 一级维度 | 子分类 |
|----------|--------|
| 身心发展 (physical) | 身体动作、感知觉、精细动作 |
| 生活自理 (life) | 日常生活、卫生习惯、安全防护 |
| 学习准备 (learning) | 认知能力、语言表达、前书写准备 |
| 社会适应 (social) | 人际交往、情绪情感、社会常识 |
| 情绪行为 (emotional) | 情绪管理、行为调节、自我意识 |

> 注：二级子分类在 MVP 中由超级管理员初始化，不开放给普通管理员创建（一级维度也同理）。

---

## 3. MVP 范围

### 功能范围

- **维度列表查询**：GET /api/v1/dimensions，支持树形结构返回
- **子分类筛选**：GET /api/v1/dimensions?parent=physical
- **创建维度**：POST /api/v1/dimensions（仅超级管理员和普通管理员）
- **更新维度**：PUT /api/v1/dimensions/{dimension}（仅超级管理员和普通管理员）
- **删除维度**：DELETE /api/v1/dimensions/{dimension}（级联检查绘本关联）
- **查询子分类**：GET /api/v1/dimensions/{dimension}/subcategories

### 非 MVP 范围（后续批次）

- 绘本与维度的多对多关联管理
- 维度使用统计和可视化
- 前端绘本筛选器（依赖 03-book-dimension）

---

## 4. 影响范围

### Proto 定义

- 新建 `api/bookmgr/v1/dimension_service.proto`：定义 Dimension 资源和 RPC 方法
- 在 `api/bookmgr/v1/common.proto` 中复用 Dimension 消息

### Ent Schema

- 新建 `backend/ent/schema/dimension.go`：定义 Dimension 表，支持自引用 parent_id
- Dimension 节点与 Book 的多对多关联在后续批次处理

### Service 层

- 新建 `backend/service/dimension.go`：维度业务逻辑（树形构建、slug 唯一性校验等）

### Repository 层

- 新建 `backend/repository/dimension.go`：封装 Ent 查询（树形查询、按 parent 筛选、级联删除检查）

### HTTP Handler / Chi

- 在 Chi 路由器中注册 `/api/v1/dimensions` 及相关路径
- 通过 grpc-gateway 暴露 REST 端点

### Frontend

- 新建 `frontend/src/pages/admin/DimensionManagePage.tsx`：维度管理页面
- 新建 `frontend/src/components/DimensionTree.tsx`：树形展示组件
- 新建 `frontend/src/components/DimensionSelect.tsx`：绘本编辑时的维度选择组件
- API client: `frontend/src/api/dimension.ts`

---

## 5. 数据模型

### Dimension 表

| 字段 | 类型 | 说明 |
|------|------|------|
| id | int64 (PK) | 自增主键 |
| name | string | 维度名称（如"身心发展"） |
| slug | string (unique) | URL-safe 标识（如"physical"） |
| description | string (nullable) | 维度描述 |
| sort_order | int | 排序序号 |
| parent_id | int64 (FK, nullable) | 父维度 ID，null 表示一级维度 |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### 索引

- `slug` 唯一索引
- `parent_id` 外键索引

---

## 6. API 设计概要

遵循 AIP-122 资源命名规范，所有端点以 `/api/v1/dimensions` 为基准：

| 方法 | REST 路径 | gRPC 方法 | 说明 |
|------|-----------|-----------|------|
| GET | /api/v1/dimensions | ListDimensions | 列表查询（树形） |
| POST | /api/v1/dimensions | CreateDimension | 创建维度 |
| GET | /api/v1/dimensions/{dimension} | GetDimension | 获取单个维度 |
| PUT | /api/v1/dimensions/{dimension} | UpdateDimension | 更新维度 |
| DELETE | /api/v1/dimensions/{dimension} | DeleteDimension | 删除维度 |
| GET | /api/v1/dimensions/{dimension}/subcategories | ListSubcategories | 获取子分类 |

详见 `design.md`。

---

## 7. 验收标准

### 功能验收

- [ ] 超级管理员可以创建、编辑、删除任意维度
- [ ] 普通管理员可以创建、编辑、删除维度（和超级管理员权限相同）
- [ ] 未登录用户无法访问维度管理 API（返回 401）
- [ ] GET /api/v1/dimensions 返回完整的树形结构
- [ ] GET /api/v1/dimensions?parent=physical 仅返回该一级维度的子分类
- [ ] 创建重复 slug 的维度返回 409 Conflict
- [ ] 删除已被绘本关联的维度返回 409 Conflict，并附带关联绘本数量
- [ ] 删除无关联的维度返回 204 No Content

### 技术验收

- [ ] Proto 文件通过 `buf lint` 和 `buf breaking`
- [ ] Ent Schema 变更通过 `atlas migrate diff` 生成迁移 SQL
- [ ] 所有 API 有对应的 BDD 测试覆盖（API 层 + E2E 层）
- [ ] 前端维度管理页面完整可用（CRUD + 树形展示）

### 性能验收

- [ ] 维度列表查询 < 50ms（SQLite，单机）
- [ ] 删除维度前检查关联绘本数量，不触发全表扫描（使用 COUNT 聚合）

---

## 8. 实现前提

本功能依赖 `01-role-permission` 提案中定义的角色权限体系：

1. **Role 实体**：超级管理员（super_admin）和普通管理员（admin）的角色定义
2. **JWT 权限声明**：token 中包含 role claim，前端据此判断是否显示管理入口
3. **中间件鉴权**：middleware 层对 `/api/v1/dimensions` 等管理端点做角色校验

`02-dimension-category` 须在 `01-role-permission` 合并后方可合并。

---

## 9. 后续规划

| 批次 | 提案名称 | 说明 |
|------|----------|------|
| 03 | 绘本-维度关联 | 绘本详情页关联多个维度（多对多），前端筛选器 |
| 04 | 维度使用统计 | 各维度的绘本数量统计，管理员看板 |
