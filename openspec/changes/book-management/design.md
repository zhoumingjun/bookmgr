## Context

The User data layer, gRPC infrastructure, auth system, and admin user management are in place. The BookService proto defines 6 RPCs with HTTP annotations. The `backend/storage/` package exists but is an empty fx module. File storage path `/app/uploads/` is configured in Docker. Atlas handles database migrations.

## Goals / Non-Goals

**Goals:**
- Book Ent schema with User relationship (uploader)
- Atlas migration for books table
- Book repository with CRUD
- File storage abstraction (local filesystem)
- BookService gRPC implementation with file upload (multipart) and download (streaming)
- Admin UI for book CRUD with file upload
- User console UI for browsing and reading books

**Non-Goals:**
- Full-text search in book content
- Book categories/tags (can be added later)
- Cover image generation from PDF
- Reading progress tracking
- Book sharing/access control beyond auth

## Decisions

### 1. Book-User relationship: uploader_id FK

**Choice**: Book has an `uploader_id` field as a foreign key to User. Ent edge: `Book.Edges.Uploader → User`.

**Why**: Tracks who uploaded each book. One-to-many: a user can upload many books, a book has one uploader.

### 2. File storage: local filesystem with abstraction interface

**Choice**: Define a `Storage` interface with `Save(ctx, filename, reader)`, `Open(ctx, filename)`, `Delete(ctx, filename)` methods. Implement `LocalStorage` backed by `config.UploadDir` (default `/app/uploads/`).

**Why**: Interface allows swapping to S3/GCS later. Local filesystem is sufficient for single-instance deployment and simplest to start.

### 3. File upload via separate HTTP endpoint

**Choice**: `CreateBook` accepts metadata only (title, author, description). File upload is a separate `POST /api/v1/books/{book}/upload` HTTP endpoint handled directly by Chi (not through gRPC), because grpc-gateway doesn't natively support multipart/form-data.

**Why**: grpc-gateway can handle `google.api.HttpBody` but multipart upload with metadata is awkward. A dedicated Chi endpoint for file upload is cleaner and supports streaming.

**Alternative considered**: Base64-encode file in proto message — terrible for large PDFs.

### 4. File download via google.api.HttpBody

**Choice**: `DownloadBook` RPC returns `google.api.HttpBody` with content-type `application/pdf` and binary body. grpc-gateway streams this as a raw HTTP response.

**Why**: Standard grpc-gateway pattern for binary responses. Client gets a normal file download.

### 5. PDF viewer: embedded iframe or browser native

**Choice**: Frontend opens the download URL in a new tab or uses an iframe with the browser's built-in PDF viewer.

**Why**: No need for a custom PDF.js viewer. Modern browsers render PDFs natively. Keeps frontend simple.

### 6. File naming: UUID-based

**Choice**: Uploaded files stored as `{book_uuid}.pdf` in the upload directory. Original filename stored in DB metadata if needed.

**Why**: Prevents filename collisions and directory traversal attacks. Simple mapping from book ID to file.

## Risks / Trade-offs

- **[Large file upload]** → Mitigation: Chi handles multipart streaming; set reasonable max file size (e.g., 100MB).
- **[No cloud storage]** → Mitigation: Storage interface allows future swap; Docker volume persists data.
- **[Separate upload endpoint]** → Two API calls for book creation (metadata + file). Mitigation: admin UI handles this transparently.
- **[No cover images]** → Book list uses placeholder. Mitigation: `cover_url` field exists for future use.
