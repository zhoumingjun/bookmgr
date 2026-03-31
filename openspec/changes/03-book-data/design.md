# 设计文档：绘本基础数据管理

## Context

bookmgr 的 Book 实体当前仅包含 title、author、description、cover_url、file_path 等基础字段。本提案扩展 Book Schema 并新增 Dimension 关联，为特教绘本业务提供完整的数据模型基础。

本提案依赖 `02-dimension-category` 中定义的 Dimension Schema（五大适应维度必须先存在）。

## Goals / Non-Goals

**Goals:**
- 绘本主表包含所有特教绘本标准化表单字段
- 支持多维度标签（一本绘本可属于多个适应维度）
- Book 与 Dimension 多对多关联，中间表 `book_dimensions`
- 前端表单完整覆盖所有字段，支持创建/编辑
- Book 状态默认为 `draft`（由 `05-book-review` 管理状态流转）

**Non-Goals:**
- 文件上传（由 `04-book-upload` 处理）
- 文件存储和 URL 生成
- 审核状态流转（由 `05-book-review` 处理）
- 使用热度统计（由 `07-book-search` 处理）
- 收藏和反馈（由 `08-book-feedback` 处理）

## Data Model

### Book 表（扩展）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| title | string | 绘本名称（必填） |
| author | string | 作者 |
| description | text | 绘本简介 |
| page_count | int | 绘本页数（纸版） |
| duration_minutes | int | 绘本时长（分钟，音频/动画绘本） |
| core_goal | text | 核心适应目标（必填） |
| cognitive_level | string | 适配认知水平（如：轻度/中度/重度） |
| resource_type | enum | 资源类型：print/digital/audio/video（纸版/电版/音频/动画） |
| has_print | bool | 是否有纸版 |
| has_digital | bool | 是否有电版 |
| has_audio | bool | 是否有音频版 |
| has_video | bool | 是否有动画版 |
| teaching_suggestion | text | 教学使用建议 |
| parent_reading_guide | text | 亲子共读指导 |
| recommended_age_min | int | 推荐最小月龄（如：24=2岁） |
| recommended_age_max | int | 推荐最大月龄 |
| cover_image_url | string | 封面图 URL（由 04 处理） |
| status | enum | 状态：draft/pending/approved/rejected（默认 draft） |
| submitter_id | uuid (FK→User) | 提交人（最后提交审核的用户） |
| uploader_id | uuid (FK→User) | 上传人（创建者） |
| view_count | int | 浏览次数（默认 0） |
| created_at | timestamp | 创建时间 |
| updated_at | timestamp | 更新时间 |

### book_dimensions 中间表（新增）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| book_id | uuid (FK→Book) | 绘本 ID |
| dimension_id | uuid (FK→Dimension) | 维度 ID（一级或二级） |
| is_primary | bool | 是否为主要维度（默认 true） |

唯一约束：(book_id, dimension_id)。

### Ent Schema 实现

**book.go（扩展）：**
```go
func (Book) Fields() []ent.Field {
    return []ent.Field{
        field.UUID("id", uuid.UUID{}).Default(func() uuid.UUID { return uuid.New() }),
        field.String("title").NotEmpty().MaxLen(200),
        field.String("author").MaxLen(100),
        field.Text("description"),
        field.Int("page_count"),
        field.Int("duration_minutes"),
        field.Text("core_goal"),
        field.String("cognitive_level").MaxLen(50),
        field.String("resource_type").Default("print"),
        field.Bool("has_print").Default(false),
        field.Bool("has_digital").Default(false),
        field.Bool("has_audio").Default(false),
        field.Bool("has_video").Default(false),
        field.Text("teaching_suggestion"),
        field.Text("parent_reading_guide"),
        field.Int("recommended_age_min").Default(0),
        field.Int("recommended_age_max").Default(216),
        field.String("cover_image_url").MaxLen(500),
        field.String("status").Default("draft"),
        field.UUID("submitter_id", uuid.UUID{}),
        field.UUID("uploader_id", uuid.UUID{}),
        field.Int("view_count").Default(0),
        field.Time("created_at").Default(time.Now),
        field.Time("updated_at").Default(time.Now).UpdateDefault(time.Now),
    }
}

func (Book) Edges() []ent.Edge {
    return []ent.Edge{
        edge.From("uploader", User.Type).Field("uploader_id").Ref("uploaded_books").Unique(),
        edge.From("submitter", User.Type).Field("submitter_id").Ref("submitted_books").Unique(),
        edge.To("dimensions", Dimension.Type).Through("book_dimensions", BookDimension.Type),
    }
}
```

