## ADDED Requirements

### Requirement: Book entity fields
The Book entity SHALL have the following fields:
- `id`: UUIDv7 primary key
- `title`: non-empty string, max 256 characters
- `author`: non-empty string, max 256 characters
- `description`: optional string, max 4096 characters
- `cover_url`: optional string
- `file_path`: non-empty string (path to stored PDF)
- `uploader_id`: UUIDv7 foreign key referencing User
- `created_at`: timestamp, set automatically
- `updated_at`: timestamp, updated automatically

#### Scenario: Book created with required fields
- **WHEN** a Book is created with title, author, file_path, and uploader_id
- **THEN** the Book SHALL be persisted with an auto-generated UUIDv7 id and timestamps

### Requirement: Book-User relationship
The Book entity SHALL have an edge (foreign key) to User representing the uploader.

#### Scenario: Book references uploader
- **WHEN** a Book is created with an uploader_id pointing to an existing User
- **THEN** the Book SHALL be queryable with its uploader relationship

#### Scenario: Uploader deletion cascades or blocks
- **WHEN** a User who uploaded books is deleted
- **THEN** the deletion SHALL be blocked (foreign key constraint) to prevent orphaned books

### Requirement: Atlas migration for books table
An Atlas migration SHALL be generated for the new `books` table with all columns, indexes, and foreign key constraints.

#### Scenario: Migration creates books table
- **WHEN** the books migration is applied
- **THEN** the `books` table SHALL exist with all defined columns and a foreign key to `users`
