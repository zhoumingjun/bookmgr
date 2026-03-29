package service

import (
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"strconv"

	"github.com/google/uuid"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/repository"
	"github.com/zhoumingjun/bookmgr/backend/storage"
)

// BookService handles book management business logic.
type BookService struct {
	repo    *repository.BookRepository
	storage storage.Storage
}

// NewBookService creates a new BookService.
func NewBookService(repo *repository.BookRepository, storage storage.Storage) *BookService {
	return &BookService{repo: repo, storage: storage}
}

// BookListResult holds paginated book results.
type BookListResult struct {
	Books         []*ent.Book
	NextPageToken string
}

// List returns a paginated list of books.
func (s *BookService) List(ctx context.Context, pageSize int, pageToken string) (*BookListResult, error) {
	if pageSize <= 0 {
		pageSize = 20
	}
	if pageSize > 100 {
		pageSize = 100
	}

	offset := 0
	if pageToken != "" {
		decoded, err := base64.StdEncoding.DecodeString(pageToken)
		if err != nil {
			return nil, fmt.Errorf("invalid page token: %w", err)
		}
		offset, err = strconv.Atoi(string(decoded))
		if err != nil {
			return nil, fmt.Errorf("invalid page token: %w", err)
		}
	}

	page := (offset / pageSize) + 1
	result, err := s.repo.List(ctx, page, pageSize)
	if err != nil {
		return nil, fmt.Errorf("listing books: %w", err)
	}

	var nextToken string
	nextOffset := offset + pageSize
	if nextOffset < result.Total {
		nextToken = base64.StdEncoding.EncodeToString([]byte(strconv.Itoa(nextOffset)))
	}

	return &BookListResult{
		Books:         result.Books,
		NextPageToken: nextToken,
	}, nil
}

// Get returns a single book by ID.
func (s *BookService) Get(ctx context.Context, id uuid.UUID) (*ent.Book, error) {
	return s.repo.GetByID(ctx, id)
}

// Create creates a new book record.
func (s *BookService) Create(ctx context.Context, title, author, description string, uploaderID uuid.UUID) (*ent.Book, error) {
	return s.repo.Create(ctx, title, author, description, uploaderID)
}

// BookUpdateFields specifies which book fields to update.
type BookUpdateFields struct {
	Title       *string
	Author      *string
	Description *string
	CoverURL    *string
}

// Update modifies book fields.
func (s *BookService) Update(ctx context.Context, id uuid.UUID, fields BookUpdateFields) (*ent.Book, error) {
	return s.repo.Update(ctx, id, func(update *ent.BookUpdateOne) *ent.BookUpdateOne {
		if fields.Title != nil {
			update = update.SetTitle(*fields.Title)
		}
		if fields.Author != nil {
			update = update.SetAuthor(*fields.Author)
		}
		if fields.Description != nil {
			update = update.SetDescription(*fields.Description)
		}
		if fields.CoverURL != nil {
			update = update.SetCoverURL(*fields.CoverURL)
		}
		return update
	})
}

// Delete removes a book and its file from storage.
func (s *BookService) Delete(ctx context.Context, id uuid.UUID) error {
	b, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return fmt.Errorf("getting book: %w", err)
	}
	if b.FilePath != "" {
		_ = s.storage.Delete(ctx, b.FilePath)
	}
	return s.repo.Delete(ctx, id)
}

// SaveFile saves the uploaded file and updates the book's file_path.
func (s *BookService) SaveFile(ctx context.Context, id uuid.UUID, r io.Reader) (*ent.Book, error) {
	filename := id.String() + ".pdf"
	if err := s.storage.Save(ctx, filename, r); err != nil {
		return nil, fmt.Errorf("saving file: %w", err)
	}
	return s.repo.Update(ctx, id, func(update *ent.BookUpdateOne) *ent.BookUpdateOne {
		return update.SetFilePath(filename)
	})
}

// OpenFile opens the book's file for reading.
func (s *BookService) OpenFile(ctx context.Context, id uuid.UUID) (io.ReadCloser, error) {
	b, err := s.repo.GetByID(ctx, id)
	if err != nil {
		return nil, fmt.Errorf("getting book: %w", err)
	}
	if b.FilePath == "" {
		return nil, fmt.Errorf("no file uploaded for this book")
	}
	return s.storage.Open(ctx, b.FilePath)
}
