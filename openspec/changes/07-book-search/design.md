# 设计文档：绘本检索筛选

## 1. SQLite FTS5 配置

### 1.1 FTS5 虚拟表创建

```sql
-- 创建 FTS5 虚拟表（仅存储 title、author、summary）
CREATE VIRTUAL TABLE IF NOT EXISTS books_fts USING fts5(
    title,
    author,
    summary,
    content='books',
    content_rowid='id',
    tokenize='unicode61 remove_diacritics 2'
);

-- 构建索引（初始数据迁移时执行一次）
-- INSERT INTO books_fts(books_fts) VALUES('rebuild');

-- 增量更新触发器（插入）
CREATE TRIGGER IF NOT EXISTS books_ai AFTER INSERT ON books BEGIN
    INSERT INTO books_fts(rowid, title, author, summary)
    VALUES (new.id, new.title, new.author, new.summary);
END;

-- 增量更新触发器（删除）
CREATE TRIGGER IF NOT EXISTS books_ad AFTER DELETE ON books BEGIN
    INSERT INTO books_fts(books_fts, rowid, title, author, summary)
    VALUES('delete', old.id, old.title, old.author, old.summary);
END;

-- 增量更新触发器（更新）
CREATE TRIGGER IF NOT EXISTS books_au AFTER UPDATE ON books BEGIN
    INSERT INTO books_fts(books_fts, rowid, title, author, summary)
    VALUES('delete', old.id, old.title, old.author, old.summary);
    INSERT INTO books_fts(rowid, title, author, summary)
    VALUES (new.id, new.title, new.author, new.summary);
END;
```

> 注：SQLite FTS5 `unicode61` tokenizer 按 Unicode 码点分词，对中文按"字"切分，无需额外分词库，与 all-in-one 约束完全兼容。

### 1.2 搜索查询语法

```sql
-- 基础匹配：搜索 "小红帽"
SELECT b.*, snippet(books_fts, 2, '<mark>', '</mark>', '...', 64) as snippet
FROM books_fts fts
JOIN books b ON b.id = fts.rowid
WHERE books_fts MATCH '小红帽';

-- 多词 AND 搜索
WHERE books_fts MATCH '友谊 AND 成长';

-- 前缀搜索（用户输入未完成时）
WHERE books_fts MATCH '小红*';

-- 指定字段搜索
WHERE books_fts MATCH 'title:小红帽 OR author:格林';
```

## 2. BookSearchIndex 表设计

虽然 FTS5 触发器已自动维护索引，但 Ent ORM 无法直接感知 FTS 虚拟表。为实现 Book 实体与搜索结果的关联查询，新增 `book_search_indices` 实体表：

```sql
CREATE TABLE book_search_indices (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    book_id    INTEGER NOT NULL UNIQUE REFERENCES books(id) ON DELETE CASCADE,
    indexed_at DATETIME NOT NULL DEFAULT (datetime('now')),
    INDEX idx_book_id (book_id)
);
```

- `book_id`：关联 books 表主键，ON DELETE CASCADE 同步删除
- `indexed_at`：记录索引时间，用于排查问题

**Ent Schema**（`backend/ent/schema/book_search_index.go`）：

```go
func (BookSearchIndex) Fields() []ent.Field {
    return []ent.Field{
        field.Int("book_id").Unique().Immutable(),
        field.Time("indexed_at").
            Default(time.Now).
            UpdateDefault(time.Now),
    }
}

func (BookSearchIndex) Edges() []ent.Edge {
    return []ent.Edge{
        edge.To("book", Book.Type).
            Field("book_id").
            Required().
            Unique().
            Immutable(),
    }
}
```

## 3. 搜索索引更新机制

### 3.1 Ent Hook（推荐）

在 `backend/ent/hook/hook.go` 中注册 Book 的 Mutator hook：

