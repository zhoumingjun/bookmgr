package repository

import (
	"context"
	"fmt"
	"strings"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/ent/book"
)

// SearchParams holds all search parameters.
type SearchParams struct {
	Query          string
	DimensionSlugs []string
	AgeMinMonths   int
	AgeMaxMonths   int
	HasPrint       bool
	HasDigital     bool
	HasAudio       bool
	HasVideo       bool
	Status         string
	SortField      string
	SortDesc       bool
	Limit          int
	Offset         int
}

// SearchResult holds search results with total count.
type SearchResult struct {
	Books []*ent.Book
	Total int
}

// BookSearchRepository handles full-text search using ent predicates.
type BookSearchRepository struct {
	client *ent.Client
}

// NewBookSearchRepository creates a new BookSearchRepository.
func NewBookSearchRepository(client *ent.Client) *BookSearchRepository {
	return &BookSearchRepository{client: client}
}

// Search performs search with ent predicates.
func (r *BookSearchRepository) Search(ctx context.Context, params SearchParams) (*SearchResult, error) {
	if params.Limit <= 0 {
		params.Limit = 20
	}
	if params.Limit > 100 {
		params.Limit = 100
	}

	q := r.client.Book.Query()

	// Status filter
	if params.Status != "" {
		q = q.Where(book.Status(params.Status))
	} else {
		q = q.Where(book.Status("approved"))
	}

	// Keyword search using LIKE
	if params.Query != "" {
		q = q.Where(
			book.Or(
				book.TitleContainsFold(params.Query),
				book.AuthorContainsFold(params.Query),
				book.DescriptionContainsFold(params.Query),
			),
		)
	}

	// Age range filter
	if params.AgeMinMonths > 0 {
		q = q.Where(book.RecommendedAgeMaxGTE(params.AgeMinMonths))
	}
	if params.AgeMaxMonths < 216 {
		q = q.Where(book.RecommendedAgeMinLTE(params.AgeMaxMonths))
	}

	// Resource type filter
	if params.HasPrint && !params.HasDigital && !params.HasAudio && !params.HasVideo {
		q = q.Where(book.HasPrint(true))
	}
	if params.HasDigital && !params.HasPrint && !params.HasAudio && !params.HasVideo {
		q = q.Where(book.HasDigital(true))
	}

	// Count total before pagination
	total, err := q.Count(ctx)
	if err != nil {
		return nil, fmt.Errorf("counting books: %w", err)
	}

	// Sorting
	switch strings.ToLower(params.SortField) {
	case "title":
		if params.SortDesc {
			q = q.Order(ent.Desc(book.FieldTitle))
		} else {
			q = q.Order(ent.Asc(book.FieldTitle))
		}
	case "view_count":
		if params.SortDesc {
			q = q.Order(ent.Desc(book.FieldViewCount))
		} else {
			q = q.Order(ent.Asc(book.FieldViewCount))
		}
	default:
		if params.SortDesc {
			q = q.Order(ent.Desc(book.FieldCreatedAt))
		} else {
			q = q.Order(ent.Asc(book.FieldCreatedAt))
		}
	}

	// Pagination
	q = q.Limit(params.Limit).Offset(params.Offset)

	// Load with dimensions
	q = q.WithBookDimensions(func(bdq *ent.BookDimensionQuery) {
		bdq.WithDimension()
	})

	books, err := q.All(ctx)
	if err != nil {
		return nil, fmt.Errorf("searching books: %w", err)
	}

	return &SearchResult{Books: books, Total: total}, nil
}
