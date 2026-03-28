## ADDED Requirements

### Requirement: User book browsing page
The user console SHALL include a book browsing page at `/console/books` showing available books.

#### Scenario: Book catalog displayed
- **WHEN** a user navigates to `/console/books`
- **THEN** a list/grid of books SHALL be displayed with title, author, and description

#### Scenario: Pagination
- **WHEN** more books exist than fit on one page
- **THEN** pagination controls SHALL allow navigating between pages

### Requirement: User book detail and reader
The user console SHALL allow viewing book details and reading/downloading the PDF.

#### Scenario: View book details
- **WHEN** a user clicks on a book in the catalog
- **THEN** the book's full details (title, author, description) SHALL be displayed with a download/read button

#### Scenario: Download book PDF
- **WHEN** a user clicks the download button
- **THEN** the PDF file SHALL be downloaded via the DownloadBook API

#### Scenario: Read book in browser
- **WHEN** a user clicks the read button
- **THEN** the PDF SHALL open in a new tab using the browser's native PDF viewer
