# 绘本资源上传 - 提案

## 1. 背景

bookmgr 线上绘本库面向两类用户场景：

- **纸版（Print）**：实体绘本配套的 PDF 文件，适用于打印或高质量展示。
- **电版（Digital）**：专为屏幕阅读设计的 EPUB/PDF 文件，适用于电子阅读器和平板设备。

当前系统支持绘本基础数据（标题、作者、简介等）的 CRUD 操作，但缺少文件上传和管理能力。管理员无法上传配套的 PDF/EPUB 文件，用户也无法下载阅读绘本内容。

## 2. 目标

- 支持单文件上传纸版或电版 PDF/EPUB 文件。
- 支持批量上传多个文件，提升管理员效率。
- 支持文件流式下载，避免大文件（可达 500MB）占用内存。
- 支持文件元数据管理（查看、删除、下载）。
- 每个绘本可同时拥有纸版和电版，或只有其中一种。

## 3. MVP 范围

### 3.1 包含

- `BookFile` 数据模型及 Ent Schema。
- 单文件上传 API（`POST /api/v1/books/{book}/files`）。
- 批量上传 API（`POST /api/v1/books/{book}/files/batch`）。
- 文件列表 API（`GET /api/v1/books/{book}/files`）。
- 文件流式下载 API（`GET /api/v1/books/{book}/files/{file}`）。
- 文件删除 API（`DELETE /api/v1/books/{book}/files/{file}`）。
- 本地文件系统存储（`./uploads/{book_id}/{print|digital}/{uuid}.{ext}`）。
- 管理员权限控制（仅管理员可上传/删除）。
- 500MB 单文件大小限制。
- 前端上传组件（支持进度条、文件类型/大小校验）。

### 3.2 不包含

- 断点续传（未来考虑）。
- 文件在线预览/阅读器（未来考虑）。
- 文件格式转换（PDF <-> EPUB）。
- 云存储（S3/GCS）支持，当前仅本地文件系统。
- 文件版本管理。
- 文件分享/预签名 URL（当前直接流式下载）。

## 4. 影响范围

### 4.1 新增文件

| 路径 | 说明 |
|---|---|
| `api/bookmgr/v1/file_service.proto` | BookFile 相关 RPC 定义 |
| `backend/ent/schema/book_file.go` | BookFile Ent Schema |
| `backend/ent/migrate/migrations/` | Atlas 迁移文件 |
| `backend/storage/` | 文件存储抽象层 |
| `backend/handler/file_handler.go` | gRPC service 实现 |
| `backend/service/file_service.go` | 业务逻辑层 |
| `backend/repository/book_file.go` | 数据访问层 |
| `frontend/src/pages/admin/BookFileUpload.tsx` | 上传组件 |
| `frontend/src/pages/admin/BookFileList.tsx` | 文件列表组件 |
| `e2e/features/book-upload/*.feature` | BDD 测试 |

### 4.2 修改文件

| 路径 | 说明 |
|---|---|
| `api/bookmgr/v1/book_service.proto` | 关联 BookFile 引用 |
| `backend/ent/schema/book.go` | 添加 Files 边 |
| `backend/cmd/server/main.go` | 注册新 Module |
| `frontend/src/api/` | 新增文件上传 API 客户端 |
| `frontend/src/pages/admin/BookDetail.tsx` | 集成文件管理 UI |

### 4.3 数据库变更

新增 `book_files` 表（见 design.md）。

## 5. 验收标准

### 5.1 功能验收

- [ ] 管理员上传 PDF 文件后，`book_files` 表记录正确，`./uploads/` 目录文件存在。
- [ ] 管理员上传 EPUB 文件后，文件类型正确识别为 `epub`。
- [ ] 同一绘本可同时存在纸版和电版两种记录。
- [ ] 批量上传 5 个文件，5 条记录均正确入库。
- [ ] 上传超过 500MB 的文件返回 413 错误。
- [ ] 非管理员用户调用上传 API 返回 403 错误。
- [ ] 下载 API 流式返回文件内容，内存占用恒定。
- [ ] 删除文件后，`book_files` 记录和 `./uploads/` 文件均被清除。
- [ ] 访问不存在的文件 ID 返回 404 错误。

### 5.2 API 验收

- [ ] `buf lint` 通过。
- [ ] `buf breaking --against '.git#branch=main'` 无破坏性变更（前提：03-book-data 已合入）。
- [ ] 所有 API BDD 测试通过（`@api-only` tag）。
- [ ] E2E BDD 测试通过（`@e2e` tag）。

### 5.3 非功能性

- [ ] 单文件 500MB 上传测试通过，内存峰值不超过 100MB（流式处理）。
- [ ] SQLite 数据库文件大小随上传线性增长，无异常膨胀。
