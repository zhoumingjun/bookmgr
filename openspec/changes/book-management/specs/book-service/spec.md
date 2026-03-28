## ADDED Requirements

### Requirement: ListBooks with pagination
The BookService `ListBooks` RPC SHALL return a paginated list of books using AIP-158 pagination. Available to all authenticated users.

#### Scenario: List books
- **WHEN** `ListBooks` is called with `page_size: 20`
- **THEN** the response SHALL include up to 20 books with title, author, description, and timestamps

### Requirement: GetBook by ID
The BookService `GetBook` RPC SHALL return a single book's details. Available to all authenticated users.

#### Scenario: Book found
- **WHEN** `GetBook` is called with an existing book's ID
- **THEN** the response SHALL include all book metadata

#### Scenario: Book not found
- **WHEN** `GetBook` is called with a non-existent ID
- **THEN** the RPC SHALL return `NOT_FOUND` status

### Requirement: CreateBook (admin only)
The BookService `CreateBook` RPC SHALL create a book metadata record. File upload is handled separately.

#### Scenario: Successful creation
- **WHEN** an admin calls `CreateBook` with title, author, and description
- **THEN** a new Book record SHALL be created with the caller as uploader, and the response SHALL include the book ID

### Requirement: UpdateBook (admin only)
The BookService `UpdateBook` RPC SHALL update book metadata using field mask.

#### Scenario: Update title
- **WHEN** an admin calls `UpdateBook` with `update_mask: ["title"]`
- **THEN** only the title SHALL be updated

### Requirement: DeleteBook (admin only)
The BookService `DeleteBook` RPC SHALL delete a book and its associated file.

#### Scenario: Successful deletion
- **WHEN** an admin calls `DeleteBook` with an existing book's ID
- **THEN** the book record SHALL be removed from the database and the PDF file SHALL be deleted from storage

### Requirement: DownloadBook
The BookService `DownloadBook` RPC SHALL return the book's PDF file as binary content via `google.api.HttpBody`.

#### Scenario: Download existing book
- **WHEN** an authenticated user calls `DownloadBook` with an existing book's ID
- **THEN** the response SHALL contain the PDF binary with content-type `application/pdf`

#### Scenario: Download non-existent book
- **WHEN** `DownloadBook` is called with a non-existent ID
- **THEN** the RPC SHALL return `NOT_FOUND` status
