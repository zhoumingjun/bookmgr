## Why

The core value of bookmgr is managing and serving PDF books. Users need to browse and read books; admins need to upload, edit, and delete them. The Book entity doesn't exist yet in the database, and the BookService proto returns UNIMPLEMENTED. This change adds the complete book management feature from schema to UI.

## What Changes

- Define **Book** Ent schema with fields: id (UUIDv7), title, author, description, cover_url, file_path, uploader_id (FK→User), created_at, updated_at
- Generate Atlas migration for the new `books` table
- Implement file storage abstraction for PDF upload/download in `backend/storage/`
- Implement `BookService` gRPC service: `ListBooks`, `GetBook`, `CreateBook`, `UpdateBook`, `DeleteBook`, `DownloadBook`
- Build admin book management UI: book list, upload form, edit form
- Build user console UI: book browsing, PDF viewer/download

## Capabilities

### New Capabilities

- `book-schema`: Ent schema for Book entity with relationship to User (uploader)
- `book-service`: gRPC BookService implementation with file upload/download
- `file-storage`: Local filesystem storage abstraction for PDF files
- `admin-book-ui`: Admin pages for book CRUD and file upload
- `user-book-ui`: User console pages for browsing and reading books

### Modified Capabilities

_(none)_

## Impact

- **Code**: `backend/ent/schema/book.go`, `backend/repository/book.go`, `backend/service/book.go`, `backend/handler/book.go`, `backend/storage/local.go`, `frontend/src/pages/admin/Books.tsx`, `frontend/src/pages/console/Books.tsx`
- **Database**: new `books` table with FK to `users`, Atlas migration generated
- **API**: all BookService endpoints become functional (`GET/POST/PUT/DELETE /api/v1/books/*`, `GET /api/v1/books/{book}/download`) — backward-compatible
- **Dependencies**: none new (file I/O uses stdlib)
- **Admin impact**: admins can upload, edit, and delete PDF books
- **User impact**: users can browse book catalog and download/view PDFs
