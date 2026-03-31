# 06-book-display 提案：绘本展示浏览

## 1. 背景

bookmgr 系统已通过 `03-book-data` 完成了绘本基础数据管理，通过 `04-book-upload` 完成了绘本封面图和 PDF/EPUB 文件的上传和审核流程。当前系统缺少面向普通用户的绘本浏览和阅读功能——管理员审核通过的绘本需要以卡片列表的形式展示给登录用户，并支持在线查看 PDF/EPUB 文件和保存阅读进度。

## 2. 目标

本提案旨在实现以下核心功能：

- **绘本卡片列表页**：支持封面图、标题、作者、年龄范围、维度标签展示，分页加载，默认按最新审核通过排序
- **绘本详情页**：展示完整绘本信息，提供下载/在线阅读入口，支持维度标签跳转筛选
- **在线查看/播放**：集成 PDF.js（PDF）和 EPUB.js（EPUB），支持翻页、缩放、跳页
- **阅读进度保存**：自动记录用户阅读进度，下次打开从上次位置继续

## 3. MVP 范围

### 包含

- 绘本卡片列表页（任意登录用户）
- 绘本详情页（任意登录用户）
- PDF 在线阅读（PDF.js）
- EPUB 在线阅读（EPUB.js）
- 阅读进度保存与恢复（BookReadingProgress 表）
- 封面图加载（优先后端图，无则占位图）
- 分页（AIP-158，每页 20 条）
- 默认排序：最新审核通过
- 管理员绘本管理列表（显示所有审核状态）

### 不包含

- 绘本搜索/关键词全文检索
- 绘本收藏/心愿单
- 用户评论/评分
- 离线下载/导出
- 音频/视频绘本播放
- 推荐算法

## 4. 影响范围

### 前端（新增页面）

| 路由 | 组件 | 说明 |
|------|------|------|
| `/books` | BookListPage | 绘本卡片列表页 |
| `/books/:id` | BookDetailPage | 绘本详情页 |
| `/books/:id/read` | BookReaderPage | 在线阅读页（PDF/EPUB） |
| `/admin/books` | AdminBookListPage | 管理员绘本管理（现有列表增强） |

### 新增数据模型

**BookReadingProgress 表**

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid | 主键 |
| book_id | FK | 关联绘本 ID |
| user_id | FK | 关联用户 ID |
| progress_percent | int | 进度百分比（0-100） |
| last_page | int | 最后阅读页码 |
| last_read_at | timestamp | 最后阅读时间 |

唯一约束：(book_id, user_id)。

### API（新增 HTTP 端点，grpc-gateway 映射到 gRPC）

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/v1/books` | GET | 获取绘本列表（支持分页、排序、维度筛选） |
| `/api/v1/books/:id` | GET | 获取绘本详情 |
| `/api/v1/books/:id/cover` | GET | 获取封面图（静态文件） |
| `/api/v1/books/:id/file` | GET | 获取绘本文件（PDF/EPUB，用于在线阅读） |
| `/api/v1/users/me/reading-progress` | GET | 获取当前用户的阅读进度列表 |
| `/api/v1/books/:id/reading-progress` | GET | 获取指定绘本对应当前用户的阅读进度 |
| `/api/v1/books/:id/reading-progress` | PUT | 更新阅读进度 |

### Proto 定义新增

- `ListBooks` RPC + `ListBooksRequest/Response`（AIP-158 分页）
- `GetBook` RPC + `GetBookRequest/Response`
- `GetReadingProgress` RPC + `GetReadingProgressRequest/Response`
- `UpdateReadingProgress` RPC + `UpdateReadingProgressRequest/Response`
- `Book` 消息增加 `cover_url`、`file_url`、`reading_progress` 字段

### 依赖项

- 前端：`pdfjs-dist@^4.0`、`epubjs@^0.3`
- 后端：新增 `BookReadingProgress` Ent schema 及关联查询

## 5. 验收标准

### 功能验收

- [ ] 登录用户访问 `/books` 可看到卡片式绘本列表，每页 20 条
- [ ] 列表默认按最新审核通过时间倒序排列
- [ ] 卡片显示封面图（优先后端，无则占位图）、标题、作者、年龄范围标签、维度标签
- [ ] 分页控件正常工作，翻页后列表正确加载
- [ ] 点击卡片进入详情页，显示完整绘本信息
- [ ] 维度标签可点击，点击后跳转列表页并按该维度筛选
- [ ] 详情页根据文件类型正确显示"在线阅读"或"下载"按钮
- [ ] PDF 绘本可在线阅读，支持翻页、缩放
- [ ] EPUB 绘本可在线阅读，支持翻页、字号调整
- [ ] 阅读进度自动保存，关闭后重新打开从上次位置继续
- [ ] 管理员在 `/admin/books` 可看到所有审核状态的绘本
- [ ] 未登录用户访问以上页面均被重定向到登录页

### 技术验收

- [ ] 新增 Proto RPC 和消息定义，通过 `buf lint` 和 `buf breaking`
- [ ] `BookReadingProgress` Ent schema 已生成并迁移
- [ ] PDF.js 和 EPUB.js 正确集成，无控制台错误
- [ ] 前端路由守卫正确实施权限控制
- [ ] 所有新增 API 端点有对应的 gRPC handler 实现
- [ ] 阅读进度 API 正确处理并发更新（UPSERT 语义）
- [ ] E2E BDD 场景全部通过（3 个 feature 文件）

### 性能验收

- [ ] 封面图懒加载，列表滚动无卡顿
- [ ] PDF 大文件（>50MB）使用流式加载，不阻塞 UI
- [ ] 阅读进度更新使用防抖（debounce 500ms），避免频繁请求