```go
func (b *BookMutator) MutationUpdators() []ent.MutatorFunc {
    return []ent.MutatorFunc{
        hook.On(func(next ent.Mutator) ent.Mutator {
            return hook.BookSearchIndexFunc(func(ctx context.Context, m *gen.BookMutation) (gen.Value, error) {
                bookID, exists := m.ID()
                if !exists {
                    return nil, nil
                }
                // 通过 FTS5 触发器自动更新，此处只需维护 book_search_indices
                _, err := b.repo.CreateBookSearchIndex(ctx, bookID)
                return nil, err
            }, ent.OpCreate|ent.OpUpdate)
        }),
    }
}
```

### 3.2 Service 层双写（备选）

若 Hook 方式过于复杂，可在 `BookService.Create` / `Update` 的最后追加：

```go
func (s *BookService) CreateBook(ctx context.Context, req *pb.CreateBookRequest) (*pb.Book, error) {
    book, err := s.repo.CreateBook(ctx, req)
    if err != nil {
        return nil, err
    }
    // 同步创建搜索索引记录
    go func() {
        _ = s.searchRepo.UpsertIndex(context.Background(), book.ID)
    }()
    return book, nil
}
```

推荐使用 **Hook 方式**，更内聚且事务安全。

## 4. API Query 参数设计

### 4.1 Proto 定义变更

在 `api/bookmgr/v1/book_service.proto` 的 `ListBooksRequest` 中新增字段：

```protobuf
message ListBooksRequest {
    // ...
    // 关键词搜索（FTS5 全文搜索：title + author + summary）
    string query = 10;

    // 维度 slug（可多个，逗号分隔，OR 逻辑，最多 3 个一级维度）
    string dimensions = 11;

    // 最小月龄
    int32 age_min = 12;

    // 最大月龄
    int32 age_max = 13;

    // 资源类型: print / digital / both
    string file_type = 14;

    // 排序字段: created_at（默认）/ approved_at / title / view_count
    string sort = 15;

    // 排序方向: desc（默认）/ asc
    string order = 16;

    // 管理员筛选：审核状态
    string status = 17;

    // 管理员筛选：上传者用户 ID
    int64 uploader_id = 18;
}
```

### 4.2 gRPC-Gateway HTTP 映射

通过 proto 注解自动生成 REST 端点：

```
GET /api/v1/books?q=小红帽&dimensions=adventure&age_min=24&age_max=48&file_type=digital&sort=created_at&order=desc&page_size=20&page_token=<token>
```

响应格式沿用现有的 `ListBooksResponse`（AIP-158 标准分页）。

## 5. Book Schema 变更

`backend/ent/schema/book.go` 新增字段：

```go
func (Book) Fields() []ent.Field {
    return []ent.Field{
        // ... 现有字段 ...
        field.Int("view_count").
            Default(0).
            Annotations(ent.MarshalJSON()),
    }
}
```

## 6. 后端实现步骤

### 步骤 1：Ent Schema 变更
1. `backend/ent/schema/book.go` 新增 `view_count` 字段
2. 新建 `backend/ent/schema/book_search_index.go`
3. `go generate ./ent`
4. `atlas migrate diff add_book_search_index --env ent`

### 步骤 2：FTS5 虚拟表迁移
编写 `backend/migrations/20260401_create_books_fts.sql`：
- 创建 `books_fts` 虚拟表
- 创建 INSERT/DELETE/UPDATE 触发器
- 执行 `INSERT INTO books_fts(books_fts) VALUES('rebuild')` 初始化索引

### 步骤 3：Repository 层
新建 `backend/repository/book_search.go`：
- `SearchBooks(ctx, req *SearchBooksRequest) ([]*Book, int, string, error)` — 执行 FTS5 + 筛选 + 排序 + 分页
- `UpsertBookSearchIndex(ctx, bookID int) error` — 维护索引记录

### 步骤 4：Service 层
新建 `backend/service/book_search.go`：
- 封装搜索业务逻辑（参数校验，如 dimensions 不超过 3 个）
- 调用 BookSearchRepository

