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

// ListBooksResult holds paginated book results.
type ListBooksResult struct {
	Books         []*ent.Book
	NextPageToken string
	Total         int
}

// List returns a paginated list of books.
func (s *BookService) List(ctx context.Context, pageSize int, pageToken string) (*ListBooksResult, error) {
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
	result, err := s.repo.List(ctx, repository.ListBooksParams{Page: page, PerPage: pageSize})
	if err != nil {
		return nil, fmt.Errorf("listing books: %w", err)
	}

	var nextToken string
	nextOffset := offset + pageSize
	if nextOffset < result.Total {
		nextToken = base64.StdEncoding.EncodeToString([]byte(strconv.Itoa(nextOffset)))
	}

	return &ListBooksResult{
		Books:         result.Books,
		NextPageToken: nextToken,
		Total:         result.Total,
	}, nil
}

// ListFull returns a paginated list with full filter support.
func (s *BookService) ListFull(ctx context.Context, params repository.ListBooksParams) (*ListBooksResult, error) {
	if params.PerPage <= 0 {
		params.PerPage = 20
	}
	if params.PerPage > 100 {
		params.PerPage = 100
	}

	result, err := s.repo.List(ctx, params)
	if err != nil {
		return nil, fmt.Errorf("listing books: %w", err)
	}

	nextOffset := (result.Page - 1) * result.PerPage + result.PerPage
	var nextToken string
	if nextOffset < result.Total {
		nextToken = base64.StdEncoding.EncodeToString([]byte(strconv.Itoa(nextOffset)))
	}

	return &ListBooksResult{
		Books:         result.Books,
		NextPageToken: nextToken,
		Total:         result.Total,
	}, nil
}

// Get returns a single book by ID.
func (s *BookService) Get(ctx context.Context, id uuid.UUID) (*ent.Book, error) {
	return s.repo.GetByID(ctx, id)
}

// GetFull returns a single book with dimensions loaded.
func (s *BookService) GetFull(ctx context.Context, id uuid.UUID) (*ent.Book, error) {
	return s.repo.GetByIDWithDimensions(ctx, id)
}

// Create creates a new book record (basic fields only).
func (s *BookService) Create(ctx context.Context, title, author, description string, uploaderID uuid.UUID) (*ent.Book, error) {
	return s.repo.Create(ctx, repository.CreateBookParams{
		Title:      title,
		Author:     author,
		Description: description,
		UploaderID: uploaderID,
	})
}

// CreateFull creates a new book record with all fields.
func (s *BookService) CreateFull(ctx context.Context, params repository.CreateBookParams) (*ent.Book, error) {
	return s.repo.Create(ctx, params)
}

// BookUpdateFields specifies which book fields to update.
type BookUpdateFields struct {
	Title               *string
	Author              *string
	Description         *string
	PageCount           *int
	DurationMinutes     *int
	CoreGoal            *string
	CognitiveLevel      *string
	ResourceType        *string
	HasPrint            *bool
	HasDigital          *bool
	HasAudio            *bool
	HasVideo            *bool
	TeachingSuggestion  *string
	ParentReadingGuide  *string
	RecommendedAgeMin   *int
	RecommendedAgeMax   *int
	DimensionSlugs      []string
}

// Update modifies book fields.
func (s *BookService) Update(ctx context.Context, id uuid.UUID, fields BookUpdateFields) (*ent.Book, error) {
	return s.repo.Update(ctx, id, repository.UpdateBookParams{
		Title:               fields.Title,
		Author:              fields.Author,
		Description:         fields.Description,
		PageCount:           fields.PageCount,
		DurationMinutes:     fields.DurationMinutes,
		CoreGoal:            fields.CoreGoal,
		CognitiveLevel:      fields.CognitiveLevel,
		ResourceType:        fields.ResourceType,
		HasPrint:            fields.HasPrint,
		HasDigital:          fields.HasDigital,
		HasAudio:            fields.HasAudio,
		HasVideo:            fields.HasVideo,
		TeachingSuggestion:  fields.TeachingSuggestion,
		ParentReadingGuide:  fields.ParentReadingGuide,
		RecommendedAgeMin:   fields.RecommendedAgeMin,
		RecommendedAgeMax:   fields.RecommendedAgeMax,
		DimensionSlugs:      fields.DimensionSlugs,
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
	return s.repo.Update(ctx, id, repository.UpdateBookParams{})
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
