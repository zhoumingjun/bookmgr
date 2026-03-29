## 1. Book Data Layer

- [x] 1.1 Create Book Ent schema at `backend/ent/schema/book.go`: id (UUIDv7), title, author, description, cover_url, file_path, uploader edge to User, timestamps, validations
- [x] 1.2 Run `go generate ./ent` to regenerate Ent code with Book entity
- [x] 1.3 Generate Atlas migration: `atlas migrate diff --env ent "add_books_table"`
- [x] 1.4 Create `backend/repository/book.go`: BookRepository with Create, GetByID, List (paginated), Update, Delete methods
- [x] 1.5 Export BookRepository in `backend/repository/repository.go` fx module

## 2. File Storage

- [x] 2.1 Create `backend/storage/storage.go`: define `Storage` interface (Save, Open, Delete)
- [x] 2.2 Create `backend/storage/local.go`: `LocalStorage` implementation using config.UploadDir, with directory creation on init
- [x] 2.3 Export LocalStorage as Storage in `backend/storage/` fx module

## 3. Book Service

- [x] 3.1 Create `backend/service/book.go`: BookService with List, Get, Create, Update, Delete, Download methods — includes page token handling, file storage orchestration, file cleanup on delete
- [x] 3.2 Export BookService in `backend/service/service.go` fx module

## 4. gRPC Handler + File Upload Endpoint

- [x] 4.1 Create `backend/handler/book.go`: gRPC BookServiceServer implementation, register on gRPC server replacing Unimplemented stub
- [x] 4.2 Create `backend/handler/upload.go`: Chi HTTP handler for `POST /api/v1/books/{book}/upload` — multipart/form-data, PDF validation, 100MB limit, JWT auth check
- [x] 4.3 Mount upload endpoint on Chi router in `main.go`

## 5. Frontend Admin Book Pages

- [x] 5.1 Create `frontend/src/api/books.ts`: API functions for listBooks, getBook, createBook, updateBook, deleteBook, uploadBookFile, downloadBook
- [x] 5.2 Create `frontend/src/pages/admin/Books.tsx`: book list table with pagination, edit/delete actions
- [x] 5.3 Create `frontend/src/pages/admin/BookNew.tsx`: upload form with metadata fields + file picker
- [x] 5.4 Create `frontend/src/pages/admin/BookEdit.tsx`: edit form for book metadata
- [x] 5.5 Wire admin book routes in `App.tsx`

## 6. Frontend User Console

- [x] 6.1 Create `frontend/src/pages/console/Books.tsx`: book browsing grid/list with pagination
- [x] 6.2 Create `frontend/src/pages/console/BookDetail.tsx`: book detail view with download/read buttons
- [x] 6.3 Wire console book routes in `App.tsx`
- [x] 6.4 Update `frontend/src/pages/console/Home.tsx`: add navigation to book catalog

## 7. Verification

- [x] 7.1 Test: create book via API → upload PDF → download PDF → content matches
- [x] 7.2 Test: delete book → file removed from storage
- [x] 7.3 Test: admin book CRUD flow in frontend
- [x] 7.4 Test: user browsing and download flow in frontend
