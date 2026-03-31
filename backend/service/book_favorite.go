package service

import (
	"context"
	"errors"
	"fmt"

	"github.com/google/uuid"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/repository"
)

// BookFavoriteService errors
var (
	ErrFavoriteAlreadyExists = errors.New("book is already in favorites")
	ErrFavoriteNotFound     = errors.New("favorite not found")
)

// BookFavoriteService handles favorite business logic.
type BookFavoriteService struct {
	favRepo  *repository.BookFavoriteRepository
	bookRepo *repository.BookRepository
}

// NewBookFavoriteService creates a new BookFavoriteService.
func NewBookFavoriteService(favRepo *repository.BookFavoriteRepository, bookRepo *repository.BookRepository) *BookFavoriteService {
	return &BookFavoriteService{
		favRepo:  favRepo,
		bookRepo: bookRepo,
	}
}

// FavoriteResult holds the result of a favorite action.
type FavoriteResult struct {
	Favorited bool
	Favorite  *ent.BookFavorite
}

// Favorite adds a book to user's favorites.
func (s *BookFavoriteService) Favorite(ctx context.Context, userID, bookID uuid.UUID) (*FavoriteResult, error) {
	// Check book exists
	_, err := s.bookRepo.GetByID(ctx, bookID)
	if err != nil {
		return nil, fmt.Errorf("book not found: %w", err)
	}

	// Check if already favorited
	exists, err := s.favRepo.Exists(ctx, userID, bookID)
	if err != nil {
		return nil, fmt.Errorf("checking favorite: %w", err)
	}
	if exists {
		return &FavoriteResult{Favorited: true}, nil
	}

	fav, err := s.favRepo.Create(ctx, userID, bookID)
	if err != nil {
		return nil, fmt.Errorf("creating favorite: %w", err)
	}

	return &FavoriteResult{Favorited: true, Favorite: fav}, nil
}

// Unfavorite removes a book from user's favorites.
func (s *BookFavoriteService) Unfavorite(ctx context.Context, userID, bookID uuid.UUID) error {
	exists, err := s.favRepo.Exists(ctx, userID, bookID)
	if err != nil {
		return fmt.Errorf("checking favorite: %w", err)
	}
	if !exists {
		return ErrFavoriteNotFound
	}

	if err := s.favRepo.Delete(ctx, userID, bookID); err != nil {
		return fmt.Errorf("deleting favorite: %w", err)
	}
	return nil
}

// IsFavorited checks if a book is favorited by the user.
func (s *BookFavoriteService) IsFavorited(ctx context.Context, userID, bookID uuid.UUID) (bool, error) {
	return s.favRepo.Exists(ctx, userID, bookID)
}

// ListFavorites returns a user's favorites with pagination.
func (s *BookFavoriteService) ListFavorites(ctx context.Context, userID uuid.UUID, page, perPage int) ([]*ent.BookFavorite, int, error) {
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 100 {
		perPage = 20
	}
	offset := (page - 1) * perPage
	return s.favRepo.GetByUserID(ctx, userID, perPage, offset)
}

// GetFavoriteCount returns the total favorite count for a book.
func (s *BookFavoriteService) GetFavoriteCount(ctx context.Context, bookID uuid.UUID) (int, error) {
	return s.favRepo.CountByBookID(ctx, bookID)
}
