package repository

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/ent/book"
	"github.com/zhoumingjun/bookmgr/backend/ent/bookfile"
)

// BookFileRepository handles book file data access.
type BookFileRepository struct {
	client *ent.Client
}

// NewBookFileRepository creates a new BookFileRepository.
func NewBookFileRepository(client *ent.Client) *BookFileRepository {
	return &BookFileRepository{client: client}
}

// BookFileResult is a plain result struct for book files.
type BookFileResult struct {
	ID           uuid.UUID
	BookID       uuid.UUID
	FileType     string
	OriginalName string
	StoredName  string
	FilePath     string
	FileSize     int64
	MimeType     string
	UploaderID   uuid.UUID
	CreatedAt    time.Time
}

// CreateParams holds fields for creating a book file record.
type CreateBookFileParams struct {
	BookID       uuid.UUID
	FileType     string
	OriginalName string
	StoredName  string
	FilePath     string
	FileSize     int64
	MimeType     string
	UploaderID   uuid.UUID
}

func (r *BookFileRepository) Create(ctx context.Context, params CreateBookFileParams) (*ent.BookFile, error) {
	bf, err := r.client.BookFile.Create().
		SetBookID(params.BookID).
		SetFileType(params.FileType).
		SetOriginalName(params.OriginalName).
		SetStoredName(params.StoredName).
		SetFilePath(params.FilePath).
		SetFileSize(params.FileSize).
		SetMimeType(params.MimeType).
		SetUploaderID(params.UploaderID).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("creating book file: %w", err)
	}
	return bf, nil
}

// ListByBookID returns all files for a book.
func (r *BookFileRepository) ListByBookID(ctx context.Context, bookID uuid.UUID) ([]*ent.BookFile, error) {
	return r.client.BookFile.Query().
		Where(bookfile.HasBookWith(book.ID(bookID))).
		All(ctx)
}

// GetByID returns a single book file by ID.
func (r *BookFileRepository) GetByID(ctx context.Context, id uuid.UUID) (*ent.BookFile, error) {
	bf, err := r.client.BookFile.Get(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("getting book file: %w", err)
	}
	return bf, nil
}

// Delete removes a book file by ID.
func (r *BookFileRepository) Delete(ctx context.Context, id uuid.UUID) error {
	return r.client.BookFile.DeleteOneID(id).Exec(ctx)
}
