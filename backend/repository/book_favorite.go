package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/ent/bookfavorite"
)

// BookFavoriteRepository handles data access for BookFavorite entities.
type BookFavoriteRepository struct {
	client *ent.Client
}

// NewBookFavoriteRepository creates a new BookFavoriteRepository.
func NewBookFavoriteRepository(client *ent.Client) *BookFavoriteRepository {
	return &BookFavoriteRepository{client: client}
}

// Create creates a new favorite record. Returns existing if already exists.
func (r *BookFavoriteRepository) Create(ctx context.Context, userID, bookID uuid.UUID) (*ent.BookFavorite, error) {
	// Check for existing
	existing, err := r.client.BookFavorite.Query().
		Where(bookfavorite.UserIDEQ(userID)).
		Where(bookfavorite.BookIDEQ(bookID)).
		Only(ctx)
	if err == nil {
		return existing, nil // already favorited
	}

	fav, err := r.client.BookFavorite.Create().
		SetUserID(userID).
		SetBookID(bookID).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("creating favorite: %w", err)
	}
	return fav, nil
}

// Delete removes a favorite record.
func (r *BookFavoriteRepository) Delete(ctx context.Context, userID, bookID uuid.UUID) error {
	_, err := r.client.BookFavorite.Delete().
		Where(bookfavorite.UserIDEQ(userID)).
		Where(bookfavorite.BookIDEQ(bookID)).
		Exec(ctx)
	if err != nil {
		return fmt.Errorf("deleting favorite: %w", err)
	}
	return nil
}

// Exists checks if a favorite exists for the given user and book.
func (r *BookFavoriteRepository) Exists(ctx context.Context, userID, bookID uuid.UUID) (bool, error) {
	count, err := r.client.BookFavorite.Query().
		Where(bookfavorite.UserIDEQ(userID)).
		Where(bookfavorite.BookIDEQ(bookID)).
		Count(ctx)
	if err != nil {
		return false, fmt.Errorf("checking favorite: %w", err)
	}
	return count > 0, nil
}

// GetByUserID returns all favorites for a user with pagination.
func (r *BookFavoriteRepository) GetByUserID(ctx context.Context, userID uuid.UUID, limit, offset int) ([]*ent.BookFavorite, int, error) {
	total, err := r.client.BookFavorite.Query().
		Where(bookfavorite.UserIDEQ(userID)).
		Count(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("counting favorites: %w", err)
	}

	favorites, err := r.client.BookFavorite.Query().
		Where(bookfavorite.UserIDEQ(userID)).
		WithBook().
		Order(ent.Desc(bookfavorite.FieldCreatedAt)).
		Offset(offset).
		Limit(limit).
		All(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("listing favorites: %w", err)
	}

	return favorites, total, nil
}

// CountByBookID returns the total number of favorites for a book.
func (r *BookFavoriteRepository) CountByBookID(ctx context.Context, bookID uuid.UUID) (int, error) {
	count, err := r.client.BookFavorite.Query().
		Where(bookfavorite.BookIDEQ(bookID)).
		Count(ctx)
	if err != nil {
		return 0, fmt.Errorf("counting favorites: %w", err)
	}
	return count, nil
}
