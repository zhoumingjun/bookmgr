## ADDED Requirements

### Requirement: Admin book list page
The admin dashboard SHALL include a book list page at `/admin/books` showing all books in a table.

#### Scenario: Book list displayed
- **WHEN** an admin navigates to `/admin/books`
- **THEN** a table SHALL display books with columns: title, author, uploader, created date, and action buttons (edit, delete)

### Requirement: Admin book upload page
The admin dashboard SHALL include a book upload page at `/admin/books/new` with a form for metadata and file upload.

#### Scenario: Upload new book
- **WHEN** an admin fills in title, author, description, selects a PDF file, and submits
- **THEN** the system SHALL create the book record (CreateBook API), upload the file (upload endpoint), and redirect to the book list

### Requirement: Admin book edit page
The admin dashboard SHALL include a book edit page at `/admin/books/:id` for modifying book metadata.

#### Scenario: Edit book metadata
- **WHEN** an admin changes a book's title and saves
- **THEN** the UpdateBook API SHALL be called and the page SHALL show a success confirmation

### Requirement: Admin delete book confirmation
Deleting a book SHALL require explicit confirmation.

#### Scenario: Delete with confirmation
- **WHEN** an admin clicks the delete button for a book
- **THEN** a confirmation dialog SHALL appear; only on confirmation SHALL the DeleteBook API be called
