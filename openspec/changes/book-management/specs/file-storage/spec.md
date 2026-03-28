## ADDED Requirements

### Requirement: Storage interface
The system SHALL define a `Storage` interface with methods: `Save(ctx, filename, reader) error`, `Open(ctx, filename) (io.ReadCloser, error)`, `Delete(ctx, filename) error`.

#### Scenario: Save and retrieve file
- **WHEN** `Save` is called with filename "abc.pdf" and file content, followed by `Open` with the same filename
- **THEN** `Open` SHALL return a reader with the same content that was saved

### Requirement: Local filesystem implementation
The `LocalStorage` implementation SHALL store files in the directory configured by `config.UploadDir`.

#### Scenario: File stored on disk
- **WHEN** `Save` is called with filename "abc.pdf"
- **THEN** the file SHALL exist at `{UploadDir}/abc.pdf`

#### Scenario: File deleted from disk
- **WHEN** `Delete` is called with filename "abc.pdf"
- **THEN** the file SHALL be removed from `{UploadDir}/abc.pdf`

### Requirement: File upload HTTP endpoint
A dedicated HTTP endpoint `POST /api/v1/books/{book}/upload` SHALL accept multipart/form-data with a PDF file, handled directly by Chi (not grpc-gateway).

#### Scenario: Successful upload
- **WHEN** an admin uploads a PDF file to `POST /api/v1/books/{book_id}/upload`
- **THEN** the file SHALL be saved as `{book_id}.pdf` in storage and the book's `file_path` SHALL be updated

#### Scenario: Non-PDF rejected
- **WHEN** a non-PDF file is uploaded
- **THEN** the endpoint SHALL return HTTP 400 with an error message

#### Scenario: File size limit
- **WHEN** a file exceeding 100MB is uploaded
- **THEN** the endpoint SHALL return HTTP 413 (Payload Too Large)
