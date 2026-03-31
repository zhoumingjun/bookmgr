# 提案：绘本检索筛选

## 1. 背景

bookmgr 线上绘本库已积累一定数量的绘本资源，用户通过树形维度分类可以浏览绘本，但**通过分类逐级查找效率低**，尤其是当用户仅有一个模糊的需求（如"想找一本关于友谊的绘本"）时，无法快速定位目标。

绘本库需要提供**全文检索 + 多维度筛选**能力，让用户能够：
- 用关键词快速缩小范围
- 按维度、年龄段、资源类型等维度组合筛选
- 按相关性或时间排序浏览

## 2. 目标

构建一套完整的绘本检索筛选系统，支持：

1. **全文关键词搜索**：对 title（标题）、author（作者）、summary（简介）进行 FTS5 全文检索，支持中文
2. **多维度筛选**：按维度 slug（可多选，最多 3 个一级维度）筛选
3. **年龄段筛选**：按月龄范围筛选适用的绘本
4. **资源类型筛选**：纸版 / 电版 / 两者皆有
5. **排序分页**：支持多种排序维度和标准游标分页
6. **管理员视角**：管理员可额外按审核状态、上传者筛选

## 3. 搜索策略

### 3.1 SQLite FTS5

SQLite 内置 FTS5（Full-Text Search 5）模块，无需引入外部搜索引擎，在 all-in-one 单体架构下是最高效的选择。

- **Tokenizer**: `unicode61`（默认，无需额外配置），按 Unicode 码点分词，支持中文
- **Match Query**: `MATCH` 语法，支持前缀搜索（`term*`）和布尔组合（`AND` / `OR`）
- **高亮**: 使用 `snippet()` 函数返回带 `<mark>` 标签的高亮片段

### 3.2 搜索索引表

由于 Ent ORM 的 FTS5 支持尚在发展中，采用 **原生 SQL FTS5 虚拟表 + BookSearchIndex 实体表** 的混合方案：

| 表 | 用途 |
|---|---|
| `books_fts` | FTS5 虚拟表，存储 title/author/summary 的分词索引 |
| `book_search_indices` | 实体表，记录 book_id 与 FTS5 rowid 的映射，用于 Ent 关联查询 |

索引更新采用 **Ent hook**：在 Book 创建/更新时，同步更新 FTS 索引。

## 4. MVP 范围

### 4.1 纳入 MVP

- [ ] SQLite FTS5 全文搜索（title + author + summary）
- [ ] 维度筛选（多选，逗号分隔，OR 逻辑，最多 3 个一级维度）
- [ ] 年龄范围筛选（age_min / age_max）
- [ ] 资源类型筛选（print / digital / both）
- [ ] 排序：默认 approved_at DESC，支持 created_at / title / view_count
- [ ] 标准游标分页（page_token / page_size，默认 20，最大 100）
- [ ] 搜索结果 snippet 高亮（摘要字段）
- [ ] 管理员额外筛选：审核状态（draft/pending/approved/rejected）、按上传者

### 4.2 不纳入 MVP

- 相关性排序（rank score）
- 搜索建议 / 自动补全
- 热门搜索词
- 搜索历史

## 5. 影响范围

| 层面 | 影响说明 |
|---|---|
| **数据库** | 新增 `books_fts` FTS5 虚拟表、`book_search_indices` 实体表；`books` 表新增 `view_count` 字段 |
| **Ent Schema** | 新增 BookSearchIndex schema；修改 Book schema（新增 view_count） |
| **gRPC / Proto** | BookService/ListBooks 新增请求/响应字段 |
| **Service 层** | 新增 BookSearchService，处理搜索逻辑 |
| **Repository 层** | 新增 BookSearchRepository，处理 FTS5 SQL |
| **前端** | 搜索栏组件、筛选面板组件、排序选择器、分页控件 |
| **测试** | API BDD 覆盖所有查询场景 |

## 6. 验收标准

### 功能验收

- [ ] 关键词搜索 title/author/summary 任一字段匹配，返回对应结果
- [ ] 空关键词返回全量列表（受筛选条件约束）
- [ ] 关键词无匹配时返回空列表，不报错
- [ ] 维度多选按 OR 逻辑筛选，不超过 3 个一级维度时报错提示
- [ ] 年龄范围筛选正确（age_min <= 绘本 age_months <= age_max）
- [ ] 资源类型筛选正确
- [ ] 排序字段切换后结果顺序正确变化
- [ ] 分页流转正确（page_token 解码后包含 offset，支持前后翻页）
- [ ] 管理员可按审核状态、上传者筛选

### 非功能验收

- [ ] SQLite FTS5 索引创建成功，搜索延迟 < 100ms（千条数据量级）
- [ ] 搜索索引在 Book 创建/更新时自动同步
- [ ] API 符合 AIP-158 分页规范

### BDD 覆盖

- [ ] 关键词搜索.feature — 5 个场景，全部通过
- [ ] 维度筛选.feature — 5 个场景，全部通过
- [ ] 排序分页.feature — 4 个场景，全部通过