**book_dimension.go（新增）：**
```go
func (BookDimension) Fields() []ent.Field {
    return []ent.Field{
        field.UUID("id", uuid.UUID{}).Default(func() uuid.UUID { return uuid.New() }),
        field.UUID("book_id").Required(),
        field.UUID("dimension_id").Required(),
        field.Bool("is_primary").Default(true),
    }
}
```

## Proto 定义

在 `api/bookmgr/v1/book.proto` 中扩展 Book 消息：

```protobuf
message Book {
    string id = 1;
    string title = 2;
    string author = 3;
    string description = 4;
    int32 page_count = 5;
    int32 duration_minutes = 6;
    string core_goal = 7;
    string cognitive_level = 8;
    string resource_type = 9;        // print/digital/audio/video
    bool has_print = 10;
    bool has_digital = 11;
    bool has_audio = 12;
    bool has_video = 13;
    string teaching_suggestion = 14;
    string parent_reading_guide = 15;
    int32 recommended_age_min = 16;
    int32 recommended_age_max = 17;
    string cover_image_url = 18;
    string status = 19;
    string uploader_id = 20;
    int32 view_count = 21;
    repeated Dimension dimensions = 22;
    google.protobuf.Timestamp created_at = 23;
    google.protobuf.Timestamp updated_at = 24;
}
```

在 `book_service.proto` 中扩展 RPC：

```protobuf
rpc CreateBook(CreateBookRequest) returns (Book);
rpc UpdateBook(UpdateBookRequest) returns (Book);
rpc DeleteBook(DeleteBookRequest) returns (google.protobuf.Empty);
rpc ListBooks(ListBooksRequest) returns (ListBooksResponse);
rpc GetBook(GetBookRequest) returns (Book);
```

## API 端点

| 方法 | REST 路径 | gRPC 方法 |
|------|-----------|-----------|
| POST | /api/v1/books | CreateBook |
| GET | /api/v1/books | ListBooks（AIP-158 分页） |
| GET | /api/v1/books/{book} | GetBook |
| PUT | /api/v1/books/{book} | UpdateBook |
| DELETE | /api/v1/books/{book} | DeleteBook |

## 前端表单设计

### 字段分组

**基本信息**
- 绘本名称（必填）、作者、绘本简介
- 推荐月龄（范围选择器，如 24-48 月龄）

**维度分类**（关联 02-dimension-category）
- 一级维度选择（单选，如：身心准备）
- 二级子分类选择（多选，如：校园作息适应、身体动作发展）
- 核心适应目标（必填，多行文本）

**适配信息**
- 适配认知水平（单选：轻度/中度/重度）
- 资源类型（多选：纸版/电版/音频/动画）

**使用指导**
- 教学使用建议（富文本）
- 亲子共读指导（富文本）

**媒体文件**（由 04 处理，此处仅显示关联状态）
- 封面图上传区
- 纸版 PDF 上传区
- 电版 PDF/EPUB 上传区
- 音频文件上传区
- 动画文件上传区

### 组件结构

```
BookForm
├── BasicInfoSection        — 基础信息
├── DimensionSelectSection  — 维度选择（联动二级分类）
├── AdaptationSection       — 适配信息
├── GuideSection           — 使用指导
└── MediaSection           — 媒体文件关联（由 04 提供）
```

## 实施步骤

### 步骤 1：Ent Schema
1. 扩展 `backend/ent/schema/book.go`
2. 新建 `backend/ent/schema/book_dimension.go`
3. `go generate ./ent`
4. `atlas migrate diff add_book_extended_fields --env ent`

### 步骤 2：Proto + 生成
1. 更新 `api/bookmgr/v1/book.proto`
2. 更新 `api/bookmgr/v1/book_service.proto`
3. `buf generate`

### 步骤 3：Repository + Service + Handler
1. 扩展 `backend/repository/book.go`
2. 扩展 `backend/service/book.go`
3. 扩展 `backend/handler/book_service.go`

### 步骤 4：前端
1. 新建 `frontend/src/pages/admin/BookForm.tsx`
2. 新建 `frontend/src/api/book.ts`
3. 集成 DimensionSelect 组件（依赖 02）

### 步骤 5：BDD 测试
1. 新建 `features/绘本基础数据/绘本数据管理.feature`

## Risks

- **维度依赖**：必须等 02-dimension-category 合入后才能测试多维度关联
- **字段迁移**：生产环境已有 Book 数据时需要清理历史数据
- **前端维度组件**：依赖 02 的 DimensionSelect 组件
