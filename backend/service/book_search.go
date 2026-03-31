package service

import (
	"context"
	"strings"

	"github.com/zhoumingjun/bookmgr/backend/repository"
)

// BookSearchService handles book search business logic.
type BookSearchService struct {
	searchRepo *repository.BookSearchRepository
}

// NewBookSearchService creates a new BookSearchService.
func NewBookSearchService(searchRepo *repository.BookSearchRepository) *BookSearchService {
	return &BookSearchService{searchRepo: searchRepo}
}

// SearchParams holds search parameters from the API.
type SearchParams struct {
	Query          string
	DimensionSlugs []string
	AgeMin         int
	AgeMax         int
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

// Search performs full-text search with filters.
func (s *BookSearchService) Search(ctx context.Context, params SearchParams) (*repository.SearchResult, error) {
	if params.Limit <= 0 {
		params.Limit = 20
	}
	if params.Limit > 100 {
		params.Limit = 100
	}

	// Parse dimension slugs
	var dimSlugs []string
	for _, d := range params.DimensionSlugs {
		d = strings.TrimSpace(d)
		if d != "" {
			dimSlugs = append(dimSlugs, d)
		}
	}

	repoParams := repository.SearchParams{
		Query:          params.Query,
		DimensionSlugs: dimSlugs,
		AgeMinMonths:   params.AgeMin * 12,
		AgeMaxMonths:   params.AgeMax * 12,
		HasPrint:      params.HasPrint,
		HasDigital:    params.HasDigital,
		HasAudio:      params.HasAudio,
		HasVideo:      params.HasVideo,
		Status:        params.Status,
		SortField:     params.SortField,
		SortDesc:      params.SortDesc,
		Limit:         params.Limit,
		Offset:        params.Offset,
	}

	return s.searchRepo.Search(ctx, repoParams)
}
