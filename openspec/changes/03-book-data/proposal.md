# Proposal: 绘本基础数据管理

## 状态
**Proposed** | 优先级: P0

## Why

bookmgr 线上绘本库的核心实体是"绘本"。在能上传文件、分类筛选、审核展示之前，必须先建立绘本的标准数据模型。

现有 bookmgr 的 `Book` 实体过于简单（只有 title/author/description/cover_url/file_path），无法满足特教绘本场景的精细化需求：
- 需要标注所属适应维度（一级+二级）
- 需要标注核心适应目标、适配认知水平
- 需要区分纸电双版、资源类型
- 需要教学建议、亲子共读指导等结构化字段

本提案定义绘本主表，作为后续所有功能（上传/审核/展示/检索/收藏）的数据基础。

## What Changes

### 核心变更

1. **扩展 Book Ent Schema**：新增 10+ 个业务字段，覆盖特教绘本全生命周期信息
2. **新增 PictureBook/Dimension 关联表**：绘本与五大维度的多对多关系（多标签）
3. **新增 BookDraft Snapshot**：支持草稿状态下的数据暂存
4. **API 层**：扩展 `book_service.proto`，新增 `CreateBook`、`UpdateBook`、`DeleteBook`、`ListBooks`、`GetBook` RPC
5. **前端**：绘本创建/编辑表单（完整字段）、绘本列表卡片、绘本详情页

## Capabilities

### New Capabilities

- `book-data-schema`：Book Ent Schema 扩展，包含所有特教绘本标准字段
- `book-dimension-relation`：Book 与 Dimension 多对多关联（中间表 book_dimensions）
- `book-service-crud`：Book 完整的 CRUD RPC（AIP 标准）
- `book-frontend-form`：前端绘本创建/编辑表单（所有字段）
- `book-frontend-list`：前端绘本卡片列表 + 详情页

### Modified Capabilities

- `book_service.proto`：扩展 Book 消息，添加新字段
- `book-management-service`：扩展后端 service/repository 层逻辑

## Impact

### 代码

- `backend/ent/schema/book.go` — 大幅扩展字段
- `backend/ent/schema/book_dimension.go`（新增）
- `backend/ent/migrate/migrations/` — Atlas 迁移
- `backend/handler/book_service.go` — 扩展 handler
- `backend/service/book.go` — 扩展 service
- `backend/repository/book.go` — 扩展 repository
- `frontend/src/pages/admin/BookForm.tsx` — 绘本表单
- `frontend/src/pages/console/BookList.tsx` — 绘本列表
- `frontend/src/pages/console/BookDetail.tsx` — 绘本详情

### 数据库

新增/修改字段见 design.md。有迁移计划。

### API

新增 Book CRUD 接口，非 BREAKING（新增字段不影响现有客户端）。

### 依赖

- 依赖 `02-dimension-category`（Dimension Schema 必须先存在）
- 前端表单依赖 Ant Design Form 和 Select 组件