### 步骤 5：Proto 更新 + 重新生成
1. 更新 `book_service.proto`
2. `buf generate`
3. 更新 `backend/handler/book_service.go` 的 `ListBooks` 方法

### 步骤 6：Ent Hook
在 `backend/ent/hook/` 注册 Book 生命周期 hook，同步更新 FTS5 和索引表。

### 步骤 7：API BDD 测试
在 `e2e/features/book-search/` 下实现 3 个 feature 文件。

## 7. 前端筛选面板设计

### 7.1 布局

```
┌─────────────────────────────────────────────────────────────────┐
│  🔍 [搜索框: 标题 / 作者 / 简介...]                              │
├──────────────┬──────────────┬──────────────┬───────────────────┤
│  维度         │  年龄范围     │  资源类型     │  排序             │
│  ☑ 冒险       │  [最小月龄]   │  ○ 全部       │  ▼ 审核时间最新   │
│  ☑ 认知       │  ─── [最大]   │  ○ 纸版       │                   │
│  ☐ 情感       │              │  ○ 电版       │                   │
│  ☐ 科普       │              │  ○ 两者皆有   │                   │
├──────────────┴──────────────┴──────────────┴───────────────────┤
│  共 128 本绘本  第 1/7 页                    < 1 2 3 ... 7 >     │
└─────────────────────────────────────────────────────────────────┘
│  [封面图] [标题] [作者] [月龄 24-48] [纸版+电版]  [维度标签]     │
│  [封面图] ...                                                   │
```

### 7.2 组件拆分

| 组件 | 路径 | 说明 |
|---|---|---|
| `BookSearchBar` | `frontend/src/components/BookSearchBar/` | 搜索输入框，支持回车搜索 |
| `BookFilterPanel` | `frontend/src/components/BookFilterPanel/` | 维度多选 + 年龄 + 资源类型 + 排序 |
| `BookList` | `frontend/src/components/BookList/` | 结果列表，支持空状态 |
| `BookCard` | `frontend/src/components/BookCard/` | 绘本卡片，含高亮 snippet |
| `Pagination` | `frontend/src/components/Pagination/` | 分页器，接收 page_token |

### 7.3 API 调用

```typescript
// frontend/src/api/book.ts
interface SearchBooksParams {
  q?: string;
  dimensions?: string;       // 逗号分隔
  age_min?: number;
  age_max?: number;
  file_type?: 'print' | 'digital' | 'both';
  sort?: 'created_at' | 'approved_at' | 'title' | 'view_count';
  order?: 'asc' | 'desc';
  page_size?: number;
  page_token?: string;
}

async function searchBooks(params: SearchBooksParams): Promise<ListBooksResponse> {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') searchParams.set(k, String(v));
  });
  const res = await fetch(`/api/v1/books?${searchParams}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new ApiError(res.status, await res.json());
  return res.json();
}
```

### 7.4 URL 状态同步

搜索条件和分页状态通过 URL query 参数同步，支持分享和浏览器前进后退：

```typescript
// 使用 React Router v7 的 useSearchParams
const [searchParams, setSearchParams] = useSearchParams();
```

## 8. 搜索结果展示

### 8.1 高亮片段

后端 FTS5 `snippet()` 返回带 `<mark>` 标签的文本片段，前端直接渲染：

```typescript
// BookCard 中渲染摘要高亮
<div
  className="book-summary"
  dangerouslySetInnerHTML={{ __html: book.snippet }}
/>
```

CSS:
```css
mark {
  background-color: #fff3cd;
  padding: 0 2px;
  border-radius: 2px;
}
```

### 8.2 空状态

- 无搜索结果：显示插图 + "没有找到匹配的绘本，试试其他关键词"
- 加载中：骨架屏占位

### 8.3 管理员视图

管理员在筛选面板额外看到：
- 审核状态下拉：全部 / 待审核 / 已通过 / 已拒绝 / 草稿
- 上传者输入框（用户 ID）
