# 设计文档：绘本资源上传

## Context

本提案在 `03-book-data` 的 Book 实体基础上，增加文件上传和管理能力。支持纸版 PDF、电版 PDF/EPUB、音频（MP3/M4A）、动画（MP4）四种媒体类型的文件管理。

## Goals / Non-Goals

**Goals:**
- BookFile Ent Schema：关联 Book，支持多种文件类型
- 本地文件系统存储（`./uploads/{book_id}/{file_type}/{uuid}.{ext}`）
- 单文件和批量上传 API
- 流式下载（避免大文件占用内存）
- 文件元数据管理（查看、删除）
- 500MB 单文件大小限制
- 前端上传组件（进度条、校验）

**Non-Goals:**
- 断点续传
- 云存储（S3/GCS）
- 文件版本管理
- 预签名 URL

## Data Model

### book_files 表（新增）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | uuid (PK) | 主键 |
| book_id | uuid (FK→Book) | 关联绘本 |
| file_type | enum | print/digital/audio/video |
| original_name | string | 原始文件名 |
| stored_name | string | 存储文件名（UUID） |
| file_path | string | 存储路径 |
| file_size | int64 | 文件大小（字节） |
| mime_type | string | MIME 类型 |
| uploader_id | uuid (FK→User) | 上传人 |
| created_at | timestamp | 上传时间 |

唯一约束：(book_id, file_type, stored_name)。

### Ent Schema

```go
func (BookFile) Fields() []ent.Field {
    return []ent.Field{
        field.UUID("id", uuid.UUID{}).Default(func() uuid.UUID { return uuid.New() }),
        field.UUID("book_id").Required(),
        field.String("file_type").Required(), // print/digital/audio/video
        field.String("original_name").NotEmpty().MaxLen(255),
        field.String("stored_name").NotEmpty().MaxLen(255),
        field.String("file_path").NotEmpty().MaxLen(500),
        field.Int64("file_size"),
        field.String("mime_type").MaxLen(100),
        field.UUID("uploader_id").Required(),
        field.Time("created_at").Default(time.Now),
    }
}

func (BookFile) Edges() []ent.Edge {
    return []ent.Edge{
        edge.From("book", Book.Type).Field("book_id").Ref("files").Required(),
        edge.From("uploader", User.Type).Field("uploader_id").Ref("uploaded_files").Required(),
    }
}
```

## File Storage

存储路径：`{data_dir}/uploads/{book_id}/{file_type}/{uuid}.{ext}`

- `data_dir`：通过环境变量 `DATA_DIR` 配置，默认为 `./data`
- `file_type`：print / digital / audio / video
- `uuid`：文件名使用 UUID，保证唯一性

## API

| 方法 | REST 路径 | gRPC 方法 |
|------|-----------|-----------|
| POST | /api/v1/books/{book}/files | UploadBookFile |
| POST | /api/v1/books/{book}/files/batch | BatchUploadBookFiles |
| GET | /api/v1/books/{book}/files | ListBookFiles |
| GET | /api/v1/books/{book}/files/{file} | DownloadBookFile |
| DELETE | /api/v1/books/{book}/files/{file} | DeleteBookFile |

### 流式下载实现

使用 `io.Copy` 流式传输，内存占用恒定：

```go
func (s *FileService) DownloadBookFile(stream pb.FileService_DownloadBookFileServer) error {
    // ... 获取文件路径
    f, err := os.Open(filePath)
    if err != nil {
        return status.Errorf(codes.NotFound, "文件不存在")
    }
    defer f.Close()
    // 流式传输，不加载到内存
    buffer := make([]byte, 32*1024) // 32KB buffer
    for {
        n, err := f.Read(buffer)
        if n > 0 {
            if err := stream.Send(&pb.DownloadBookFileResponse{Chunk: buffer[:n]}); err != nil {
                return err
            }
        }
        if err == io.EOF {
            break
        }
        if err != nil {
            return err
        }
    }
    return nil
}
```

## Risks

- **大文件内存**：使用流式处理，确保 500MB 文件不超过 100MB 内存峰值
- **文件删除**：级联删除 Book 时，Hook 自动清理关联文件
