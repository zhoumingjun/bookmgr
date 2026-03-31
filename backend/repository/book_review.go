package repository

import (
	"context"
	"fmt"

	"github.com/google/uuid"

	"github.com/zhoumingjun/bookmgr/backend/ent"
	"github.com/zhoumingjun/bookmgr/backend/ent/book"
	"github.com/zhoumingjun/bookmgr/backend/ent/bookreview"
)

// BookReviewRepository handles data access for BookReview entities.
type BookReviewRepository struct {
	client *ent.Client
}

// NewBookReviewRepository creates a new BookReviewRepository.
func NewBookReviewRepository(client *ent.Client) *BookReviewRepository {
	return &BookReviewRepository{client: client}
}

// CreateReviewParams holds fields for creating a review record.
type CreateReviewParams struct {
	BookID     uuid.UUID
	ReviewerID uuid.UUID
	StatusFrom string
	StatusTo   string
	Reason     string
}

// Create creates a new BookReview record.
func (r *BookReviewRepository) Create(ctx context.Context, params CreateReviewParams) (*ent.BookReview, error) {
	br, err := r.client.BookReview.Create().
		SetBookID(params.BookID).
		SetReviewerID(params.ReviewerID).
		SetStatusFrom(params.StatusFrom).
		SetStatusTo(params.StatusTo).
		SetReason(params.Reason).
		Save(ctx)
	if err != nil {
		return nil, fmt.Errorf("creating book review: %w", err)
	}
	return br, nil
}

// ListByBookID returns all review records for a book.
func (r *BookReviewRepository) ListByBookID(ctx context.Context, bookID uuid.UUID) ([]*ent.BookReview, error) {
	reviews, err := r.client.BookReview.Query().
		Where(bookreview.HasBookWith(book.ID(bookID))).
		Order(ent.Desc(bookreview.FieldCreatedAt)).
		All(ctx)
	if err != nil {
		return nil, fmt.Errorf("listing book reviews: %w", err)
	}
	return reviews, nil
}

// ListPending returns all books with pending status.
func (r *BookReviewRepository) ListPending(ctx context.Context, limit, offset int) ([]*ent.Book, int, error) {
	total, err := r.client.Book.Query().
		Where(book.Status("pending")).
		Count(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("counting pending books: %w", err)
	}

	books, err := r.client.Book.Query().
		Where(book.Status("pending")).
		Order(ent.Desc(book.FieldCreatedAt)).
		Offset(offset).
		Limit(limit).
		All(ctx)
	if err != nil {
		return nil, 0, fmt.Errorf("listing pending books: %w", err)
	}

	return books, total, nil
}
